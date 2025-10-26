import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InteractiveBackground from "./InteractiveBackground";



import NKLogo from "../assets/NK-Logo.png";
import NKOnlyLogo from "../assets/NKOnlyLogo.png";


function LoadingPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [status, setStatus] = useState("pending"); // pending, approved, rejected
  const [hasNavigated, setHasNavigated] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/+$/, "") || "http://localhost:5000";

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }

    let timer;
    let poller;

    // Expire visitor if timer runs out
    const expireVisitor = async () => {
      try {
        await fetch(`${API_BASE}/api/visitors/${id}/expire`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        });
        if (!hasNavigated) {
          setHasNavigated(true);
          alert("⏳ Visitor pass expired!");
          navigate("/");
        }
      } catch (err) {
        console.error("Error expiring visitor:", err);
      }
    };

    // Check visitor approval status
    const checkStatus = async () => {
      if (!id || hasNavigated) return;

      try {
        const res = await fetch(`${API_BASE}/api/visitors/status/${id}`);
        if (!res.ok) return;

        const result = await res.json();
        const visitor = result?.data;

        if (!visitor?._id) return;

        const visitorStatus = String(visitor.status || "pending").toLowerCase();
        setStatus(visitorStatus);

        if (!hasNavigated) {
          if (visitorStatus === "approved") {
            setHasNavigated(true);
            navigate(`/qrcode/${visitor._id}`);
          } else if (visitorStatus === "rejected") {
            setHasNavigated(true);
            alert("❌ Your request was rejected.");
            navigate("/");
          } else if (visitorStatus === "expired") {
            setHasNavigated(true);
            alert("⏳ Your request has expired.");
            navigate("/");
          }
        }
      } catch (err) {
        console.error("Error checking visitor status:", err);
      }
    };

    // Countdown timer
    timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          clearInterval(poller);
          expireVisitor();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Polling every 3 seconds
    poller = setInterval(() => {
      checkStatus();
    }, 3000);

    // Initial check immediately
    checkStatus();

    return () => {
      clearInterval(timer);
      clearInterval(poller);
    };
  }, [id, navigate, API_BASE, hasNavigated]);

  // Format timer mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 60) return "#ef4444"; // red
    if (timeLeft <= 180) return "#f59e0b"; // orange
    return "#10b981"; // green
  };

  return (
    <div className="loading-page">
      <div className="background-container">
        <InteractiveBackground />
      </div>

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
          <img src={NKOnlyLogo} alt="NKOnlyLogo" className="NK-logo" />
        </div>
      </header>

      <main className="loading-main">
        <div className="loading-container">
          <div className="loading-card">
            <div className="step-indicator">
              <div className="step-item">
                <span className="step-badge completed">
                  <i className="fas fa-check"></i>
                </span>
                <span className="step-label">Details Submitted</span>
              </div>
              <div className="step-line completed"></div>
              <div className={`step-item ${status === "pending" ? "active" : ""}`}>
                <span className="step-badge active">
                  <div className="spinner-small"></div>
                </span>
                <span className="step-label active">Awaiting Approval</span>
              </div>
              <div className="step-line"></div>
              <div className="step-item">
                <span className="step-badge">3</span>
                <span className="step-label">Pass Generation</span>
              </div>
            </div>

            <div className="loading-animation">
              <div className="pulse-rings">
                <div className="pulse-ring ring-1"></div>
                <div className="pulse-ring ring-2"></div>
                <div className="pulse-ring ring-3"></div>
              </div>
              <div className="loading-icon">
                <i className="fas fa-user-check"></i>
              </div>
            </div>

            <div className="status-message">
              <h2 className="status-title">
                <i className="fas fa-clock me-2"></i>
                Waiting for Host Approval
              </h2>
              <p className="status-description">
                Your request has been sent to the host. Please wait while they review your visit request.
              </p>
            </div>

            <div className="timer-section">
              <div className="timer-label">Request expires in:</div>
              <div className="timer-display" style={{ color: getTimerColor() }}>
                <i className="fas fa-stopwatch me-2"></i>
                {formatTime(timeLeft)}
              </div>
              <div className="timer-progress">
                <div
                  className="timer-progress-bar"
                  style={{
                    width: `${(timeLeft / 1800) * 100}%`,
                    background: getTimerColor(),
                  }}
                ></div>
              </div>
            </div>

            <div className="action-buttons">
              <button
                className="btn btn-outline-secondary item-center"
                onClick={() => navigate("/")}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Go Back
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src={NKOnlyLogo} alt="Bebbco" className="footer-logo" />
            
            <span className="footer-tagline">Secure Visitor Management</span>
          </div>
          <div className="footer-divider">|</div>
          <div className="footer-tech">
            <span>Powered by</span>
            <img src={NKOnlyLogo} alt="" className="footer-logo-small" />
            <span className="footer-logiclens"> TechUnion</span>
          </div>
        </div>
        <small className="footer-copyright">
          © 2025 NK-TechUnion Solutions. All rights reserved.
        </small>
      </footer>
    </div>
  );
}

export default LoadingPage;



