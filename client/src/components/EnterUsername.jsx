import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AlertModal from "./AlertModal";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
import "./MainStyles.css";

export default function EnterUsername() {
  const [form, setForm] = useState({ username: "" });
  const [loading, setLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const savedUsername = sessionStorage.getItem("username");
    if (savedUsername) {
      setForm({ username: savedUsername });
    }
  }, []);

  const updateForm = (value) => {
    setForm((prev) => ({ ...prev, ...value }));
  };

  const checkBadUsername = async (username) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bad-usernames/check/${username.trim()}`);
      const data = await response.json();
      return data.isBad;
    } catch (error) {
      console.error("Error checking bad username:", error);
      return false; // If there's an error, allow the username
    }
  };

  const checkDuplicateUsername = async (username, collectionId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/players/check-username/${encodeURIComponent(username.trim())}/${collectionId}`
      );
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Error checking duplicate username:", error);
      return false; // If there's an error, allow the username
    }
  };

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Frontend validation
    if (!form.username.trim()) {
      showError("Please enter your name.");
      setLoading(false);
      return;
    }

    const cleanUsername = form.username.trim();

    // Check length
    if (cleanUsername.length < 2) {
      showError("Username must be at least 2 characters long.");
      setLoading(false);
      return;
    }

    if (cleanUsername.length > 20) {
      showError("Username must not exceed 20 characters.");
      setLoading(false);
      return;
    }

    // Check for special characters
    const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(cleanUsername);
    if (hasSpecialChars) {
      showError("Username can only contain letters, numbers, and spaces.");
      setLoading(false);
      return;
    }

    // Check if username is prohibited
    const isBad = await checkBadUsername(cleanUsername);
    if (isBad) {
      showError("This username is not allowed. Please choose a different one.");
      setLoading(false);
      return;
    }

    // Check for duplicate username
    const collectionId = sessionStorage.getItem("collectionId");
    if (!collectionId) {
      showError("Collection ID is missing. Please enter the code again.");
      setLoading(false);
      navigate("/getcode");
      return;
    }

    const isDuplicate = await checkDuplicateUsername(cleanUsername, collectionId);
    if (isDuplicate) {
      showError("This username is already taken for this game. Please choose a different one.");
      setLoading(false);
      return;
    }

    // Save and proceed
    sessionStorage.setItem("username", cleanUsername);
    navigate("/rules");
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
        <h1
          style={{
            fontSize: "1.8rem",
            fontFamily: "serif",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            lineHeight: "1.5",
          }}
        >
          Welcome!<br />
          Let's get started on your adventure.
        </h1>

        <p style={{ marginBottom: "2rem", fontSize: "1.1rem" }}>
          What name should we use for you?
        </p>

        <form onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="Enter your name"
            value={form.username}
            onChange={(e) => updateForm({ username: e.target.value })}
            style={{
              padding: "12px 20px",
              fontSize: "16px",
              borderRadius: "30px",
              border: "1px solid #ccc",
              width: "100%",
              maxWidth: "260px",
              marginBottom: "1.2rem",
              textAlign: "center",
            }}
          />
          <br />
          <button type="submit" className="share-button" style={{ maxWidth: "200px", width: "100%" }} disabled={loading}>
            {loading ? "Checking..." : "Let's Go"}
          </button>
        </form>
      </div>

      {/* Error Modal for validation issues */}
      <AlertModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Oops!"
        message={errorMessage}
        confirmText="Try Again"
        type="error"
        showCancel={false}
      />
    </div>
  );
}