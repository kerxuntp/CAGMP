import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./GlobalSettings.css";
import AlertModal from "./AlertModal";

const GlobalSettings = () => {
  const [settings, setSettings] = useState({
    defaultGameMode: 'default',
    defaultWrongAnswerPenalty: 300,
    defaultHintPenalty: 120,
    defaultSkipPenalty: 600
  });

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setModalTitle("Not Logged In");
      setModalMessage("You must be logged in to access this page.");
      setShowErrorModal(true);
      return;
    }
    fetchGlobalSettings();
  }, [navigate]);

  const fetchGlobalSettings = async () => {
    try {
      const response = await fetch("http://localhost:5000/global-settings");
      const data = await response.json();
      setSettings(data);
    } catch {
      setModalTitle("Error");
      setModalMessage("Error fetching global settings.");
      setShowErrorModal(true);
    }
  };

  // Format preview details for modal
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleSave = (e) => {
    e.preventDefault();
    setModalTitle("Confirm Save");
    setModalMessage(
      <>
        <div>
          <strong>Preview:</strong>
          <div style={{ fontSize: "14px", marginTop: "8px" }}>
            <p>• Mode: <strong>{settings.defaultGameMode}</strong></p>
            <p>• Wrong Answer: <strong>+{formatTime(settings.defaultWrongAnswerPenalty)}</strong></p>
            <p>• Hint: <strong>+{formatTime(settings.defaultHintPenalty)}</strong></p>
            <p>• Skip: <strong>+{formatTime(settings.defaultSkipPenalty)}</strong></p>
          </div>
        </div>
        <div style={{ marginTop: "10px" }}>Do you want to save these global settings?</div>
      </>
    );
    setShowConfirmModal(true);
  };

  // Actually save after confirmation
  const confirmSave = async () => {
    try {
      const response = await fetch("http://localhost:5000/global-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setModalTitle("Success");
        setModalMessage("Global settings updated successfully!");
        setShowSuccessModal(true);
      } else {
        const data = await response.json();
        setModalTitle("Failed");
        setModalMessage(`Failed to update settings: ${data.message}`);
        setShowErrorModal(true);
      }
    } catch {
      setModalTitle("Error");
      setModalMessage("Error updating settings. Please try again.");
      setShowErrorModal(true);
    }
    setShowConfirmModal(false);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setShowConfirmModal(false);
  };

  return (
    <>
      <div className="global-settings-container">
        <img src="/images/changihome.jpg" alt="Background" className="background-image" />
        <div className="page-overlay"></div>
        <div className="global-settings-content">
          <h2 style={{ color: "#000", fontSize: "24px", marginBottom: "20px", padding: "0 12px" }}>
            Manage Default Settings
          </h2>
          <form onSubmit={handleSave} style={{ width: "100%", maxWidth: "500px" }}>
            {/* Game Mode Section */}
            <div style={{ marginTop: "10px", marginBottom: "8px"  }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>
                Default Game Mode:
              </label>
              <select
                value={settings.defaultGameMode}
                onChange={(e) => setSettings({...settings, defaultGameMode: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  fontSize: "14px"
                }}
              >
                <option value="default">Default - Same order for all players</option>
                <option value="random">Random - Different order for each player</option>
                <option value="rotating">Rotating - Players start at different questions</option>
                <option value="rotating-reverse">Rotating Reverse - Reverse rotating start</option>
              </select>
            </div>

            {/* Penalty Settings */}
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ color: "#333", fontSize: "16px" }}>Default Penalty Times:</h3>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#333", fontSize: "14px" }}>
                  Wrong Answer: {formatTime(settings.defaultWrongAnswerPenalty)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="600"
                  step="30"
                  value={settings.defaultWrongAnswerPenalty}
                  onChange={(e) => setSettings({...settings, defaultWrongAnswerPenalty: parseInt(e.target.value)})}
                  style={{ width: "100%", marginBottom: "3px" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "bold", color: "#000" }}>
                  <span>0s</span>
                  <span>10m</span>
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#333", fontSize: "14px" }}>
                  Hint: {formatTime(settings.defaultHintPenalty)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="15"
                  value={settings.defaultHintPenalty}
                  onChange={(e) => setSettings({...settings, defaultHintPenalty: parseInt(e.target.value)})}
                  style={{ width: "100%", marginBottom: "3px" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "bold", color: "#000" }}>
                  <span>0s</span>
                  <span>5m</span>
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#333", fontSize: "14px" }}>
                  Skip: {formatTime(settings.defaultSkipPenalty)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1200"
                  step="60"
                  value={settings.defaultSkipPenalty}
                  onChange={(e) => setSettings({...settings, defaultSkipPenalty: parseInt(e.target.value)})}
                  style={{ width: "100%", marginBottom: "3px" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "bold", color: "#000" }}>
                  <span>0s</span>
                  <span>20m</span>
                </div>
              </div>
            </div>

            {/* Buttons Row */}
            <div className="button-row">
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#6f42c1",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Save Global Settings
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="login-btn"
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#17C4C4",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Return
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal for Preview */}
      <AlertModal
        isOpen={showConfirmModal}
        onClose={handleModalClose}
        onConfirm={confirmSave}
        title={modalTitle}
        message={modalMessage}
        confirmText="Save"
        cancelText="Cancel"
        type="info"
        showCancel={true}
      />

      {/* Success/Error Modals */}
      <AlertModal
        isOpen={showSuccessModal}
        onClose={handleModalClose}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        type="success"
        showCancel={false}
      />
      <AlertModal
        isOpen={showErrorModal}
        onClose={handleModalClose}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        type="error"
        showCancel={false}
      />
    </>
  );
};

export default GlobalSettings;