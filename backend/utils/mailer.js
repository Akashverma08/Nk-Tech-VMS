const nodemailer = require("nodemailer");
require("dotenv").config();
const { generatePassPDF } = require("./generatePassPDF");

// 📌 Setup transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection on startup
transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ SMTP Connection error:", error);
  } else {
    console.log("✅ SMTP Server is ready to send emails");
  }
});

/**
 * Send email to HOST with Approve/Reject buttons
 */
const sendApprovalRequestToHost = async (hostEmail, visitor) => {
  try {
    const approveLink = `${process.env.HOST_DECISION_BASE_URL}/visitors/decision/${visitor.approvalToken}?status=approved`;
    const rejectLink  = `${process.env.HOST_DECISION_BASE_URL}/visitors/decision/${visitor.approvalToken}?status=rejected`;

    const visitDate = new Date(visitor.createdAt).toLocaleDateString();
    const visitTime = new Date(visitor.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>👤 New Visitor Request</h2>
        <p><strong>${visitor.name}</strong> wants to meet you.</p>

        <h3>Visitor Details:</h3>
        <ul>
          <li><strong>Visitor ID:</strong> ${visitor.visitorCode}</li>
          <li><strong>Name:</strong> ${visitor.name}</li>
          <li><strong>Email:</strong> ${visitor.email}</li>
          <li><strong>Phone:</strong> ${visitor.mobile}</li>
          <li><strong>Aadhar:</strong> ${visitor.aadhar || "N/A"}</li>
          <li><strong>Organization:</strong> ${visitor.companyName || "N/A"}</li>
          <li><strong>Visitor Type:</strong> ${visitor.personType || "N/A"}</li>
          <li><strong>Purpose:</strong> ${visitor.purpose}</li>
          <li><strong>To Meet:</strong> ${visitor.toMeet}</li>
          <li><strong>Gate Number:</strong> ${visitor.gateNumber || "N/A"}</li>
          <li><strong>Date:</strong> ${visitDate}</li>
          <li><strong>Time:</strong> ${visitTime}</li>
        </ul>

        <p>Please take action:</p>
        <a href="${approveLink}" style="padding:10px 15px; background:#28a745; color:white; text-decoration:none; margin-right:10px; border-radius:5px;">✅ Approve</a>
        <a href="${rejectLink}" style="padding:10px 15px; background:#dc3545; color:white; text-decoration:none; border-radius:5px;">❌ Reject</a>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: hostEmail,
      subject: `New Visitor Request - ${visitor.name}`,
      html,
    });

    console.log("📨 Approval request sent to host:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending approval request to host:", error.message);
    throw error;
  }
};


/**
 * Send final APPROVAL mail to Visitor (with PDF pass)
 */
const sendApprovalMailToVisitor = async (visitor) => {
  try {
    const pdfBuffer = await generatePassPDF(visitor, process.env.FRONTEND_BASE_URL);

    const visitDate = new Date(visitor.createdAt).toLocaleDateString();
    const visitTime = new Date(visitor.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border-radius: 8px; background: #f9f9f9; border: 1px solid #eee;">
        <h2 style="color: #28a745;">✅ Approval Confirmed</h2>
        <p>Hello <strong>${visitor.name}</strong>,</p>
        <p>Your visitor request has been <span style="color: #28a745; font-weight: bold;">APPROVED</span>.</p>

        <h3>📌 Visit Details</h3>
        <ul>
          <li><strong>Visitor ID:</strong> ${visitor.visitorCode}</li>
          <li><strong>Name:</strong> ${visitor.name}</li>
          <li><strong>Email:</strong> ${visitor.email}</li>
          <li><strong>Phone:</strong> ${visitor.mobile}</li>
          <li><strong>Aadhar:</strong> ${visitor.aadhar || "N/A"}</li>
          <li><strong>Organization:</strong> ${visitor.companyName || "N/A"}</li>
          <li><strong>Visitor Type:</strong> ${visitor.personType || "N/A"}</li>
          <li><strong>Host Name:</strong> ${visitor.toMeet}</li>
          <li><strong>Gate Number:</strong> ${visitor.gateNumber || "N/A"}</li>
          <li><strong>Date:</strong> ${visitDate}</li>
          <li><strong>Time:</strong> ${visitTime}</li>
        </ul>

        <p>Please find your attached visitor pass (PDF). Show it at the gate.</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: visitor.email,
      subject: "✅ Your Visitor Request Approved",
      html,
      attachments: [
        {
          filename: `visitor-pass-${visitor.visitorCode}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    console.log("✅ Approval email sent to visitor:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending approval mail to visitor:", error.message);
    throw error;
  }
};


/**
 * Send REJECTION mail to Visitor
 */
const sendRejectionMailToVisitor = async (visitor) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #dc3545;">❌ Visit Request Declined</h2>
        <p>Hello <strong>${visitor.name}</strong>,</p>
        <p>We regret to inform you that your visitor request has been declined.</p>
        <p>Please contact reception for more details.</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: visitor.email,
      subject: "❌ Visitor Request Declined",
      html,
    });

    console.log("✅ Rejection email sent to visitor:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending rejection email:", error.message);
    throw error;
  }
};

module.exports = {
  sendApprovalRequestToHost,
  sendApprovalMailToVisitor,
  sendRejectionMailToVisitor,
  transporter,
};
