const crypto = require("crypto");
const Visitor = require("../models/Visitor");
const { generatePassPDF } = require("../utils/generatePassPDF");
const { uploadToS3 } = require("../utils/s3Upload");
const { sendApprovalRequestToHost, sendApprovalMailToVisitor, sendRejectionMailToVisitor } = require("../utils/mailer");

// Helper: generate visitor code
const generateVisitorCode = () => `NK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

// -----------------------------
// Register Visitor
// -----------------------------

exports.registerVisitor = async (req, res) => {
  try {
    const { 
      name, email, mobile, aadhar, purpose, 
      toMeet, otherPerson, personType, companyName, 
      gateNumber, laptop, vehicleNumber, 
      hostEmail, hostPhone, photo 
    } = req.body;

    // ✅ Validate required fields
    if (
      !name || !email || !mobile || !aadhar || !purpose ||
      !personType || !companyName || !gateNumber ||
      !photo || !hostEmail
    ) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    // Upload photo to S3
    let photoUrl;
    try {
      console.log("Base64 photo length:", photo.length);

      const base64Data = Buffer.from(
        photo.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );

      console.log("Decoded buffer size:", base64Data.length);

      const fileName = `${Date.now()}-${name.replace(/\s/g,"_")}.png`;
      const s3Result = await uploadToS3(base64Data, fileName, "visitor-photos");

      photoUrl = s3Result.Location;
      console.log("✅ S3 upload success:", photoUrl);
    } catch (err) {
      console.error("❌ S3 photo upload failed:", err.message);
      return res.status(500).json({ success: false, error: "Photo upload failed" });
    }

    // Generate visitor code + approval token
    const visitorCode = generateVisitorCode();
    const approvalToken = crypto.randomBytes(16).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Save visitor
    const visitor = new Visitor({
      name,
      email,
      mobile,
      aadhar,
      purpose,
      toMeet,
      otherPerson,
      personType,
      companyName,
      gateNumber,
      laptop,
      vehicleNumber,
      hostEmail,
      hostPhone,
      photoUrl,
      visitorCode,
      status: "pending",
      approvalToken,
      tokenExpiresAt,
    });

    const savedVisitor = await visitor.save();

    // Send email to host
    await sendApprovalRequestToHost(hostEmail, savedVisitor);

    res.status(201).json({ success: true, data: savedVisitor });
  } catch (err) {
    console.error("❌ Error in registerVisitor:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};








// Visitor Decision (Approve/Reject)
exports.visitorDecision = async (req, res) => {
  try {
    const { token } = req.params;
    const { status } = req.query;
    console.log("🔔 /decision hit with:", { token, status });

    if (!["approved", "rejected"].includes(status)) {
      console.log("❌ Invalid status received:", status);
      return res.send("<h2>Invalid action</h2>");
    }

    const visitor = await Visitor.findOne({ approvalToken: token });
    if (!visitor) {
      console.log("❌ No visitor found for token:", token);
      return res.send("<h2>Visitor not found</h2>");
    }

    console.log("🆔 Visitor found:", {
      id: visitor._id.toString(),
      currentStatus: visitor.status,
      tokenExpiresAt: visitor.tokenExpiresAt,
    });

    if (visitor.tokenExpiresAt && new Date() > visitor.tokenExpiresAt) {
      console.log("⌛ Token expired for:", visitor._id.toString());
      return res.send("<h2>Token Expired</h2>");
    }

    if (visitor.status !== "pending") {
      console.log("ℹ️ Already decided as:", visitor.status);
      return res.send(`<h2>Already ${visitor.status}</h2>`);
    }

    visitor.status = status;
    visitor.decisionAt = new Date();
    await visitor.save();
    console.log("✅ Status updated to:", status, "for visitor:", visitor._id.toString());

    if (status === "approved") {
      try {
        console.log("📝 Generating PDF...");
        const pdfBuffer = await generatePassPDF(visitor, process.env.FRONTEND_BASE_URL);
        const pdfKey = `visitor-passes/${Date.now()}-${visitor.name.replace(/\s/g,"_")}.pdf`;
        const pdfS3 = await uploadToS3(pdfBuffer, pdfKey, "application/pdf");
        visitor.pdfUrl = pdfS3.Location;
        await visitor.save();
        console.log("📎 PDF uploaded and URL saved:", visitor.pdfUrl);

        if (visitor.email) {
          console.log("📧 Sending approval email to visitor:", visitor.email);
          await sendApprovalMailToVisitor(visitor);
          console.log("✅ Approval email sent");
        }
      } catch (err) {
        console.error("⚠️ PDF generation/email failed:", err);
      }
    } else {
      if (visitor.email) {
        console.log("📧 Sending rejection email to visitor:", visitor.email);
        await sendRejectionMailToVisitor(visitor);
        console.log("✅ Rejection email sent");
      }
    }

    // Show confirm page to host so they don't see a blank page.
    return res.send(`
      <div style="font-family: Arial, sans-serif; padding: 30px; text-align: center;">
        <h2>Visitor request <span style="color: ${status === 'approved' ? '#28a745' : '#dc3545'}">${status.toUpperCase()}</span></h2>
        <p>You can now close this window.</p>
      </div>
    `);

  } catch (err) {
    console.error("💥 Error in visitorDecision:", err);
    res.status(500).send("<h2>Server error</h2>");
  }
};




// -----------------------------
// Get visitor status (for frontend polling)
// -----------------------------
exports.getVisitorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findById(id).select("_id status name visitorCode");
    if (!visitor) return res.status(404).json({ success: false, message: "Visitor not found" });
    return res.json({ success: true, data: visitor });
  } catch (err) {
    console.error("Error fetching visitor status:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// -----------------------------
// Expire visitor (timer endpoint)
// -----------------------------
exports.expireVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findById(id);
    if (!visitor) return res.status(404).json({ success: false, message: "Visitor not found" });

    visitor.status = "expired";
    await visitor.save();
    res.json({ success: true, message: "Visitor expired" });
  } catch (err) {
    console.error("Error expiring visitor:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};




// -----------------------------
// Get All Visitors
// -----------------------------
exports.getAllVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ createdAt: -1 });
    res.json({ success: true, data: visitors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};





// -----------------------------
// Get Visitor by ID
// -----------------------------
exports.getVisitorById = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id).lean();
    if (!visitor) {
      return res.status(404).json({ success: false, error: "Visitor not found" });
    }

    res.json({ success: true, data: visitor }); // ✅ send all fields from MongoDB
  } catch (err) {
    console.error("❌ getVisitorById error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

