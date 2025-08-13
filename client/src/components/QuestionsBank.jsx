// QuestionsBank.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AlertModal from "./AlertModal";
import "./Questions.css";
import "./MainStyles.css";

const QuestionsBank = () => {
  const [questions, setQuestions] = useState([]);
  const [collections, setCollections] = useState([]);
  const [collectionId, setCollectionId] = useState("");

  const [showError, setShowError] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const passedId = new URLSearchParams(location.search).get("collection");

  useEffect(() => {
    if (!localStorage.getItem("jwtToken")) {
      setModalTitle("Not Logged In");
      setModalMessage("You must be logged in to access this page.");
      setShowError(true);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/collections/");
        const data = await res.json();
        setCollections(data);
        if (data.length && !collectionId) {
          setCollectionId(passedId || "all");
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [passedId, collectionId]);

  useEffect(() => {
    if (!collectionId) return;
    const url =
      collectionId === "all"
        ? "http://localhost:5000/questions"
        : `http://localhost:5000/collections/${collectionId}/questions`;
    (async () => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        setQuestions(Array.isArray(data) ? data : data.questions || []);
      } catch (err) {
        console.error(err);
        setQuestions([]);
      }
    })();
  }, [collectionId]);

  const getCollectionName = (id) => {
    const col = collections.find((c) => c._id === id);
    return col ? col.name : "Unknown Collection";
  };

  // 🔧 EDIT now uses only the number — no collection context required
  const handleEdit = (number) => {
    navigate(`/edit-question/${number}`);
  };

  const handleDeleteClick = (q) => {
    setDeleteTarget(q);
    setModalTitle("Confirm Delete");
    setModalMessage("Are you sure you want to delete this question?");
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    const { number, collectionId: legacyColId, collectionIds } = deleteTarget || {};
    // Keep existing behavior: require a collection in context for deletion
    const targetCollection =
      collectionId !== "all" ? collectionId : (legacyColId || (Array.isArray(collectionIds) ? collectionIds[0] : null));

    if (!targetCollection) {
      setModalTitle("Error");
      setModalMessage("Collection ID not found for this question.");
      setShowError(true);
    } else {
      try {
        const res = await fetch(
          `http://localhost:5000/questions/${number}/${targetCollection}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          setQuestions((prev) =>
            prev.filter((q) => {
              const inTarget =
                q.number === number &&
                (q.collectionId === targetCollection ||
                 (Array.isArray(q.collectionIds) && q.collectionIds.includes(targetCollection)));
              return !inTarget;
            })
          );
          setModalTitle("Deleted");
          setModalMessage("Question deleted.");
          setShowDeleteSuccess(true);
        } else {
          const data = await res.json();
          setModalTitle("Error");
          setModalMessage(data.message || "Failed to delete question.");
          setShowError(true);
        }
      } catch (err) {
        console.error(err);
        setModalTitle("Error");
        setModalMessage("Error deleting question.");
        setShowError(true);
      }
    }
    setShowConfirmDelete(false);
    setDeleteTarget(null);
  };

  const closeModal = () => {
    setShowError(false);
    setShowConfirmDelete(false);
    setShowDeleteSuccess(false);
    if (modalTitle === "Not Logged In") {
      navigate("/login");
    }
  };

  // Helper for All view badge
  const renderAllViewBadge = (q) => {
    const ids = Array.isArray(q.collectionIds) ? q.collectionIds.map(String) : [];
    const legacy = q.collectionId ? [String(q.collectionId)] : [];
    const all = [...new Set([...ids, ...legacy])];

    if (all.length === 0) return null;
    if (all.length > 1) {
      return (
        <span
          style={{
            fontSize: "12px",
            color: "#666",
            background: "#f0f0f0",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          Multiple
        </span>
      );
    }
    return (
      <span
        style={{
          fontSize: "12px",
          color: "#666",
          background: "#f0f0f0",
          padding: "2px 6px",
          borderRadius: "4px",
        }}
      >
        {getCollectionName(all[0])}
      </span>
    );
  };

  return (
    <div className="login-container">
      <img src="/images/changihome.jpg" alt="BG" className="background-image" />
      <div className="page-overlay" />
      <div className="top-left-logo">
        <img src="/images/ces.jpg" alt="Logo" />
      </div>
      <div className="scroll-wrapper">
        <div className="buttons" style={{ gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <select
              value={collectionId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "all") {
                  navigate("/questions?collection=all");
                } else {
                  navigate(`/get-collections/${val}`, {
                    state: { from: "questions" },
                  });
                }
              }}
              style={{ padding: "6px", fontSize: "15px" }}
            >
              <option value="all">All Questions</option>
              {collections.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} Collection
                </option>
              ))}
            </select>
            <p style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>
              Viewing "{collectionId === "all"
                ? "All Collections"
                : (collections.find((c) => c._id === collectionId)?.name || "Unknown")}"
            </p>
          </div>

          <div style={{ maxHeight: "65vh", overflowY: "auto" }}>
            {questions.length === 0 ? (
              <p>No questions found.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {questions.map((q, idx) => (
                  <li
                    key={q._id}
                    onClick={() => handleEdit(q.number)}   
                    style={{
                      background: "#fff",
                      borderRadius: "8px",
                      padding: "10px",
                      marginBottom: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>
                        {collectionId !== "all" &&
                        collections.find((c) => c._id === collectionId)?.questionOrder?.length > 0
                          ? `Game Q${idx + 1}: (Original Q${q.number})`
                          : `Q${q.number}`}
                      </strong>

                      {collectionId === "all" && renderAllViewBadge(q)}
                    </div>

                    <p style={{ margin: "8px 0" }}>{q.question}</p>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="login-btn"
                        style={{ backgroundColor: "#FFC107", color: "#000" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(q.number);            // 🔧 only number
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="login-btn"
                        style={{ backgroundColor: "#DC3545", color: "#fff" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(q);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button onClick={() => navigate("/add-question")} className="login-btn">
              Add New Question
            </button>
            <button
              onClick={() => navigate("/admin")}
              className="login-btn"
              style={{ backgroundColor: "#17C4C4" }}
            >
              Return
            </button>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={showError}
        onClose={closeModal}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        type={modalTitle === "Not Logged In" ? "error" : "info"}
        showCancel={false}
      />

      <AlertModal
        isOpen={showConfirmDelete}
        onClose={closeModal}
        onConfirm={confirmDelete}
        title={modalTitle}
        message={modalMessage}
        confirmText="Delete"
        cancelText="Cancel"
        type="warning"
        showCancel={true}
      />

      <AlertModal
        isOpen={showDeleteSuccess}
        onClose={closeModal}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        type="success"
        showCancel={false}
      />
    </div>
  );
};

export default QuestionsBank;
