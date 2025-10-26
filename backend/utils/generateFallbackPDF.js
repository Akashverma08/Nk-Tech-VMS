const PDFDocument = require("pdfkit");
const axios = require("axios");

/**
 * Fallback PDF generator using PDFKit (supports remote images)
 * @param {Object} visitorData
 * @returns {Promise<Buffer>}
 */
function generateFallbackPDF(visitorData) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks = [];
      doc.on("data", chunks.push.bind(chunks));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Header
      doc.fontSize(24).fillColor("#2c3e50").text("VISITOR PASS", { align: "center" }).moveDown(1);
      doc.strokeColor("#2c3e50").lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1);

      // Visitor Information
      doc.fontSize(16).fillColor("#34495e").text("VISITOR INFORMATION", { underline: true }).moveDown(0.5);
      doc.fontSize(12).fillColor("black");

      const details = [
        { label: "Name", value: visitorData.name || "N/A" },
        { label: "Visitor Code", value: visitorData.visitorCode || visitorData._id },
        { label: "Purpose", value: visitorData.purpose || "N/A" },
        { label: "Meeting With", value: visitorData.toMeet || "N/A" },
        { label: "Contact", value: visitorData.mobile || "N/A" },
        { label: "Email", value: visitorData.email || "N/A" },
        { label: "Gate Pass", value: visitorData.gatePass || "N/A" },
        { label: "Person Type", value: visitorData.personType || "N/A" },
        { label: "Status", value: (visitorData.status || "pending").toUpperCase() },
      ];

      details.forEach(field => {
        if (field.value && field.value !== "N/A") {
          doc.text(`${field.label}: `, { continued: true, width: 120 })
             .font("Helvetica-Bold")
             .text(field.value)
             .font("Helvetica")
             .moveDown(0.3);
        }
      });

      doc.moveDown(1);

      // Visitor Photo (optional)
      if (visitorData.photoUrl) {
        try {
          const response = await axios.get(visitorData.photoUrl, { responseType: "arraybuffer" });
          const imageBuffer = Buffer.from(response.data, "binary");
          doc.fontSize(14).fillColor("#34495e").text("VISITOR PHOTO", { underline: true, align: "center" }).moveDown(0.3);
          doc.image(imageBuffer, { fit: [150, 150], align: "center" });
          doc.moveDown(1);
        } catch (err) {
          console.warn("⚠️ Could not load visitor photo:", err.message);
        }
      }

      // Visit Details
      doc.fontSize(14).fillColor("#34495e").text("VISIT DETAILS", { underline: true }).moveDown(0.5);
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

      doc.text(`Visit Date: ${visitDate}`);
      doc.text(`Visit Time: ${visitTime}`).moveDown(1);

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

module.exports = { generateFallbackPDF };
