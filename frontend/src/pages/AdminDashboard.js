import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import InteractiveBackground from "./InteractiveBackground";

import NKLogo from "../assets/NK-Logo.png";

function AdminDashboard() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/+$/, "") || "http://localhost:5000";

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) navigate("/admin-login");
  }, [navigate]);

  useEffect(() => {
    fetch(`${API_BASE}/api/visitors`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setVisitors(data.data);
        else setError("Failed to load visitors");
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching visitors:", err);
        setError("Backend not reachable");
        setLoading(false);
      });
  }, [API_BASE]);

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/admin-login");
  };

  // Filter visitors based on date range and search term
  const filteredVisitors = visitors.filter((v) => {
    const visitDate = new Date(v.createdAt);
    const dateInRange = 
      (!fromDate || visitDate >= new Date(fromDate)) &&
      (!toDate || visitDate <= new Date(toDate));
    
    const matchesSearch = 
      !searchTerm ||
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.mobile.includes(searchTerm) ||
      v.visitorCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.toMeet?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return dateInRange && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVisitors = filteredVisitors.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate, searchTerm]);

  // Pagination component
// Simplified Pagination component - only Previous and Next buttons
const Pagination = () => {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Page navigation" className="d-flex justify-content-center align-items-center mt-4">
      <div className="d-flex align-items-center gap-4">
        {/* Previous Button */}
        <button
          className={`btn pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <i className="fas fa-chevron-left me-2"></i>
          Previous
        </button>

        {/* Page Info */}
        <div className="page-info">
          <span className="current-page">{currentPage}</span>
          <span className="page-separator">of</span>
          <span className="total-pages">{totalPages}</span>
        </div>

        {/* Next Button */}
        <button
          className={`btn pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <i className="fas fa-chevron-right ms-2"></i>
        </button>
      </div>
    </nav>
  );
};

  // Export Excel
  const exportToExcel = () => {
    if (filteredVisitors.length === 0) {
      alert("No visitors found to export!");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      filteredVisitors.map((v) => ({
        "Visitor ID": v.visitorCode || v._id.slice(-6),
        Name: v.name,
        Email: v.email || "—",
        Mobile: v.mobile,
        Purpose: v.purpose,
        "To Meet": v.toMeet || "—",
        Status: v.status,
        "Requested At": new Date(v.createdAt).toLocaleString("en-IN"),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Visitors");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileName = `Visitors_${fromDate || "all"}_to_${toDate || "all"}_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), fileName);
  };

  if (loading) {
    return (
      <div className="min-vh-100 position-relative">
        <div className="background-container">
          <InteractiveBackground />
        </div>
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <h4 className="loading-text ms-3">Loading Dashboard...</h4>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 position-relative">
        <div className="background-container">
          <InteractiveBackground />
        </div>
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="error-card">
            <div className="error-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Dashboard Error</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              <i className="fas fa-refresh me-2"></i>Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              <span className="vms-title">Admin Dashboard</span>
              <span className="vms-tagline">Visitor Records & Analytics</span>
            </div>
          </div>
        </div>

        {/* Right: User Actions */}
        <div className="d-flex align-items-center">
          <div className="powered-by-text me-3">
            <small>Welcome Admin</small>
            <span className="logiclens-name">Control Panel</span>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-danger btn-sm"
            style={{ padding: "8px 16px", fontSize: "14px" }}
          >
            <i className="fas fa-sign-out-alt me-2"></i>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="container-fluid" style={{ maxWidth: "1400px" }}>
          <div className="dashboard-card">
            {/* Dashboard Header */}
            <div className="dashboard-header">
              <div className="dashboard-title">
                <div>
                  <h2>Visitor Management Dashboard</h2>
                  <p>Monitor and manage all visitor registrations</p>
                </div>
              </div>
              <div className="dashboard-stats">
                <div className="stat-card">
                  <div className="stat-number">{filteredVisitors.length}</div>
                  <div className="stat-label">Total Visitors</div>
                </div>
                <div className="stat-card approved">
                  <div className="stat-number">
                    {filteredVisitors.filter(v => v.status === 'approved').length}
                  </div>
                  <div className="stat-label">Approved</div>
                </div>
                <div className="stat-card pending">
                  <div className="stat-number">
                    {filteredVisitors.filter(v => v.status === 'pending').length}
                  </div>
                  <div className="stat-label">Pending</div>
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <div className="filters-section">
              <div className="row align-items-end">
                <div className="col-md-3">
                  <label className="form-label fw-semibold">
                    <i className="fas fa-search me-2"></i>Search Visitors
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Name, email, mobile, code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">
                    <i className="fas fa-calendar me-2"></i>From Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">
                    <i className="fas fa-calendar me-2"></i>To Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <button
                    onClick={exportToExcel}
                    className="btn btn-success w-100"
                    style={{ padding: "14px 16px", fontWeight: "600" }}
                  >
                    <i className="fas fa-download me-2"></i>
                    Export Excel
                  </button>
                </div>
              </div>
            </div>

            {/* Visitors Table */}
            {currentVisitors.length === 0 ? (
              <div className="no-data-message">
                <div className="no-data-icon">
                  <i className="fas fa-users"></i>
                </div>
                <h4>No Visitors Found</h4>
                <p>Try adjusting your search criteria or date range</p>
              </div>
            ) : (
              <>
                <div className="table-section">
                  <div className="table-responsive">
                    <table className="table visitors-table">
                      <thead>
                        <tr>
                          <th>Visitor ID</th>
                          <th>Photo</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Mobile</th>
                          <th>Purpose</th>
                          <th>Host</th>
                          <th>Requested At</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentVisitors.map((visitor) => (
                          <tr key={visitor._id}>
                            <td>
                              <span className="visitor-code-plain">
                                {visitor.visitorCode || visitor._id.slice(-6)}
                              </span>
                            </td>
                            <td>
                              {visitor.photoUrl ? (
                                <img
                                  src={visitor.photoUrl}
                                  alt="Visitor"
                                  className="visitor-photo-thumb"
                                />
                              ) : (
                                <div className="no-photo">
                                  <i className="fas fa-user"></i>
                                </div>
                              )}
                            </td>
                            <td className="visitor-name">{visitor.name}</td>
                            <td>{visitor.email || "—"}</td>
                            <td>{visitor.mobile}</td>
                            <td className="purpose-text">{visitor.purpose}</td>
                            <td>{visitor.toMeet || "—"}</td>
                            <td>
                              {new Date(visitor.createdAt).toLocaleDateString("en-IN")}
                              <br />
                              <small className="text-muted">
                                {new Date(visitor.createdAt).toLocaleTimeString("en-IN")}
                              </small>
                            </td>
                            <td>
                              <span
                                className={`status-badge ${visitor.status}`}
                              >
                                {visitor.status === "approved" && <i className="fas fa-check-circle"></i>}
                                {visitor.status === "pending" && <i className="fas fa-clock"></i>}
                                {visitor.status === "rejected" && <i className="fas fa-times-circle"></i>}
                                {visitor.status.charAt(0).toUpperCase() + visitor.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination Info */}
                <div className="pagination-info">
                  <span>
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredVisitors.length)} of {filteredVisitors.length} visitors
                  </span>
                </div>

                {/* Pagination */}
                <Pagination />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img 
              src={NKLogo}
              alt="Bebbco" 
              className="footer-logo"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="footer-bebbco">NK-TechUnion</span>
            <span className="footer-tagline">Secure Visitor Management</span>
          </div>
          <div className="footer-divider">|</div>
          <div className="footer-tech">
            <span>Technology by</span>
            <img 
              src={NKLogo}
              alt="LogicLens" 
              className="footer-logo-small"
            />
            <span className="footer-logiclens">NK-TechUnion</span>
          </div>
        </div>
        <small className="footer-copyright">
          © 2025 NK. All rights reserved. | Technology Solutions by NK-TechUnion
        </small>
      </footer>
    </div>
  );
}

export default AdminDashboard;


// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import "bootstrap/dist/css/bootstrap.min.css";

// function AdminDashboard() {
//   const [visitors, setVisitors] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const navigate = useNavigate();

//   useEffect(() => {
//     const isAdmin = localStorage.getItem("isAdmin");
//     if (!isAdmin) navigate("/admin-login");
//   }, [navigate]);

//   useEffect(() => {
//     fetch("http://localhost:5000/api/visitors")
//       .then((res) => res.json())
//       .then((data) => {
//         if (data.success) setVisitors(data.data);
//         else setError("Failed to load visitors");
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Error fetching visitors:", err);
//         setError("Backend not reachable");
//         setLoading(false);
//       });
//   }, []);

//   const handleLogout = () => {
//     localStorage.removeItem("isAdmin");
//     navigate("/admin-login");
//   };

//   // ✅ Filter visitors based on date range
//   const filteredVisitors = visitors.filter((v) => {
//     const visitDate = new Date(v.createdAt);
//     if (fromDate && visitDate < new Date(fromDate)) return false;
//     if (toDate && visitDate > new Date(toDate)) return false;
//     return true;
//   });

//   // ✅ Export Excel
//   const exportToExcel = () => {
//     if (filteredVisitors.length === 0) {
//       alert("No visitors found in this date range!");
//       return;
//     }

//     const worksheet = XLSX.utils.json_to_sheet(
//       filteredVisitors.map((v) => ({
//         VisitorID: v.visitorCode || v._id.slice(-6),
//         Name: v.name,
//         Email: v.email || "—",
//         Mobile: v.mobile,
//         Purpose: v.purpose,
//         "To Meet": v.toMeet || "—",
//         Status: v.status,
//         "Requested At": new Date(v.createdAt).toLocaleString("en-IN"),
//       }))
//     );

//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Visitors");

//     const excelBuffer = XLSX.write(workbook, {
//       bookType: "xlsx",
//       type: "array",
//     });

//     const fileName = `Visitors_${fromDate || "all"}_to_${toDate || "all"}.xlsx`;
//     saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), fileName);
//   };

//   if (loading)
//     return (
//       <div className="d-flex justify-content-center align-items-center vh-100">
//         <div className="spinner-border text-primary" role="status">
//           <span className="visually-hidden">Loading visitors...</span>
//         </div>
//       </div>
//     );

//   if (error)
//     return (
//       <div className="alert alert-danger text-center mt-5" role="alert">
//         {error}
//       </div>
//     );

//   return (
//     <div>
//       {/* Navbar */}
//       <header
//         className="d-flex align-items-center justify-content-between shadow-sm px-4"
//         style={{
//           background: "#fdfeffff",
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
//           <img src="/logo.png" alt="Logo" style={{ height: "60px", marginRight: "12px" }} />
//           <h4 className="fw-bold m-0">LogicLens</h4>
//         </div>
//         <h1 className="fw-bold text-center m-0 flex-grow-1" style={{fontsize:"4rem",}}>LogicLens- Record Dashboard</h1>
//         <div style={{ minWidth: "220px" }} className="text-end">
//           <button onClick={handleLogout} className="btn btn-danger btn-sm px-4 fw-bold" 
//           style={{fontSize:"1.2rem",}}>
//             Logout
//           </button>
//         </div>
//       </header>

//       {/* Content */}
//       <div className="container" style={{ paddingTop: "120px" }}>
//         <div className="card shadow-lg p-4">
//           <h2 className="text-center mb-4"><strong>Admin Dashboard</strong></h2>

//           {/* ✅ Date Filter & Export */}
//           <div className="d-flex justify-content-between mb-4">
//             <div>
//               <label className="me-2">From: </label>
//               <input
//                 type="date"
//                 value={fromDate}
//                 onChange={(e) => setFromDate(e.target.value)}
//                 className="form-control d-inline-block"
//                 style={{ width: "200px" }}
//               />
//               <label className="ms-3 me-2">To: </label>
//               <input
//                 type="date"
//                 value={toDate}
//                 onChange={(e) => setToDate(e.target.value)}
//                 className="form-control d-inline-block"
//                 style={{ width: "200px" }}
//               />
//             </div>
//             <button onClick={exportToExcel} className="btn btn-success fw-bold"
//             style={{fontSize:"1.2rem",}}>
//               📥 Download Excel
//             </button>
//           </div>

//           {filteredVisitors.length === 0 ? (
//             <div className="alert alert-info text-center">No visitors found</div>
//           ) : (
//             <div className="table-responsive">
//               <table className="table table-hover table-bordered align-middle">
//                 <thead className="table-dark text-center">
//                   <tr>
//                     <th>Visitor ID</th>
//                     <th>Photo</th>
//                     <th>Name</th>
//                     <th>Email</th>
//                     <th>Mobile</th>
//                     <th>Purpose</th>
//                     <th>Host</th>
//                     <th>Requested At</th>
//                     <th>Status</th>
//                   </tr>
//                 </thead>
//                 <tbody className="text-center">
//                   {filteredVisitors.map((v) => (
//                     <tr key={v._id}>
//                       <td><code>{v.visitorCode || v._id.slice(-6)}</code></td>
//                       <td>
//                         {v.photo ? (
//                           <img src={v.photo} alt="Visitor" style={{ width: "50px", height: "50px", borderRadius: "8px" }} />
//                         ) : "—"}
//                       </td>
//                       <td>{v.name}</td>
//                       <td>{v.email || "—"}</td>
//                       <td>{v.mobile}</td>
//                       <td>{v.purpose}</td>
//                       <td>{v.toMeet || "—"}</td>
//                       <td>{new Date(v.createdAt).toLocaleString("en-IN")}</td>
//                       <td>
//                         <span className={`badge px-3 py-2 fs-6 ${
//                           v.status === "approved" ? "bg-success" :
//                           v.status === "pending" ? "bg-warning text-dark" :
//                           v.status === "rejected" ? "bg-danger" : "bg-secondary"
//                         }`}>
//                           {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>

//       <footer className="text-center p-3 text-muted medium">
//         Powered by <strong>LogicLens</strong> | Secure Visitor Management System
//       </footer>
//     </div>
//   );
// }

// export default AdminDashboard;
