import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import QuestionOrderModal from "./QuestionOrderModal";
import GameSettingsModal from "./GameSettingsModal";
import AlertModal from "./AlertModal";
import Loading from "./Loading";
import "../styles/pages/Questions.css";
import "../styles/global/MainStyles.css";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const GetCollection = () => {
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(() => {});

  const location = useLocation();
  const fromPage = location.state?.from || "questions";
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setModalTitle("Not Logged In");
      setModalMessage("You must be logged in to access this page.");
      setShowErrorModal(true);
    }
  }, [navigate]);

  useEffect(() => {
    const fetchCollection = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/collections/${id}`);
        const data = await res.json();
        if (data && data._id) {
          setSelectedCollection(data);
        } else {
          navigate(fromPage === "collections" ? "/collections-bank" : "/questions?collection=all");
        }
      } catch {
        navigate(fromPage === "collections" ? "/collections-bank" : "/questions?collection=all");
      }
      setLoading(false);
    };
    if (id) fetchCollection();
  }, [fromPage, id, navigate]);

  useEffect(() => {
    if (!id || !selectedCollection) return;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/collections/${id}/questions`);
        if (!res.ok) {
          const data = await res.json();
          setModalTitle("Error");
          setModalMessage(data.message || "Failed to fetch questions.");
          setShowErrorModal(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setQuestions(Array.isArray(data) ? data : data.questions || []);
      } catch {
        setModalTitle("Server Error");
        setModalMessage("Failed to fetch questions.");
        setShowErrorModal(true);
        setQuestions([]);
      }
      setLoading(false);
    })();
  }, [id, selectedCollection]);

  const handleModalClose = () => {
    setShowConfirmModal(false);
    setShowSuccessModal(false);
    setShowErrorModal(false);
  };

  const handleEditCollection = () => {
    navigate(`/edit-collection/${selectedCollection._id}`, {
      state: { from: fromPage }
    });
  };

  const handleDeleteCollectionClick = () => {
    if (selectedCollection.isOnline) {
      setModalTitle("Collection is Online");
      setModalMessage(
        `The collection "${selectedCollection.name}" is still online. Please set it to offline before deleting.`
      );
      setShowErrorModal(true);
      return;
    }

    if (selectedCollection.isPublic) {
      setModalTitle("Cannot Delete Public Collection");
      setModalMessage(
        `The collection "${selectedCollection.name}" is public. Please set its online status to offline in Edit Collection before deleting.`
      );
      setOnConfirmAction(() => () => {
        handleModalClose();
        navigate(`/edit-collection/${selectedCollection._id}`, {
          state: { from: fromPage }
        });
      });
      setShowConfirmModal(true);
      return;
    }

    setModalTitle("Confirm Delete");
    setModalMessage(
      `Are you sure you want to delete "${selectedCollection.name}"?\n\nThis will also delete all players, auto clear configs, and logs associated with this collection. Questions will be preserved.`
    );
    setOnConfirmAction(() => async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/collections/${selectedCollection._id}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          setModalTitle("Deleted");
          setModalMessage("Collection deleted successfully!");
          setShowSuccessModal(true);
        } else {
          const data = await res.json();
          setModalTitle("Error");
          setModalMessage(data.message || "Failed to delete collection.");
          setShowErrorModal(true);
        }
      } catch {
        setModalTitle("Server Error");
        setModalMessage("Error deleting collection.");
        setShowErrorModal(true);
      }
      setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };

  const handleDeleteCollectionSuccess = () => {
    handleModalClose();
    navigate(fromPage === "collections" ? "/collections-bank" : "/questions?collection=all");
  };

  const handleDeleteQuestionClick = (q) => {
    // Always use selectedCollection._id for removal
    const collectionId = selectedCollection?._id;
    if (!collectionId) {
      setModalTitle("Error");
      setModalMessage("Invalid collectionId: undefined");
      setShowErrorModal(true);
      return;
    }
    // Determine question label: always use index+1 for display
    let qLabel = "";
    if (selectedCollection && Array.isArray(selectedCollection.questionOrder) && selectedCollection.questionOrder.length > 0) {
      const idx = questions.findIndex(qq => qq._id === q._id);
      qLabel = idx !== -1 ? `Game Q${idx + 1}` : "Question";
    } else {
      const idx = questions.findIndex(qq => qq._id === q._id);
      qLabel = idx !== -1 ? `Question ${idx + 1}` : "Question";
    }
    setModalTitle("Remove from Collection");
    setModalMessage(`Remove ${qLabel} from this collection?`);
    setOnConfirmAction(() => async () => {
      try {
        // Use q._id instead of q.number for DELETE endpoint
        const res = await fetch(`${API_BASE_URL}/questions/${q._id}/${collectionId}`, {
          method: "DELETE"
        });
        if (res.ok) {
          setQuestions((prev) => prev.filter((item) => item._id !== q._id));
          setModalTitle("Removed");
          setModalMessage("Question removed from this collection.");
          setShowSuccessModal(true);
        } else {
          const data = await res.json();
          setModalTitle("Error");
          setModalMessage(data.message || "Failed to remove question from collection.");
          setShowErrorModal(true);
        }
      } catch {
        setModalTitle("Server Error");
        setModalMessage("Error removing question from collection.");
        setShowErrorModal(true);
      }
      setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };

  return (
    <div className="login-container">
      <img src="/images/changihome.jpg" alt="Background" className="background-image" />
      <div className="page-overlay" />
      <div className="top-left-logo">
        <img src="/images/ces.jpg" alt="CES" />
      </div>
      <div className="scroll-wrapper">
        <div className="buttons">
          <p style={{ fontSize: "18px", fontWeight: "bold", color: "#000", marginTop: "100px" }}>
            Managing Collection: "{selectedCollection?.name || id}" {selectedCollection?.isPublic ? "(Public)" : ""} {selectedCollection?.isOnline ? "(Online)" : "(Offline)"}
          </p>

          {loading && (
            <div style={{ margin: '40px 0' }}><Loading /></div>
          )}

          {!loading && selectedCollection && (
            <div style={{ backgroundColor: "rgba(255,255,255,0.9)", padding: "10px", borderRadius: "8px", marginBottom: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={handleEditCollection}
                style={{
                  backgroundColor: "#28a745",
                  color: "#000",
                  fontSize: "12px",
                  padding: "4px 8px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Edit Collection
              </button>
              <button
                onClick={handleDeleteCollectionClick}
                style={{
                  backgroundColor: "#28a745",
                  color: "#000",
                  fontSize: "12px",
                  padding: "4px 8px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Delete Collection
              </button>
              <div style={{ flex: 1 }}>
                <QuestionOrderModal
                  collection={selectedCollection}
                  questions={questions}
                  setQuestions={setQuestions}
                  onModalFeedback={(title, message, type, updatedCollection) => {
                    setModalTitle(title);
                    setModalMessage(message);
                    type === "success" ? setShowSuccessModal(true) : setShowErrorModal(true);
                    if (updatedCollection) setSelectedCollection(updatedCollection);
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <GameSettingsModal
                  collection={selectedCollection}
                  onModalFeedback={(title, message, type) => {
                    setModalTitle(title);
                    setModalMessage(message);
                    if (type === "success") setShowSuccessModal(true);
                    else setShowErrorModal(true);
                  }}
                />
              </div>
            </div>
          )}

          {!loading && (
            <div style={{ maxHeight: "80vh", overflowY: "auto", width: "100%", marginBottom: "16px" }}>
              {questions.length === 0 ? (
                <p>No questions found in this collection.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {questions.map((q, i) => (
                    <li key={q._id} onClick={() => navigate(`/edit-question/${q._id}`)} style={{ background: "#fff", borderRadius: "8px", padding: "10px", marginBottom: "8px", cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <strong>
                          {`Game Q${i + 1}`}
                        </strong>
                      </div>
                      <p style={{ marginBottom: "8px" }}>{q.question}</p>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="login-btn" style={{ backgroundColor: "#FFC107", color: "#000", padding: "5px 10px", fontSize: "14px" }} onClick={(e) => { e.stopPropagation(); navigate(`/edit-question/${q._id}`); }}>
                          Edit
                        </button>
                        <button className="login-btn" style={{ background: "#DC3545", color: "#fff", padding: "5px 10px", fontSize: "14px" }} onClick={(e) => { e.stopPropagation(); handleDeleteQuestionClick(q); }}>
                          Remove from Collection
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
            <button
              onClick={() =>
                fromPage === "collections"
                  ? navigate("/collections-bank")
                  : navigate("/questions?collection=all")
              }
              className="login-btn"
              style={{ backgroundColor: "#17C4C4", color: "#000" }}
            >
              Return
            </button>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={showConfirmModal}
        onClose={handleModalClose}
        onConfirm={() => onConfirmAction()}
        title={modalTitle}
        message={modalMessage}
        confirmText={modalTitle === "Cannot Delete Public Collection" ? "Edit Collection" : "Delete"}
        cancelText="Cancel"
        type="warning"
        showCancel={true}
      />

      <AlertModal
        isOpen={showSuccessModal}
        onClose={modalTitle === "Deleted" ? handleDeleteCollectionSuccess : handleModalClose}
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
    </div>
  );
};

export default GetCollection;