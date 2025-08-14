import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AlertModal from "./AlertModal";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
import "../styles/global/MainStyles.css";

const EditCollection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState(""); // <-- NEW
  const [isPublic, setIsPublic] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [prevIsPublic, setPrevIsPublic] = useState(false);
  const [prevIsOnline, setPrevIsOnline] = useState(true);
  const [existingPublicCollection, setExistingPublicCollection] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showPublicConfirmModal, setShowPublicConfirmModal] = useState(false);
  const [showCheckboxInfoModal, setShowCheckboxInfoModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showCopySuccessModal, setShowCopySuccessModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [checkboxType, setCheckboxType] = useState(null);

  // Random code generator
  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  // Copy to clipboard function
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setModalTitle("Success");
      setModalMessage("Code copied to clipboard!");
      setShowCopySuccessModal(true);
    }).catch(() => {
      setModalTitle("Error");
      setModalMessage("Failed to copy code.");
      setShowErrorModal(true);
    });
  };

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/collections/${id}`);
        const data = await res.json();
        setName(data.name);
        setCode(data.code);
        setIsPublic(data.isPublic);
        setIsOnline(data.isOnline);
        setPrevIsPublic(data.isPublic);
        setPrevIsOnline(data.isOnline);
        setWelcomeMessage(data.welcomeMessage || "");
      } catch {
        console.error("Failed to load collection");
      }
    };

    const checkPublicCollection = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/collections`);
        const data = await res.json();
        const publicCol = data.find((c) => c.isPublic && c.isOnline && c._id !== id);
        setExistingPublicCollection(publicCol || null);
      } catch {
        console.error("Failed to check public collections");
      }
    };

    fetchCollection();
    checkPublicCollection();
  }, [id]);

  const handleModalClose = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setShowPublicConfirmModal(false);
    setShowCheckboxInfoModal(false);
    setShowDeleteConfirmModal(false);
    setShowCopySuccessModal(false);
    setCheckboxType(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.length > 20) {
      setModalTitle("Invalid Input");
      setModalMessage("Collection name cannot exceed 20 characters.");
      setShowErrorModal(true);
      return;
    }
    if (!isPublic && (code.length < 4 || code.length > 6)) {
      setModalTitle("Invalid Input");
      setModalMessage("Collection code must be 4-6 characters long.");
      setShowErrorModal(true);
      return;
    }
    if (welcomeMessage.length > 100) {
      setModalTitle("Invalid Input");
      setModalMessage("Welcome message cannot exceed 100 characters.");
      setShowErrorModal(true);
      return;
    }
    if (!name.trim()) {
      setModalTitle("Invalid Input");
      setModalMessage("Please enter a collection name.");
      setShowErrorModal(true);
      return;
    }
    if (!isPublic && !code.trim()) {
      setModalTitle("Invalid Input");
      setModalMessage("Please enter a collection code.");
      setShowErrorModal(true);
      return;
    }
    if (isPublic && isOnline && existingPublicCollection) {
      setModalTitle("Online Public Collection Exists");
      setModalMessage(
        `A public collection "${existingPublicCollection.name}" is already online. Please set it offline before making this one online.`
      );
      setShowPublicConfirmModal(true);
      return;
    }
    await submitCollection();
  };

  const submitCollection = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/collections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code: isPublic ? undefined : code,
          isPublic,
          isOnline,
          welcomeMessage,
        }),
      });
      if (res.ok) {
        setModalTitle("Success");
        setModalMessage("Collection updated successfully!");
        setShowSuccessModal(true);
      } else {
        const data = await res.json();
        setModalTitle("Error");
        setModalMessage(data.message || "Failed to update collection.");
        setShowErrorModal(true);
      }
    } catch {
      setModalTitle("Server Error");
      setModalMessage("Please try again later.");
      setShowErrorModal(true);
    }
  };

  const handleSuccessConfirm = () => {
    handleModalClose();
    navigate(`/get-collections/${id}`);
  };

  const handlePublicConfirm = () => {
    if (existingPublicCollection) {
      handleModalClose();
      navigate(`/edit-collection/${existingPublicCollection._id}`);
    } else {
      setShowPublicConfirmModal(false);
      submitCollection();
    }
  };

  const handleCheckboxChange = (type, newValue) => {
    if (type === "public") {
      setPrevIsPublic(isPublic);
      setIsPublic(newValue);
      if (newValue) {
        setCode("");
      }
    } else {
      setPrevIsOnline(isOnline);
      setIsOnline(newValue);
    }
    setCheckboxType(type);
    setModalTitle(type === "public" ? "Change Public Status?" : "Change Online Status?");
    setModalMessage(
      type === "public"
        ? newValue
          ? "This will make the collection public and available to all users. Only one public collection can be online at a time. Collection code will be cleared and disabled."
          : "This will remove this collection from public access."
        : newValue
        ? "This will make the collection available for gameplay."
        : "This will disable the collection from being accessed by players."
    );
    setShowCheckboxInfoModal(true);
  };

  const handleCheckboxConfirm = () => {
    setCheckboxType(null);
    handleModalClose();
  };

  const handleCheckboxCancel = () => {
    if (checkboxType === "public") setIsPublic(prevIsPublic);
    if (checkboxType === "online") setIsOnline(prevIsOnline);
    handleModalClose();
  };

  const handleDeleteClick = () => {
    if (isOnline) {
      setModalTitle("Cannot Delete Online Collection");
      setModalMessage(
        "This collection is currently online. Please set it offline before deleting."
      );
      setShowErrorModal(true);
    } else {
      setModalTitle("Confirm Delete");
      setModalMessage("Are you sure you want to delete this collection? Players data will be lost but Questions will be preserved.");
      setShowDeleteConfirmModal(true);
    }
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/collections/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setModalTitle("Deleted");
        setModalMessage("Collection deleted successfully.");
        setShowSuccessModal(true);
      } else {
        const data = await res.json();
        setModalTitle("Error");
        setModalMessage(data.message || "Failed to delete collection.");
        setShowErrorModal(true);
      }
    } catch {
      setModalTitle("Server Error");
      setModalMessage("Failed to delete collection.");
      setShowErrorModal(true);
    } finally {
      setShowDeleteConfirmModal(false);
    }
  };

  return (
    <div className="login-container">
      <img src="/images/changihome.jpg" alt="Background" className="background-image" />
      <div className="page-overlay" />
      <div className="buttons">
        <h2 style={{ color: "#000", fontSize: "24px", marginBottom: "10px" }}>Edit Collection</h2>
        <form onSubmit={handleSubmit} style={{ maxWidth: "300px", width: "100%" }}>
          <input
            type="text"
            placeholder="Collection Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="login-btn"
            style={{ marginBottom: "10px", backgroundColor: "white" }}
          />
          <div style={{ display: "flex", marginBottom: "10px", gap: "10px" }}>
            <input
              type="text"
              placeholder="Collection Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isPublic}
              className="login-btn"
              style={{ backgroundColor: isPublic ? "#e9ecef" : "white", flex: 1 }}
            />
            <button
              type="button"
              onClick={() => setCode(generateRandomCode())}
              disabled={isPublic}
              className="login-btn"
              style={{
                width: "90px",
                backgroundColor: isPublic ? "#e9ecef" : "#17C4C4",
                color: isPublic ? "#6c757d" : "#fff",
                padding: "0 10px",
              }}
            >
              Generate
            </button>
            <button
              type="button"
              onClick={handleCopyCode}
              disabled={isPublic || !code.trim()}
              className="login-btn"
              style={{
                width: "70px",
                backgroundColor: isPublic || !code.trim() ? "#e9ecef" : "#17C4C4",
                color: isPublic || !code.trim() ? "#6c757d" : "#fff",
                padding: "0 10px",
              }}
            >
              Copy
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <div>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => handleCheckboxChange("public", e.target.checked)}
              />
              <label style={{ marginLeft: "8px" }}>Set as Public</label>
            </div>
            <div>
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(e) => handleCheckboxChange("online", e.target.checked)}
              />
              <label style={{ marginLeft: "8px" }}>Online</label>
            </div>
          </div>
          {/* Welcome Message Field */}
          <textarea
            placeholder="Welcome message for players (optional)"
            value={welcomeMessage}
            onChange={e => setWelcomeMessage(e.target.value)}
            className="login-btn"
            style={{ marginBottom: "10px", backgroundColor: "white", minHeight: "60px" }}
          />
          <button
            type="submit"
            className="login-btn"
            style={{
              background: "linear-gradient(90deg, #C4EB22, #17C4C4)",
              color: "black",
              width: "100%",
              marginBottom: "10px",
            }}
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            className="login-btn"
            style={{
              backgroundColor: "#DC3545",
              color: "#fff",
              width: "100%",
              marginBottom: "10px",
            }}
          >
            Delete Collection
          </button>
          <button
            type="button"
            onClick={() => navigate("/collections-bank")}
            className="login-btn"
            style={{ backgroundColor: "#17C4C4", color: "#fff", width: "100%" }}
          >
            Return
          </button>
        </form>
      </div>
      <AlertModal
        isOpen={showSuccessModal}
        onClose={handleSuccessConfirm}
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
      <AlertModal
        isOpen={showPublicConfirmModal}
        onClose={handleModalClose}
        onConfirm={handlePublicConfirm}
        title={modalTitle}
        message={modalMessage}
        confirmText="Go to Edit"
        cancelText="Cancel"
        type="warning"
        showCancel={true}
      />
      <AlertModal
        isOpen={showCheckboxInfoModal}
        onClose={handleModalClose}
        onConfirm={handleCheckboxConfirm}
        onCancel={handleCheckboxCancel}
        title={modalTitle}
        message={modalMessage}
        confirmText="Confirm"
        cancelText="Cancel"
        type="info"
        showCancel={true}
      />
      <AlertModal
        isOpen={showDeleteConfirmModal}
        onClose={handleModalClose}
        onConfirm={confirmDelete}
        title={modalTitle}
        message={modalMessage}
        confirmText="Delete"
        cancelText="Cancel"
        type="warning"
        showCancel={true}
      />
      <AlertModal
        isOpen={showCopySuccessModal}
        onClose={handleModalClose}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        type="success"
        showCancel={false}
      />
    </div>
  );
};

export default EditCollection;