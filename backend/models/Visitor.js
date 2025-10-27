const mongoose = require("mongoose");

const VisitorSchema = new mongoose.Schema(
  {
    // Basic info
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true }, 
    mobile: { 
      type: String, 
      required: true, 
      trim: true, 
      minlength: 10, 
      maxlength: 15 
    },
    aadhar: { type: String, required: true, trim: true },
    purpose: { type: String, required: true },

    // Person to meet
    toMeet: { type: String, trim: true },
    otherPerson: { type: String, trim: true },

    // Type of person (Vendor, Contractor, Guest etc.)
    personType: { 
      type: String, 
      enum: ["Vendor", "Contractor", "Guest"], 
      required: true 
    },

    // Company details
    companyName: { type: String, required: true, trim: true },

    // Gate info
    gateNumber: { 
      type: Number, 
      enum: [1, 2], 
      required: true 
    },

    // Laptop entry (Yes/No)
    laptop: { 
      type: String, 
      enum: ["Yes", "No"], 
      default: "No" 
    },

    // Vehicle details (optional)
    vehicleNumber: { type: String, default: "" },

    // 🔑 Store photo as S3 URL
    photoUrl: { type: String, required: true },

    // Visitor Code + QR
    visitorCode: { type: String, unique: true, index: true },
    qrData: { type: String }, 
    qrCode: { type: String }, 

    // Status tracking
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
      index: true,
    },

    // Approval/rejection audit
    approvalToken: { type: String },
    tokenExpiresAt: { type: Date },
    decisionAt: { type: Date },

    // Host details
    hostEmail: { type: String, trim: true },
    hostPhone: { type: String, trim: true },
    approvedBy: { type: String, default: null },

    // PDF storage (S3 URL instead of local path)
    pdfUrl: { type: String },
  },
  { timestamps: true }
);

// 🔹 Auto-generate visitorCode before saving
VisitorSchema.pre("save", function (next) {
  if (!this.visitorCode) {
    this.visitorCode = "VMS-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  }
  next();
});

module.exports = mongoose.model("Visitor", VisitorSchema);
