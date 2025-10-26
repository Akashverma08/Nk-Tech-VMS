import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InteractiveBackground from "./InteractiveBackground";


import NKLogo from "../assets/NK-Logo.png";
import NKOnlyLogo from "../assets/NKOnlyLogo.png";


function VisitorForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    aadhar: "",
    purpose: "",
    toMeet: "",
    otherPerson: "",
    companyName: "",
    personType: "",
    gateNumber: "1",
    vehicleNumber: "",
    laptop: "No",
  });

  const [photoUrl, setPhotoUrl] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const personsList = [
    { name: "GAURAV BHALOTIA", email: "akashverm0701@gmail.com" },
    { name: "NAVEEN BHALOTIA", email: "vermadevil0401@gmail.com" },
    { name: "ASHWINI KUMAR", email: "akashverm0701@gmail.com" },
    { name: "SHAFIQULLAH", email: "vermadevil0401@gmail.com" },
    { name: "SHAILENDRA SINGH", email: "akashverm0701@gmail.com" },
    { name: "NIRAJ KISHORE", email: "vermadevil0401@gmail.com" },
    { name: "Logiclens", email: "akashverm0701@gmail.com" },
  ];

  const personTypes = [
    "Vendor",
    "Contractor",
    "Guest",
    
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenCamera = async () => {
  try {
    // Ask for camera permission first
    await navigator.mediaDevices.getUserMedia({ video: true });
    setIsCameraOpen(true);
  } catch (err) {
    console.error("Camera permission error:", err);
    alert("Please allow camera access to continue. Check your browser settings.");
  }
};


  const capturePhoto = async () => {
  const imageSrc = webcamRef.current?.getScreenshot();
  if (!imageSrc) return;

  // Convert base64 → Blob
  const response = await fetch(imageSrc);
  const blob = await response.blob();

  // Create an image object
  const img = new Image();
  img.src = URL.createObjectURL(blob);

  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Resize: max width 800px
    const MAX_WIDTH = 800;
    let width = img.width;
    let height = img.height;

    if (width > MAX_WIDTH) {
      height = (MAX_WIDTH / width) * height;
      width = MAX_WIDTH;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    // Compress to JPG (70% quality)
    const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);

    // Save compressed photo
    setPhotoUrl(compressedDataUrl);
    setIsCameraOpen(false);

    console.log("📷 Compressed photo size:", Math.round(compressedDataUrl.length / 1024), "KB");
  };
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = ["name", "email", "mobile", "aadhar", "purpose", "toMeet", "personType"];
    for (let field of requiredFields) {
      if (!formData[field]?.trim()) {
        toast.warn(`⚠️ Please fill in ${field}`);
        return;
      }
    }

    if (!photoUrl) {
      toast.warn("⚠️ Please capture a photo");
      return;
    }

    const selectedHost = personsList.find((p) => p.name === formData.toMeet);

    const payload = {
      ...formData,
      hostEmail: selectedHost?.email || "",
      photo: photoUrl,
    };

    console.log("Payload to backend:", payload);

    try {
      setLoading(true);
      setStep(2);
      // ✅ Debug photo size before sending
      if (payload.photo) {
        console.log("Photo length:", payload.photo.length);
      }

      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/visitors/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Server response:", data);

      if (!res.ok || !data?.data?._id) {
        throw new Error(data?.error || "Registration failed, please try again.");
      }

      toast.success("✅ Visitor registered successfully!");
      navigate(`/loading/${data.data._id}`);

      setFormData({
        name: "",
        email: "",
        mobile: "",
        aadhar: "",
        purpose: "",
        toMeet: "",
        otherPerson: "",
        companyName: "",
        personType: "",
        gateNumber: "1",
        vehicleNumber: "",
        laptop: "No",
      });
      setPhotoUrl("");
      setIsCameraOpen(false);
    } catch (err) {
      console.error("Error submitting form:", err);
      toast.error(`⚠️ ${err.message || "Error submitting form. Check server connection."}`);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 position-relative">
      <div className="background-container">
        <InteractiveBackground />
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop />

      {/* Header */}
      <header className="header-fixed">
        <div className="d-flex align-items-center">
          <img src={NKLogo} alt="Bebbco" className="company-logo" />
          <div>
            <h3 className="company-name">NK-TechUnion</h3>
            <div className="vms-info">
              <span className="vms-title">Visitor Management System</span>
              <span className="vms-tagline">Secure • Digital • Efficient</span>
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center">
          <div className="powered-by-text">
            <small>Powered by</small>
            <span className="logiclens-name">NK-TechUnion</span>
          </div>
          <img src={NKOnlyLogo} alt="Nk-TechUnion" className="NK-logo" />
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="form-container">
          <div className="form-card">
            <div className="form-header">
              <h2>Visitor Registration</h2>
              <p>Please fill in your details to register your visit</p>
            </div>

            {/* Step Indicator */}
            <div className="step-indicator">
              <div className="step-item">
                <span className={`step-badge ${step >= 1 ? "active" : ""}`}>1</span>
                <span className="step-label">Visitor Details</span>
              </div>
              <div className="step-line"></div>
              <div className="step-item">
                <span className={`step-badge ${step >= 2 ? "active" : ""}`}>2</span>
                <span className="step-label">Processing</span>
              </div>
              <div className="step-line"></div>
              <div className="step-item">
                <span className="step-badge">3</span>
                <span className="step-label">Pass Generation</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="visitor-form">
              {/* Row 1 */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" name="name" className="form-input" placeholder="Enter full name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input type="tel" name="mobile" className="form-input" placeholder="Enter mobile number" value={formData.mobile} onChange={handleChange} pattern="[0-9]{10}" title="Mobile must be 10 digits" required />
                </div>
              </div>

              {/* Row 2 */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" name="email" className="form-input" placeholder="Enter email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Aadhaar Number</label>
                  <input type="text" name="aadhar" className="form-input" placeholder="Enter Aadhaar number" value={formData.aadhar} onChange={handleChange} pattern="[0-9]{12}" title="Aadhaar must be 12 digits" required />
                </div>
              </div>

              {/* Row 3 */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input type="text" name="companyName" className="form-input" placeholder="Enter company name" value={formData.companyName} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type of Person</label>
                  <select name="personType" className="form-input" value={formData.personType} onChange={handleChange} required>
                    <option value="">Select Type</option>
                    {personTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4 */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gate Number</label>
                  <select name="gateNumber" className="form-input" value={formData.gateNumber} onChange={handleChange}>
                    <option value="1">Gate 1</option>
                    <option value="2">Gate 2</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Number</label>
                  <input type="text" name="vehicleNumber" className="form-input" placeholder="Enter vehicle number" value={formData.vehicleNumber} onChange={handleChange} />
                </div>
              </div>

              {/* Row 5 */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Carrying Laptop?</label>
                  <select name="laptop" className="form-input" value={formData.laptop} onChange={handleChange}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              {/* Purpose */}
              <div className="form-group full-width">
                <label className="form-label">Purpose of Visit</label>
                <textarea name="purpose" className="form-input" placeholder="Enter purpose of your visit" value={formData.purpose} onChange={handleChange} rows="2" required />
              </div>

              {/* Person to Meet */}
              <div className="form-group full-width">
                <label className="form-label">Person to Meet</label>
                <select name="toMeet" className="form-input" value={formData.toMeet} onChange={handleChange} required>
                  <option value="">Select Person</option>
                  {personsList.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Camera Section */}
              <div className="form-group full-width">
                <label className="form-label">Visitor Photo</label>
                {!photoUrl && !isCameraOpen && (
                  <button type="button" className="camera-button" onClick={handleOpenCamera}>Open Camera</button>
                )}

                {isCameraOpen && (
                  <div className="camera-section">
                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="webcam" videoConstraints={{ facingMode: "user", width: 450, height: 338 }} />
                    <div className="camera-controls">
                      <button type="button" className="btn btn-success" onClick={capturePhoto}>Capture</button>
                      <button type="button" className="btn btn-danger" onClick={() => setIsCameraOpen(false)}>Cancel</button>
                    </div>
                  </div>
                )}

                {photoUrl && (
                  <div className="photo-preview">
                    <img src={photoUrl} alt="Captured" className="captured-photo" />
                    <button type="button" className="btn btn-warning" onClick={() => setPhotoUrl("")}>Retake Photo</button>
                  </div>
                )}
              </div>

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? <>Processing...</> : <>Generate Visitor Pass</>}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src={NKOnlyLogo} alt="Bebbco" className="footer-logo" />
            
            <span className="footer-tagline">Secure Visitor Management</span>
          </div>
          <div className="footer-divider">|</div>
          <div className="footer-tech">
            <span>Powered by</span>
            <img src={NKOnlyLogo} alt="LogicLens" className="footer-logo-small" />
            <span className="footer-logiclens"> TechUnion</span>
          </div>
        </div>
        <small className="footer-copyright">© 2025 NK-TechUnion Solutions. All rights reserved.</small>
      </footer>
    </div>
  );
}

export default VisitorForm;
