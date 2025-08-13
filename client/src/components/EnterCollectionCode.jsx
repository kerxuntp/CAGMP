import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertModal from './AlertModal';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
import "../styles/global/MainStyles.css";

export default function EnterCollCode() {
  const [code, setCode] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code.trim()) {
      showError("Please enter a code.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/collections/code/${code.trim()}`);

      if (!res.ok) {
        showError("Invalid code. Please check with the staff.");
        return;
      }

      const data = await res.json();
      sessionStorage.setItem("collectionId", data._id);
      navigate("/getname");
    } catch (err) {
      console.error("Code validation failed:", err);
      showError("Something went wrong. Please try again later.");
    }
  };


  const handlePublicPlay = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/collections/public`);

      if (!res.ok) {
        showError("Public game is currently unavailable.");
        return;
      }

      const data = await res.json();
      sessionStorage.setItem("collectionId", data._id);
      navigate("/getname");
    } catch (err) {
      console.error("Public collection fetch failed:", err);
      showError("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="home-container">
      <img src="/images/changihome.jpg" alt="Background" className="home-background" />
      <div className="home-overlay"></div>

      <div className="top-left-logo">
        <img src="/images/ces.jpg" alt="CES Logo" />
      </div>

      <button
        className="return-button"
        style={{ position: "absolute", bottom: "24px", left: "24px", zIndex: 2, width: "auto", padding: "10px 24px" }}
        onClick={() => navigate("/")}
      >
        Back
      </button>

      <div className="page-content">
        <h2 style={{ marginBottom: "1.5rem" }}>Enter your collection code</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              padding: "12px 20px",
              fontSize: "16px",
              borderRadius: "30px",
              border: "1px solid #ccc",
              width: "100%",
              maxWidth: "260px",
              marginBottom: "1.2rem",
              textAlign: "center"
            }}
          />
          <br />
          <button type="submit" className="share-button" style={{ maxWidth: "200px", width: "100%" }}>
            Continue
          </button>
        </form>
        <p style={{ margin: "1rem 0", color: "#000" }}>OR</p>
        <button
          className="share-button"
          style={{ maxWidth: "200px", width: "100%", background: "#17C4C4" }}
          onClick={handlePublicPlay}
        >
          Play as Guest
        </button>
      </div>

      {/* Error Modal for validation issues */}
      <AlertModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Invalid Code"
        message={errorMessage}
        confirmText="Try Again"
        type="error"
        showCancel={false}
      />
    </div>
  );
}