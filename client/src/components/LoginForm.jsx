import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertModal from "./AlertModal";
import "../styles/global/MainStyles.css";

const LoginScreen = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const navigate = useNavigate();

  const handleModalClose = () => {
    setShowErrorModal(false);
    setShowSuccessModal(false);
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    navigate("/admin");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${baseUrl}/admins/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("jwtToken", data.token);
        setModalTitle("Login Successful");
        setModalMessage("Welcome back! Redirecting to admin…");
        setShowSuccessModal(true);
      } else {
        setModalTitle("Login Failed");
        setModalMessage(data.message || "Invalid credentials.");
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error("Error during login:", err);
      setModalTitle("Error");
      setModalMessage("Something went wrong. Please try again.");
      setShowErrorModal(true);
    }
  };

  return (
    <div className="home-container">
      <img src="/images/changihome.jpg" alt="Background" className="home-background" />
      <div className="home-overlay"></div>

      <div className="top-left-logo">
        <img src="/images/ces.jpg" alt="CES Logo" />
      </div>

      <div className="home-content">
        <div className="title-block">
          <h1>Admin Login</h1>
        </div>

        <div className="description-block">
          <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "300px", margin: "0 auto" }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "12px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                fontSize: "16px",
                boxSizing: "border-box"
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "16px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                fontSize: "16px",
                boxSizing: "border-box"
              }}
            />
            <div className="home-buttons">
              <button type="submit">Log In</button>
              <button type="button" onClick={() => navigate("/")}>Go to Home</button>
            </div>
          </form>
          <button
            type="button"
            onClick={() => navigate("/reset-password")}
            style={{ marginTop: "12px", background: "none", border: "none", color: "#007bff", cursor: "pointer", textDecoration: "underline" }}
          >
            Forgot Password?
          </button>

        </div>
      </div>

      {/* Success Modal */}
      <AlertModal
        isOpen={showSuccessModal}
        onClose={handleSuccessConfirm}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        type="success"
        showCancel={false}
      />

      {/* Error Modal */}
      <AlertModal
        isOpen={showErrorModal}
        onClose={handleModalClose}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        type="error"
        showCancel={false}
      />
    </div>
  );
};

export default LoginScreen;
