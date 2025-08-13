import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./MainStyles.css";
import AlertModal from "./AlertModal";

const AdminScreen = () => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [adminRole, setAdminRole] = useState("");


  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setShowModal(true);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setAdminRole(decoded.role);
    } catch (err) {
      console.error("Invalid token:", err);
      localStorage.removeItem("jwtToken");
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="login-container">
      <img src="/images/changihome.jpg" alt="Background" className="background-image" />
      <div className="page-overlay"></div>

      <div className="top-left-logo">
        <img src="/images/ces.jpg" alt="Changi Experience Studio" />
      </div>

      <div className="manage-admin-wrapper">
        <h1 style={{ color: "#000", fontSize: "32px", textAlign: "center", marginBottom: "10px" }}>
          Admin Dashboard
        </h1>
        <p style={{ textAlign: "center", fontSize: "18px", color: "#333", marginBottom: "20px" }}>
          Role: <strong>{adminRole}</strong>
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <button
            onClick={() => navigate("/collections-bank")}
            className="login-btn"
            style={{
              marginTop: "8px",
              width: "100%",
              maxWidth: "300px",
              backgroundColor: "#17a2b8",
              color: "#000",
            }}
          >
            View and Edit Collections
          </button>

          <button
            onClick={() => navigate("/questions")}
            className="login-btn"
            style={{
              marginTop: "16px",
              width: "100%",
              maxWidth: "300px",
              backgroundColor: "#28a745",
              color: "#000",
            }}
          >
            View and Edit Questions
          </button>

          <button
            onClick={() => navigate("/global-game-settings")}
            className="login-btn"
            style={{
              marginTop: "16px",
              width: "100%",
              maxWidth: "300px",
              backgroundColor: "#6f42c1",
              color: "#000",
            }}
          >
            Default Game Settings
          </button>

          <button
            onClick={() => navigate("/bad-usernames")}
            className="login-btn"
            style={{
              marginTop: "16px",
              width: "100%",
              maxWidth: "300px",
              backgroundColor: "#cc4125",
              color: "#000",
            }}
          >
            Manage Bad Usernames
          </button>

          <button
            onClick={() => navigate("/manage-admins")}
            className="login-btn"
            style={{
              marginTop: "16px",
              width: "100%",
              maxWidth: "300px",
              backgroundColor: "#cc4125",
              color: "#000",
            }}
          >
            Manage Admins
          </button>

          <button
            onClick={() => navigate("/landing-customisation")}
            className="login-btn"
            style={{
              marginTop: "16px",
              width: "100%",
              maxWidth: "300px",
              backgroundColor: "#e67e22",
              color: "#000",
            }}
          >
            Customise Landing Page
          </button>

          <button
            onClick={() => navigate("/admin-leaderboard")}
            className="login-btn"
            style={{
              marginTop: "16px",
              width: "100%",
              maxWidth: "300px",
              backgroundColor: "#007b8a",
              color: "#000",
            }}
          >
            View Leaderboard
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("jwtToken");
              navigate("/login");
            }}
            className="login-btn"
            style={{
              marginTop: "16px",
              width: "100%",
              maxWidth: "300px",
              color: "#000",
            }}
          >
            Log Out
          </button>
        </div>
      </div>
       <AlertModal
        isOpen={showModal}
        onClose={() => navigate("/login")}
        onConfirm={() => navigate("/login")}
        type="error"
        title="Access Denied"
        message="You must be logged in to access this page."
        confirmText="Go to Login"
        showCancel={false}
      />
    </div>
  );
};

const btnStyle = (bgColor) => ({
  marginTop: "12px",
  width: "100%",
  maxWidth: "300px",
  backgroundColor: bgColor,
  color: "#000",
});

export default AdminScreen;
