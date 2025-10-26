const Brevo = require("@getbrevo/brevo");
require("dotenv").config();
const { generatePassPDF } = require("./generatePassPDF");

// Initialize Brevo client
const brevoApi = new Brevo.TransactionalEmailsApi();
brevoApi.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

// 📩 Helper function to send email
async function sendEmail({ to, subject, html, attachments }) {
  const email = {
    sender: { name: "NK Tech Union", email: process.env.FROM_EMAIL },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };

  if (attachments?.length) {
    email.attachment = attachments.map((a) => ({
      name: a.filename,
      content: a.content.toString("base64"),
    }));
  }

  try {
    const res = await brevoApi.sendTransacEmail(email);
    console.log("✅ Email sent via Brevo:", res.messageId || res);
  } catch (err) {
    console.error("❌ Email send error:", err.response?.body || err);
  }
}

/**
 * 📨 Send approval request to Host
 */
const sendApprovalRequestToHost = async (hostEmail, visitor) => {
  const approveLink = `${process.env.HOST_DECISION_BASE_URL}/visitors/decision/${visitor.approvalToken}?status=approved`;
  const rejectLink = `${process.env.HOST_DECISION_BASE_URL}/visitors/decision/${visitor.approvalToken}?status=rejected`;

  const visitDate = new Date(visitor.createdAt).toLocaleDateString();
  const visitTime = new Date(visitor.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // ✅ FULL visitor details email
  const html = `
    <div style="font-family:Arial;padding:20px;">
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
        <li><strong>Purpose:</strong> ${visitor.purpose || "N/A"}</li>
        <li><strong>To Meet:</strong> ${visitor.toMeet}</li>
        <li><strong>Gate Number:</strong> ${visitor.gateNumber || "N/A"}</li>
        <li><strong>Date:</strong> ${visitDate}</li>
        <li><strong>Time:</strong> ${visitTime}</li>
      </ul>

      ${
        visitor.photoUrl
          ? `<p><img src="${visitor.photoUrl}" alt="Visitor Photo" width="150" style="border-radius:8px;border:1px solid #ccc;" /></p>`
          : ""
      }

      <p>Please take action:</p>
      <a href="${approveLink}" style="padding:10px 15px;background:#28a745;color:#fff;text-decoration:none;margin-right:10px;border-radius:5px;">✅ Approve</a>
      <a href="${rejectLink}" style="padding:10px 15px;background:#dc3545;color:#fff;text-decoration:none;border-radius:5px;">❌ Reject</a>
    </div>
  `;

  await sendEmail({
    to: hostEmail,
    subject: `New Visitor Request - ${visitor.name}`,
    html,
  });
};

/**
 * ✅ Send approval email to visitor (with PDF)
 */
const sendApprovalMailToVisitor = async (visitor) => {
  const pdfBuffer = await generatePassPDF(visitor, process.env.FRONTEND_BASE_URL);

  const html = `
    <div style="font-family:Arial;padding:20px;">
      <h2 style="color:#28a745;">✅ Approval Confirmed</h2>
      <p>Hello <b>${visitor.name}</b>,</p>
      <p>Your visitor request has been <b style="color:#28a745;">APPROVED</b>.</p>

      <h3>Visit Details:</h3>
      <ul>
        <li><strong>Visitor ID:</strong> ${visitor.visitorCode}</li>
        <li><strong>Name:</strong> ${visitor.name}</li>
        <li><strong>Email:</strong> ${visitor.email}</li>
        <li><strong>Phone:</strong> ${visitor.mobile}</li>
        <li><strong>Organization:</strong> ${visitor.companyName || "N/A"}</li>
        <li><strong>To Meet:</strong> ${visitor.toMeet}</li>
        <li><strong>Gate Number:</strong> ${visitor.gateNumber || "N/A"}</li>
      </ul>

      <p>Your visitor pass (PDF) is attached below. Please show it at the gate.</p>
    </div>
  `;

  await sendEmail({
    to: visitor.email,
    subject: "✅ Your Visitor Request Approved",
    html,
    attachments: [
      {
        filename: `visitor-pass-${visitor.visitorCode}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
};

/**
 * ❌ Send rejection mail to visitor
 */
const sendRejectionMailToVisitor = async (visitor) => {
  const html = `
    <div style="font-family:Arial;padding:20px;">
      <h2 style="color:#dc3545;">❌ Visit Request Declined</h2>
      <p>Hello <b>${visitor.name}</b>,</p>
      <p>We regret to inform you that your visitor request has been declined.</p>
      <p>Please contact reception for more details.</p>
    </div>
  `;

  await sendEmail({
    to: visitor.email,
    subject: "❌ Visitor Request Declined",
    html,
  });
};

module.exports = {
  sendApprovalRequestToHost,
  sendApprovalMailToVisitor,
  sendRejectionMailToVisitor,
};
