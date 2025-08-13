
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const GameSettingsModal = ({ collection, onModalFeedback }) => {
  const [showModal, setShowModal] = useState(false);
  const [useGlobalSettings, setUseGlobalSettings] = useState(true);
  const [customSettings, setCustomSettings] = useState({
    gameMode: "default",
    wrongAnswerPenalty: 300,
    hintPenalty: 120,
    skipPenalty: 600,
  });
  const [globalSettings, setGlobalSettings] = useState(null);

  useEffect(() => {
    if (!collection) return;
    setUseGlobalSettings(collection.useGlobalSettings ?? true);
    setCustomSettings(
      collection.customSettings || {
        gameMode: "default",
        wrongAnswerPenalty: 300,
        hintPenalty: 120,
        skipPenalty: 600,
      }
    );
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/global-settings`);
        const data = await res.json();
        setGlobalSettings(data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [collection]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleSave = async () => {
    try {
      const payload = {
        useGlobalSettings,
        customSettings: useGlobalSettings ? null : customSettings,
      };
      const res = await fetch(
        `${API_BASE_URL}/collections/${collection._id}/game-settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        onModalFeedback?.("Success", "Game settings updated successfully!", "success");
        setShowModal(false);
      } else {
        const data = await res.json();
        onModalFeedback?.("Error", data.message || "Failed to update game settings.", "error");
      }
    } catch (err) {
      console.error(err);
      onModalFeedback?.("Server Error", "Error updating game settings. Please try again.", "error");
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          backgroundColor: "#6f42c1",
          color: "#000",
          fontSize: "12px",
          padding: "4px 8px",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Game Settings
      </button>

      {showModal &&
        createPortal(
          <div
            className="modal-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10000,
            }}
            onClick={() => setShowModal(false)}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "white",
                padding: "25px",
                borderRadius: "10px",
                width: "80%",
                maxWidth: "600px",
                maxHeight: "80vh",
                overflowY: "auto",
                color: "#000",
              }}
            >
              <h3 style={{ marginBottom: "20px", textAlign: "center" }}>
                Game Settings - {collection.name}
              </h3>

              <label style={{ display: "flex", alignItems: "center", gap: "2px", marginBottom: "15px" }}>
                <span style={{ fontWeight: "bold" }}>Use Global Default Settings</span>
                <input
                  type="checkbox"
                  checked={useGlobalSettings}
                  onChange={(e) => setUseGlobalSettings(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
              </label>

              {globalSettings && (
                <div
                  style={{
                    backgroundColor: "#f8f9fa",
                    padding: "12px",
                    borderRadius: "5px",
                    marginBottom: "15px",
                  }}
                >
                  <h4 style={{ marginBottom: "8px", fontSize: "14px" }}>Global Defaults:</h4>
                  <p style={{ fontSize: "12px", color: "#666" }}>
                    • Game Mode: {globalSettings.defaultGameMode}<br />
                    • Wrong Answer: +{formatTime(globalSettings.defaultWrongAnswerPenalty)}<br />
                    • Hint: +{formatTime(globalSettings.defaultHintPenalty)}<br />
                    • Skip: +{formatTime(globalSettings.defaultSkipPenalty)}
                  </p>
                </div>
              )}

              {!useGlobalSettings && (
                <>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                      Game Mode:
                    </label>
                    <select
                      value={customSettings.gameMode}
                      onChange={(e) =>
                        setCustomSettings({ ...customSettings, gameMode: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                        color: "#000",
                        backgroundColor: "#fff",
                      }}
                    >
                      <option value="default">📋 Default (Follow Question Order)</option>
                      <option value="random">🎲 Random (Each Game Different)</option>
                      <option value="rotating">🔄 Rotating</option>
                      <option value="rotating-reverse">🔄 Rotating Reverse</option>
                    </select>
                  </div>

                  {["wrongAnswerPenalty", "hintPenalty", "skipPenalty"].map((key) => (
                    <div key={key} style={{ marginBottom: "15px" }}>
                      <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                        {key === "wrongAnswerPenalty"
                          ? `Wrong Answer Penalty: ${formatTime(customSettings[key])}`
                          : key === "hintPenalty"
                          ? `Hint Penalty: ${formatTime(customSettings[key])}`
                          : `Skip Penalty: ${formatTime(customSettings[key])}`}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max={key === "hintPenalty" ? 300 : key === "wrongAnswerPenalty" ? 600 : 1200}
                        step={key === "hintPenalty" ? 15 : key === "wrongAnswerPenalty" ? 30 : 60}
                        value={customSettings[key]}
                        onChange={(e) =>
                          setCustomSettings({ ...customSettings, [key]: +e.target.value })
                        }
                        style={{ width: "100%" }}
                      />
                    </div>
                  ))}
                </>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleSave}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#6f42c1",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  Save Settings
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#6c757d",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default GameSettingsModal;
