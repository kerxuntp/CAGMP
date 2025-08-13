/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/global/MainStyles.css";
import AlertModal from "./AlertModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const BadUsernames = () => {
  const [badUsernames, setBadUsernames] = useState([]);
  const [newUsername, setNewUsername] = useState("");

  // Modal states
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Modal content
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [bulkUsernames, setBulkUsernames] = useState("");
  const [pendingBulkUsernames, setPendingBulkUsernames] = useState([]);
  const [usernameToDelete, setUsernameToDelete] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setModalTitle("Not Logged In");
      setModalMessage("You must be logged in to access this page.");
      setShowErrorModal(true);
      return;
    }
    fetchBadUsernames();
  }, [navigate]);

  const fetchBadUsernames = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bad-usernames`);
      const data = await response.json();
      setBadUsernames(data);
    } catch (error) {
      setModalTitle("Error");
      setModalMessage("Error fetching bad usernames.");
      setShowErrorModal(true);
    }
  };

  const handleAddUsername = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    const usernamesToAdd = newUsername.split(',').map(u => u.trim()).filter(u => u.length > 0);

    if (usernamesToAdd.length === 0) {
      setModalTitle("Invalid Input");
      setModalMessage("Please enter at least one valid username.");
      setShowErrorModal(true);
      return;
    }

    let failed = [];
    for (const username of usernamesToAdd) {
      const response = await fetch(`${API_BASE_URL}/bad-usernames`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!response.ok) {
        failed.push(username);
      }
    }
    setNewUsername("");
    fetchBadUsernames();
    setModalTitle("Add Complete");
    setModalMessage(
      failed.length === 0
        ? `${usernamesToAdd.length} username(s) added to prohibited list!`
        : `Some usernames failed to add: ${failed.join(", ")}`
    );
    setShowSuccessModal(true);
  };

  // Custom popup modal for bulk update
  const openBulkModal = () => {
    setBulkUsernames(badUsernames.join(", "));
    setShowBulkModal(true);
  };

  const closeBulkModal = () => {
    setBulkUsernames("");
    setShowBulkModal(false);
  };

  const handleBulkUpdate = (e) => {
    e.preventDefault();
    if (!bulkUsernames.trim()) {
      setModalTitle("Invalid Input");
      setModalMessage("Please enter at least one valid username.");
      setShowErrorModal(true);
      return;
    }
    const usernamesToUpdate = bulkUsernames.split(',').map(u => u.trim()).filter(u => u.length > 0);
    setPendingBulkUsernames(usernamesToUpdate);
    setModalTitle("Confirm Bulk Replace");
    setModalMessage(`This will replace the entire prohibited list with ${usernamesToUpdate.length} username(s). Are you sure?`);
    setShowBulkModal(false);
    setShowConfirmModal(true);
  };

  const confirmBulkUpdate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bad-usernames`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: pendingBulkUsernames }),
      });
      if (response.ok) {
        fetchBadUsernames();
        setModalTitle("Success");
        setModalMessage("Prohibited usernames list updated successfully!");
        setShowSuccessModal(true);
      } else {
        const data = await response.json();
        setModalTitle("Failed");
        setModalMessage(data.message || "Failed to update usernames.");
        setShowErrorModal(true);
      }
    } catch (error) {
      setModalTitle("Server Error");
      setModalMessage("Error updating usernames.");
      setShowErrorModal(true);
    }
    setShowConfirmModal(false);
    setBulkUsernames("");
  };

  const handleDeleteUsername = (username) => {
    setUsernameToDelete(username);
    setModalTitle("Confirm Delete");
    setModalMessage(`Are you sure you want to remove "${username}" from the prohibited list?`);
    setShowConfirmModal(true);
  };

  const confirmDeleteUsername = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bad-usernames/${usernameToDelete}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchBadUsernames();
        setModalTitle("Removed");
        setModalMessage("Username removed from prohibited list!");
        setShowSuccessModal(true);
      } else {
        const data = await response.json();
        setModalTitle("Failed");
        setModalMessage(data.message || "Failed to remove username.");
        setShowErrorModal(true);
      }
    } catch (error) {
      setModalTitle("Server Error");
      setModalMessage("Error removing username.");
      setShowErrorModal(true);
    }
    setShowConfirmModal(false);
    setUsernameToDelete("");
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setShowConfirmModal(false);
  };


  return (
    <>
      <div className="login-container">
        <img src="/images/changihome.jpg" alt="Background" className="background-image" />
        <div className="page-overlay"></div>
        <div className="buttons">
          <h2 style={{ color: "#000", fontSize: "24px", marginBottom: "12px" }}>
            Manage Prohibited Usernames
          </h2>

          {/* Add Username Form */}
          <form onSubmit={handleAddUsername} style={{ maxWidth: "300px", width: "100%", marginBottom: "12px" }}>
            <input
              type="text"
              placeholder="Enter username to prohibit"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
              className="login-btn"
              style={{ marginBottom: "4px", backgroundColor: "white" }}
            />
            <p style={{ fontSize: "12px", color: "#666", textAlign: "center", marginBottom: "6px", fontWeight: "bold" }}>
              💡 Tip: Separate multiple usernames with commas (e.g., "user1, user2, user3")
            </p>
            <button
              type="submit"
              className="login-btn"
              style={{
                background: "linear-gradient(90deg, #C4EB22, #17C4C4)",
                color: "black",
                width: "100%",
                marginBottom: "6px"
              }}
            >
              Add to Prohibited List
            </button>
          </form>

          {/* Bulk Update Modal Trigger */}
          <button
            onClick={openBulkModal}
            className="login-btn"
            style={{
              backgroundColor: "#f39c12",
              color: "white",
              width: "100%",
              maxWidth: "300px",
              marginBottom: "12px"
            }}
          >
            Bulk Update List
          </button>

          {/* Current List */}
          <div style={{ maxWidth: "400px", width: "100%", marginBottom: "18px" }}>
            <h3 style={{ color: "#000", fontSize: "18px", marginBottom: "10px" }}>
              Current Prohibited Usernames ({badUsernames.length})
            </h3>
            {badUsernames.length === 0 ? (
              <p style={{ color: "#666", fontSize: "14px", textAlign: "center" }}>
                No prohibited usernames yet
              </p>
            ) : (
              <div style={{
                maxHeight: "180px",
                overflowY: "auto",
                border: "1px solid #ccc",
                borderRadius: "10px",
                padding: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.8)"
              }}>
                {badUsernames.map((username, index) => (
                  <div key={index} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom: index < badUsernames.length - 1 ? "1px solid #eee" : "none"
                  }}>
                    <span style={{ fontSize: "14px", color: "#333" }}>{username}</span>
                    <button
                      onClick={() => handleDeleteUsername(username)}
                      style={{
                        background: "#cc4125",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        padding: "3px 7px",
                        fontSize: "12px",
                        cursor: "pointer",
                        width: "54px"
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/admin")}
            className="login-btn"
            style={{
              marginTop: "10px",
              width: "100%",
              maxWidth: "300px",
              backgroundColor: "#007b8a",
              color: "black"
            }}
          >
            Return
          </button>
        </div>
      </div>

      {/* Custom Bulk Update Modal - OUTSIDE CONTAINER */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-content" >
            <h3 style={{ color: "#000" }}>Update Prohibited List</h3>
            <form onSubmit={handleBulkUpdate}>
              <textarea
                placeholder="Enter all prohibited usernames"
                value={bulkUsernames}
                onChange={(e) => setBulkUsernames(e.target.value)}
                required
                className="login-btn"
                style={{
                  marginBottom: "4px",
                  backgroundColor: "white",
                  height: "90px",
                  resize: "vertical",
                  borderRadius: "20px",
                  width: "100%"
                }}
              />
              <p style={{ fontSize: "12px", color: "#e74c3c", textAlign: "center", marginBottom: "6px" }}>
                ⚠️ Warning: This will replace the entire list! Use commas to separate usernames.
              </p>
              <button
                type="submit"
                className="login-btn"
                style={{
                  background: "linear-gradient(90deg, #e74c3c, #c0392b)",
                  color: "white",
                  width: "100%",
                  marginBottom: "6px"
                }}
              >
                Update Entire List
              </button>
              <button
                type="button"
                className="login-btn"
                style={{
                  background: "#bbb",
                  color: "black",
                  width: "100%",
                  marginBottom: "6px"
                }}
                onClick={closeBulkModal}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal (for bulk replace or delete) - OUTSIDE CONTAINER */}
      <AlertModal
        isOpen={showConfirmModal && !!usernameToDelete}
        onClose={handleModalClose}
        onConfirm={confirmDeleteUsername}
        title={modalTitle}
        message={modalMessage}
        confirmText="Remove"
        cancelText="Cancel"
        type="warning"
        showCancel={true}
      />
      <AlertModal
        isOpen={showConfirmModal && !usernameToDelete && !!pendingBulkUsernames.length}
        onClose={handleModalClose}
        onConfirm={confirmBulkUpdate}
        title={modalTitle}
        message={modalMessage}
        confirmText="Replace"
        cancelText="Cancel"
        type="warning"
        showCancel={true}
      />

      {/* Success Modal - OUTSIDE CONTAINER */}
      <AlertModal
        isOpen={showSuccessModal}
        onClose={handleModalClose}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        type="success"
        showCancel={false}
      />

      {/* Error Modal - OUTSIDE CONTAINER */}
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

export default BadUsernames;