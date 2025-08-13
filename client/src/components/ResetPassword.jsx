import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./MainStyles.css";

import AlertModal from "./AlertModal";

const ResetPassword = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalProps, setModalProps] = useState({ title: "", message: "", type: "info" });

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stage, setStage] = useState("request");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      setToken(urlToken);
      setStage("reset");
    }
  }, [location.search]);

  const handleRequestToken = async () => {
    try {
      const res = await fetch("http://localhost:5000/admins/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setModalProps({
          title: "Email Sent",
          message: "Reset link sent to your email.",
          type: "success",
        });
      } else {
        setModalProps({
          title: "Error",
          message: data.message || "Failed to send reset link.",
          type: "error",
        });
      }
    } catch {
      setModalProps({
        title: "Server Error",
        message: "Could not send reset email.",
        type: "error",
      });
    }
    setShowModal(true);
  };

  const getPasswordStrength = () => {
    if (newPassword.length >= 12 && /[A-Z]/.test(newPassword) && /\d/.test(newPassword) && /\W/.test(newPassword)) {
      return "Strong";
    } else if (newPassword.length >= 8) {
      return "Medium";
    } else {
      return "Weak";
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setModalProps({
        title: "Missing Fields",
        message: "Please enter and confirm your new password.",
        type: "warning",
      });
      setShowModal(true);
      return;
    }

    if (newPassword.length < 8) {
      setModalProps({
        title: "Weak Password",
        message: "Password must be at least 8 characters long.",
        type: "warning",
      });
      setShowModal(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalProps({
        title: "Mismatch",
        message: "Passwords do not match. Please confirm again.",
        type: "warning",
      });
      setShowModal(true);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/admins/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setModalProps({
          title: "Success",
          message: "Password reset successful!",
          type: "success",
        });
      } else {
        setModalProps({
          title: "Error",
          message: data.message || "Failed to reset password.",
          type: "error",
        });
      }
    } catch {
      setModalProps({
        title: "Server Error",
        message: "Could not reset password.",
        type: "error",
      });
    }

    setShowModal(true);
  };

  return (
    <div className="home-container">
      <img src="/images/changihome.jpg" alt="Background" className="home-background" />
      <div className="home-overlay" />
      <div className="top-left-logo">
        <img src="/images/ces.jpg" alt="CES Logo" />
      </div>

      <div className="home-content">
        <div className="title-block"><h1>Reset Password</h1></div>
        <div className="description-block" style={{ maxWidth: "360px", margin: "0 auto" }}>
          {stage === "request" ? (
            <>
              <input
                type="text"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
              <button className="login-btn" onClick={handleRequestToken}>Request Reset Link</button>
            </>
          ) : (
            <>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={inputStyle}
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyle}
              />

              {newPassword && (
                <p style={{ color: "#fff", fontSize: "14px", marginTop: "-8px", marginBottom: "12px" }}>
                  Password Strength: <strong>{getPasswordStrength()}</strong>
                </p>
              )}

              <label style={{ color: "white", fontSize: "14px", marginBottom: "12px", display: "block" }}>
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  style={{ marginRight: "6px" }}
                />
                Show Password
              </label>

              <button className="login-btn" onClick={handleResetPassword}>Reset Password</button>
            </>
          )}

          <button
            className="login-btn"
            style={{ backgroundColor: "#ccc", color: "#000", marginTop: "10px" }}
            onClick={() => navigate("/login")}
          >
            Back to Login
          </button>
        </div>
      </div>

      <AlertModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          if (modalProps.title === "Success") navigate("/login");
        }}
        onConfirm={() => {
          setShowModal(false);
          if (modalProps.title === "Success") navigate("/login");
        }}
        title={modalProps.title}
        message={modalProps.message}
        type={modalProps.type}
        confirmText="OK"
        showCancel={false}
      />
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "10px",
  border: "1px solid #ccc",
  fontSize: "16px",
  boxSizing: "border-box",
};

export default ResetPassword;
