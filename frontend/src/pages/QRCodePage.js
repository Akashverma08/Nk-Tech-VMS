import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InteractiveBackground from "./InteractiveBackground";


import NKLogo from "../assets/NK-Logo.png";
import NKOnlyLogo from "../assets/NKOnlyLogo.png";
function QRCodePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE =
    process.env.REACT_APP_API_URL?.replace(/\/+$/, "") || "http://localhost:5000";

  useEffect(() => {
    if (!id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/visitors/${id}`);
        const data = await res.json();
        console.log("Visitor Data:", data.data); // 👈 Add this line here

        if (data.success && data.data) {
          setVisitor(data.data);
          if (data.data.status !== "pending") {
            setLoading(false);
            clearInterval(interval);
          }
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, API_BASE]);

      // ✅ FIXED: Print function that hides only during print
  const handlePrint = () => {
    const printStyle = document.createElement("style");
    printStyle.id = "print-cleanup-styles";
    printStyle.textContent = `
  @media print {
    @page { size: A4; margin: 8mm; }

    html, body { 
      width: 100% !important; 
      margin: 0 !important; 
      padding: 0 !important; 
      background: #fff !important;
      color: #000 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Hide unwanted UI */
    header, footer, .footer, .header-fixed,
    .success-banner, .step-indicator,
    .action-section, .no-print,
    .background-container,
    button, .btn {
      display: none !important;
    }

    /* Visitor Pass Card */
    .visitor-pass-card {
      width: 100% !important;
      border: 2px solid #000 !important;
      background: #fff !important;
      color: #000 !important;
      box-shadow: none !important;
      margin: 0 !important;
      overflow: visible !important;   /* 👈 allow signatures */
    }

    /* Force all text to black */
    * {
      color: #000 !important;
      text-shadow: none !important;
    }

    /* Table borders & headers */
    table, th, td {
      border: 1px solid #000 !important;
      color: #000 !important;
    }
    thead th {
      background: #000 !important;
      color: #fff !important;
    }

    /* Show signature lines */
    .only-print {
      display: flex !important;       /* 👈 force visible on print */
      justify-content: space-between !important;
      margin-top: 30px !important;
    }

    .signature-line {
      width: 45% !important;
      text-align: center !important;
      font-weight: bold !important;
      color: #000 !important;
    }

    .signature-line hr {
      border: 1px solid #000 !important;
      margin: 10px 0 !important;
      height: 0 !important;
    }
  }
`;




    document.head.appendChild(printStyle);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        const styleElement = document.getElementById("print-cleanup-styles");
        if (styleElement) document.head.removeChild(styleElement);
      }, 1000);
    }, 100);
  };

  if (loading) {
    return (
      <div className="qr-loading-page">
        <div className="background-container">
          <InteractiveBackground />
        </div>
        <div className="loading-spinner-container">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <h4 className="loading-text">Loading Visitor Pass...</h4>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qr-error-page">
        <div className="background-container">
          <InteractiveBackground />
        </div>
        <div className="error-container">
          <div className="error-card">
            <div className="error-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Error Loading Visitor Pass</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              <i className="fas fa-home me-2"></i>
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  let formattedDate = "Not Available";
  let formattedTime = "";
  if (visitor?.createdAt && !isNaN(new Date(visitor.createdAt))) {
    formattedDate = new Date(visitor.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    formattedTime = new Date(visitor.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  return (
    <div className="qr-page">
      <div className="background-container">
        <InteractiveBackground />
      </div>

      {/* Header */}
      <header className="header-fixed no-print">
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
          <img src={NKOnlyLogo} alt="LogicLens" className="NK-logo" />
        </div>
      </header>

      {/* Banner */}
      <div className="success-banner no-print">
        <div className="success-content">
          <div className="success-icon">
            <i className="fas fa-check"></i>
          </div>
          <div>
            <h2>Approval Confirmed</h2>
            <p>Your visitor gate pass has been successfully approved</p>
          </div>
        </div>
      </div>

      {/* Pass Section */}
      <main className="qr-main">
        <div
        className="pass-container d-flex flex-column align-items-center justify-content-center mt-5 mb-5"
        
        >
          <div
            className="visitor-pass-card border rounded shadow p-4 bg-white"
            id="pass-ready"
            style={{ width: "1100px" }}
            
          >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center border-bottom border-primary pb-2 mb-3">
              {/* Left side: Bebbco logo + text */}
              <div className="d-flex align-items-center">
                <img src={NKOnlyLogo} alt="Bebbco" className="company-logo me-2" />
                <span className="fw-bold fs-4">NK - Visitor Pass</span>
              </div>
              {/* Right side: Issued By + LogicLens logo */}
              <div className="d-flex align-items-center">
                <small className="fw-semibold text-secondary me-1 fs-8">Issued By NK-TechUnion</small>
                <img src={NKOnlyLogo} alt="LogicLens" className="logiclens-logo" style={{ width: "35px", height: "auto" }} />
              </div>
            </div>


            <div className="row">
              {/* Left Side - Visitor Details */}
              <div className="col-md-6 border-end">
                <div className="d-flex mb-3">
                  <img
                    src={visitor.photoUrl || "/default-avatar.png"}
                    alt="Visitor"
                    className="border rounded shadow-sm me-3"
                    style={{ width: "120px", height: "150px", objectFit: "cover" }}
                  />
                  <div>
                    {[
                      { label: "Name:", value: visitor.name },
                      {
                        label: "Visit Date:",
                        value: `${formattedDate} ${formattedTime}`,
                      },
                      { label: "Valid Till:", value: "Today 6 PM" },
                      { label: "Contact No:", value: visitor.mobile || "N/A" },
                      { label: "Type of Person:", value: visitor.personType || "N/A" },
                      { label: "Company Name:", value: visitor.companyName || "N/A" },
                      { label: "Purpose of Visit:", value: visitor.purpose || "N/A" },
                      { label: "Gate Number:", value: visitor.gateNumber || "N/A" },
                      { label: "Laptop:", value: visitor.laptop || "No" },
                      { label: "Vehicle Number:", value: visitor.vehicleNumber || "N/A" },
                      { label: "Aadhar No:", value: visitor.aadhar || "N/A" },
                      { label: "Host Name:", value: visitor.toMeet || "N/A" },
                    ].map((item, i) => (
                      <div className="d-flex mb-1" key={i}>
                        <strong style={{ width: "130px" }}>{item.label}</strong>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Item Details Table */}
                <h6 className="text-primary fw-bold">Item Details</h6>
                <table className="table table-bordered table-sm">
                  <thead className="table-primary text-center">
                    <tr>
                      <th>Laptop No.</th>
                      <th>Vehicle No.</th>
                      <th>Company</th>
                      <th>Gate No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-center">
                      <td>{visitor.laptop || "NA"}</td>
                      <td>{visitor.vehicleNumber || "N/A"}</td>
                      <td>{visitor.companyName || "N/A"}</td>
                      <td>{visitor.gateNumber || "N/A"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right Side - Instructions */}
              <div className="col-md-6">
                <div className="border rounded p-3 bg-light h-100">
                  <h6 className="text-primary fw-bold border-bottom pb-1">
                    Instructions :
                  </h6>
                  <ul className="small mb-0">
                    <li>You are not allowed to work inside plant with this Pass.</li>
                    <li>
                      Please fold the paper from middle to 2 parts as marked in dotted
                      line.
                    </li>
                    <li>
                      Pass is valid for specified date and time only for declared
                      purpose.
                    </li>
                    <li>
                      Pass is non-transferable and to be used only for declared purpose.
                    </li>
                    <li>Photo/video-graphy inside official premises is prohibited.</li>
                    <li>
                      Visitors need to display this card always while inside premises.
                    </li>
                    <li>
                      Concerned contact person would arrange the PPE's for visitor and
                      brief on safety rules.
                    </li>
                    <li>
                      Concerned contact person signs the visitor's Pass at the end of
                      the visit.
                    </li>
                    <li>
                      Pass needs to be returned to security personnel at the gate while
                      exiting.
                    </li>
                    <li>
                      Any material/document required inside the plant must be declared
                      and approved at the gate.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer - Signatures */}
            <div className="d-flex justify-content-between mt-4 only-print">
              <div className="text-center signature-line"  style={{ width: "45%" }}>
                <hr />
                <strong>Entry Signature</strong>
              </div>
              <div className="text-center signature-line" style={{ width: "45%" }}>
                <hr />
                <strong>Exit Signature</strong>
              </div>
            </div>
          </div>
          {/* Buttons Section - Fixed placement below the card */}
            <div className="d-flex justify-content-center mt-3 no-print signature-line">
              <button className="btn btn-outline-secondary me-3 px-4" onClick={handlePrint}>
                <i className="fas fa-print me-2"></i> Print Pass
              </button>
              <button className="btn btn-primary px-4" onClick={() => navigate("/")}>
                <i className="fas fa-plus me-2"></i> Register Another Visitor
              </button>
            </div>
        </div>
      


      </main>
              {/* Print & Register Buttons (outside card, centered) */}
       
      

      {/* Footer */}
      <footer className="footer no-print">
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
        <small className="footer-copyright" >
          © 2025 NK-TechUnion Solutions. All rights reserved.
        </small>
      </footer>
     
    </div>
  );
}

export default QRCodePage;





