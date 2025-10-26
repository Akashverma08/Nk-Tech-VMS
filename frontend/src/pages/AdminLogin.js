// frontend/src/pages/AdminLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import InteractiveBackground from "./InteractiveBackground";

import NKLogo from "../assets/NK-Logo.png";
import NKOnlyLogo from "../assets/NKOnlyLogo.png";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate loading delay for better UX
    setTimeout(() => {
      if (username === "admin" && password === "1234") {
        localStorage.setItem("isAdmin", "true");
        navigate("/admin");
      } else {
        setError("Invalid username or password");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-vh-100 position-relative">
      {/* Interactive Background */}
      <div className="background-container">
        <InteractiveBackground />
      </div>

      {/* Header */}
      <header className="header-fixed">
        {/* Left: Bebbco + VMS */}
        <div className="d-flex align-items-center">
          <img
            src={NKLogo}
            alt="Bebbco"
            className="company-logo"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div>
            <h3 className="company-name">NK-TechUnion</h3>
            <div className="vms-info">
              <span className="vms-title">Visitor Management System</span>
              <span className="vms-tagline">Secure • Digital • Efficient</span>
            </div>
          </div>
        </div>

        {/* Right: Powered by LogicLens */}
        <div className="d-flex align-items-center">
          <div className="powered-by-text">
            <small>Powered by</small>
            <span className="logiclens-name">NK-TechUnion</span>
          </div>
          <img
            src={NKOnlyLogo}
            alt="LogicLens"
            className="NK-logo"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="form-container">
          <div className="form-card">
            {/* Admin Login Header */}
            <div className="admin-login-header">
              
              <h2>Admin Access</h2>
              <p>Secure login for administrative dashboard</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger" style={{ 
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#dc2626',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '24px',
                fontSize: '14px'
              }}>
                <i className="fas fa-exclamation-circle me-2"></i>
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="admin-form">
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-user"></i>Administrator Username
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-lock"></i>Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="submit-button admin-login-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i>
                    Access Dashboard
                  </>
                )}
              </button>
            </form>

            {/* Security Note */}
            <div className="security-note">
              <div className="security-icon">
                <i className="fas fa-info-circle"></i>
              </div>
              <div className="security-text">
                <small>
                  <strong>Authorized Personnel Only</strong><br/>
                  This area is restricted to authorized administrators only.
                </small>
              </div>
            </div>

            {/* Quick Access Info */}
            {/* <div className="quick-access-info">
              <h6>Admin Features:</h6>
              <div className="features-list">
                <div className="feature-item">
                  <i className="fas fa-users"></i>
                  <span>Visitor Management</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-chart-bar"></i>
                  <span>Analytics Dashboard</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-cog"></i>
                  <span>System Configuration</span>
                </div>
              </div>
            </div> */}
          </div>

          {/* Back to Visitor Form */}
          <div className="back-to-visitor">
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate("/")}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Back to Visitor Registration
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img 
              src={NKOnlyLogo}
              alt="Bebbco" 
              className="footer-logo"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="footer-tagline">Secure Visitor Management</span>
          </div>
          <div className="footer-divider">|</div>
          <div className="footer-tech">
            <span>Technology by</span>
            <img 
              src={NKOnlyLogo}
              alt="LogicLens" 
              className="footer-logo-small"
            />
            <span className="footer-logiclens"> TechUnion</span>
          </div>
        </div>
        <small className="footer-copyright">
          © 2025 NK. All rights reserved. | Technology Solutions by NK-TechUnion
        </small>
      </footer>
    </div>
  );
}

export default AdminLogin;


// // frontend/src/pages/AdminLogin.jsx
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "bootstrap/dist/css/bootstrap.min.css";

// function AdminLogin() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const handleLogin = (e) => {
//     e.preventDefault();

//     if (username === "admin" && password === "1234") {
//       localStorage.setItem("isAdmin", "true");
//       navigate("/admin");
//     } else {
//       setError("Invalid username or password");
//     }
//   };

//   return (
//     <div
//       className="d-flex flex-column"
//       style={{
//         minHeight: "100vh",
//         background: "linear-gradient(to right, #4ba9d1, #f1f8e9)",
//       }}
//     >
//       {/* Header */}
//       <header
//         className="d-flex align-items-center justify-content-between shadow-sm px-4"
//         style={{
//           background: "white",
//           color: "black",
//           position: "fixed",
//           top: 0,
//           left: 0,
//           width: "100%",
//           height: "80px",
//           zIndex: 1000,
//         }}
//       >
//         <div className="d-flex align-items-center">
//           <img
//             src="/logo.png"
//             alt="Logo"
//             style={{ height: "60px", marginRight: "12px" }}
//           />
//           <h4 className="fw-bold m-0">LogicLens</h4>
//         </div>
//         <h1 className="fw-bold text-center m-0 flex-grow-1">
//           Visitor Management System
//         </h1>
//         <div style={{ minWidth: "220px" }}></div>
//       </header>

//       {/* Main content (centered) */}
//       <main
//         className="flex-grow-1 d-flex justify-content-center align-items-center"
//         style={{ marginTop: "80px", marginBottom: "60px" }} // leaves space for header + footer
//       >
//         <div
//           className="card shadow-lg p-5 border-0"
//           style={{
//             width: "100%",
//             maxWidth: "650px",
//             borderRadius: "16px",
//             background: "#ffffff",
//           }}
//         >
//           <h3
//             className="text-center mb-4 fw-bold"
//             style={{ fontSize: "2.5rem", color: "#2c3e50" }}
//           >
//             Admin Login
//              <div className="d-flex align-items-center justify-content-center mb-4"> 
//                <p className="text-muted m-0 me-2" style={{ fontSize: "0.9rem" }}> Powered by <strong>LogicLens</strong> </p> 
//                <img src="/logo.png" alt="LogicLens Logo" style={{ height: "40px", marginLeft: "3px" }} /> </div>
//           </h3>

//           {error && (
//             <div className="alert alert-danger text-center py-2 mb-3">
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleLogin}>
//             <div className="mb-5">
//               <label className="form-label fw-semibold">Username</label>
//               <input
//                 type="text"
//                 className="form-control form-control-lg"
//                 placeholder="Enter username"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 required
//               />
//             </div>

//             <div className="mb-4">
//               <label className="form-label fw-semibold">Password</label>
//               <input
//                 type="password"
//                 className="form-control form-control-lg"
//                 placeholder="Enter password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//             </div>

//             <button
//               type="submit"
//               className="btn btn-primary w-100 py-3 fw-bold"
//               style={{ fontSize: "1.1rem", borderRadius: "8px" }}
//             >
//               Login
//             </button>
//           </form>
//         </div>
//       </main>

//       {/* Footer (always bottom) */}
//       <footer
//         className="text-center p-3 text-muted"
//         style={{
//           background: " linear-gradient(to right, #4ba9d1, #f1f8e9)",
//           position: "fixed",
//           bottom: 0,
//           left: 0,
//           width: "100%",
//         }}
//       >
//         Powered by <strong>LogicLens</strong> | Secure Visitor Management System
//       </footer>
//     </div>
//   );
// }

// export default AdminLogin;
