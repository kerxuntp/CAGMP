import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AlertModal from "./AlertModal";
import "./MainStyles.css";

const EditCollection = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [prevIsPublic, setPrevIsPublic] = useState(false);
  const [prevIsOnline, setPrevIsOnline] = useState(true);
  const [existingPublicCollection, setExistingPublicCollection] = useState(null);

  // Modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showPublicConfirmModal, setShowPublicConfirmModal] = useState(false);
  const [showCheckboxInfoModal, setShowCheckboxInfoModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [checkboxType, setCheckboxType] = useState(null);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const res = await fetch(`http://localhost:5000/collections/${id}`);
        const data = await res.json();
        setName(data.name);
        setCode(data.code);
        setIsPublic(data.isPublic);
        setIsOnline(data.isOnline);
        setPrevIsPublic(data.isPublic);
        setPrevIsOnline(data.isOnline);
      } catch {
        console.error("Failed to load collection");
      }
    };

    const checkPublicCollection = async () => {
      try {
        const res = await fetch("http://localhost:5000/collections");
        const data = await res.json();
        const publicCol = data.find((c) => c.isPublic && c._id !== id);
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
    setCheckboxType(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    if (isPublic && existingPublicCollection) {
      setModalTitle("Existing Public Collection");
      setModalMessage(
        `A public collection "${existingPublicCollection.name}" already exists. Please set it offline before making another one public.`
      );
      setShowPublicConfirmModal(true);
      return;
    }

    await submitCollection();
  };

  const submitCollection = async () => {
    try {
      const res = await fetch(`http://localhost:5000/collections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code: isPublic ? undefined : code,
          isPublic,
          isOnline,
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
        setCode(""); // Clear code when made public
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
          ? "This will make the collection public and available to all users. Collection code will be cleared and disabled."
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
      setModalMessage("Are you sure you want to delete this collection?");
      setShowDeleteConfirmModal(true);
    }
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`http://localhost:5000/collections/${id}`, {
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
          <input
            type="text"
            placeholder="Collection Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isPublic}
            className="login-btn"
            style={{ marginBottom: "10px", backgroundColor: isPublic ? "#e9ecef" : "white" }}
          />
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
    </div>
  );
};

export default EditCollection;
