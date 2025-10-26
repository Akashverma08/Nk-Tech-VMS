const puppeteer = require("puppeteer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Generate PDF pass for a visitor
 * Attempts Puppeteer first, falls back to PDFKit if Puppeteer fails
 * @param {Object} visitorData
 * @param {string} frontendBaseUrl
 * @returns {Promise<Buffer>}
 */
async function generatePassPDF(visitorData, frontendBaseUrl) {
  let browser;

  try {
    console.log(`Generating PDF pass for: ${visitorData._id}`);

    // Puppeteer URL
    const url = `${frontendBaseUrl.replace(/\/$/, "")}/qrcode/${visitorData._id}`;
    console.log("Opening page:", url);

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-extensions",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Wait for page to fully render
    await page.waitForSelector("#pass-ready", { timeout: 15000 });

    await page.emulateMediaType("print");

    // ✅ Inject CSS to fix invisible text & hide buttons
    await page.addStyleTag({
  content: `
    @media print {
      @page { 
        size: A4;
        margin: 8mm; 
      }

      html, body {
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        font-size: 12pt !important;
        background: white !important;
      }

      html, body, * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        color: #000 !important;
        opacity: 1 !important;
      }

      header, footer, .footer, .header-fixed, 
      .success-banner, .step-indicator, .action-section,
      .background-container, .no-print {
        display: none !important;
      }

      .qr-main {
        width: 100% !important;
        max-width: none !important;
        padding: 0 !important;
        margin: 0 !important;
        min-height: auto !important;
      }

      .pass-container {
        width: 100% !important;
        max-width: none !important;
        margin: 0 auto !important;
        padding: 0 !important;
      }

      .visitor-pass-card {
        width: 100% !important;
        max-width: none !important;
        margin: 0 auto !important;
        box-shadow: none !important;
        border: 2px solid #333 !important;
        page-break-inside: avoid;
        min-height: auto !important;
        background: white !important;
      }

      .pass-header, 
      .visitor-photo-section, 
      .visitor-info, 
      .pass-footer {
        width: 100% !important;
        max-width: none !important;
      }

      .pass-header {
        background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
        color: white !important;
      }

      .info-item {
        background: #f9fafb !important;
        border-left: 4px solid #2563eb !important;
      }

      .pass-footer {
        background: #111827 !important;
        color: white !important;
      }

      .only-print {
        display: flex !important;
        justify-content: space-between !important;
        margin-top: 20px !important;
      }
      .only-print div {
        width: 45% !important;
        text-align: center !important;
      }
      .only-print hr {
        border: 1px solid #000 !important;
        margin-bottom: 5px !important;
      }
    }
  `
});


    // 🔽 Now generate PDF
    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      format: "A4",
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });

    console.log("✅ PDF generated using Puppeteer.");
    return pdfBuffer;
  } catch (error) {
    console.error("⚠️ Puppeteer PDF generation failed:", error.message);
    console.log("Falling back to PDFKit generator...");
    return generateFallbackPDF(visitorData);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.warn("Error closing Puppeteer browser:", closeError.message);
      }
    }
  }
}

/**
 * Fallback PDF generator using PDFKit (No QR code)
 * @param {Object} visitorData
 * @returns {Promise<Buffer>}
 */
function generateFallbackPDF(visitorData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks = [];
      doc.on("data", chunks.push.bind(chunks));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Header
      doc.fontSize(24).fillColor("#000000").text("VISITOR PASS", { align: "center" }).moveDown(1);

      doc.strokeColor("#000000").lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1);

      // Visitor Information
      doc.fontSize(16).fillColor("#000000").text("VISITOR INFORMATION", { underline: true }).moveDown(0.5);
      doc.fontSize(12).fillColor("black");

      const details = [
        { label: "Name", value: visitorData.name || "N/A" },
        { label: "Visitor Code", value: visitorData.visitorCode || visitorData._id },
        { label: "Purpose", value: visitorData.purpose || "N/A" },
        { label: "Meeting With", value: visitorData.toMeet || "N/A" },
        { label: "Contact", value: visitorData.mobile || "N/A" },
        { label: "Email", value: visitorData.email || "N/A" },
        { label: "Status", value: (visitorData.status || "pending").toUpperCase() },
      ];

      details.forEach((field) => {
        if (field.value && field.value !== "N/A") {
          doc.text(`${field.label}: `, { continued: true, width: 120 })
            .font("Helvetica-Bold")
            .text(field.value)
            .font("Helvetica")
            .moveDown(0.3);
        }
      });

      doc.moveDown(1);

      
      // ✅ Signature Section
      doc.moveDown(4);
      doc.strokeColor("#000000").lineWidth(1);

      // Entry Signature line
      doc.moveTo(100, doc.y).lineTo(250, doc.y).stroke();
      doc.text("Entry Signature", 100, doc.y + 5, { width: 150, align: "center" });

      // Exit Signature line
      doc.moveTo(350, doc.y - 5).lineTo(500, doc.y - 5).stroke();
      doc.text("Exit Signature", 350, doc.y + 5, { width: 150, align: "center" });

      doc.moveDown(2);

      // Visitor Photo (optional)
      if (visitorData.photoUrl) {
        try {
          const photoPath = path.join(__dirname, "../", visitorData.photoUrl);
          if (fs.existsSync(photoPath)) {
            doc.fontSize(14).fillColor("#000000").text("VISITOR PHOTO", { underline: true, align: "center" }).moveDown(0.3);
            doc.image(photoPath, { fit: [150, 150], align: "center" });
            doc.moveDown(1);
          }
        } catch (photoErr) {
          console.warn("Error adding visitor photo:", photoErr.message);
        }
      }

      // Visit Details
      doc.fontSize(14).fillColor("#000000").text("VISIT DETAILS", { underline: true }).moveDown(0.5);
      doc.fontSize(10).fillColor("black");

      const visitDate = new Date(visitorData.createdAt || new Date()).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const visitTime = new Date(visitorData.createdAt || new Date()).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      doc.text(`Visit Date: ${visitDate}`).text(`Visit Time: ${visitTime}`).moveDown(1);

      // Footer
      doc.fontSize(8).fillColor("gray")
        .text(`Generated: ${new Date().toLocaleString()}`, { align: "right" })
        .moveDown(0.5)
        .text("Please present this pass at reception", { align: "center" })
        .text("Valid for authorized visit only", { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePassPDF };
