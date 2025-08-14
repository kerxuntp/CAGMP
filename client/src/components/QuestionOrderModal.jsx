import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const QuestionOrderModal = ({ collection, questions, setQuestions, onModalFeedback }) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const [showModal, setShowModal] = useState(false);
  const [orderedQuestions, setOrderedQuestions] = useState([]);

  useEffect(() => {
    if (!collection) return;
    // The questions prop is already the questions in this collection, in order
    setOrderedQuestions(Array.isArray(questions) ? [...questions] : []);
  }, [collection, questions]);

  const move = (from, to) => {
    if (to < 0 || to >= orderedQuestions.length) return;
    const arr = [...orderedQuestions];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setOrderedQuestions(arr);
  };

  const handleSave = async () => {
    try {
      const ids = orderedQuestions.map((q) => q._id);
      const res = await fetch(
        `${baseUrl}/collections/${collection._id}/question-order`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionOrder: ids }),
        }
      );
      if (res.ok) {
        onModalFeedback?.("Success", "Question order updated successfully!", "success");
        setShowModal(false);
        // Refresh questions
        const refreshed = await fetch(`${baseUrl}/collections/${collection._id}/questions`);
        const data = await refreshed.json();
        setQuestions(Array.isArray(data) ? data : data.questions || []);
      } else {
        const data = await res.json();
        onModalFeedback?.("Error", data.message || "Failed to update question order.", "error");
      }
    } catch (err) {
      console.error(err);
      onModalFeedback?.("Server Error", "Error updating question order. Please try again.", "error");
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
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
        Order Questions
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
                padding: "20px",
                borderRadius: "10px",
                width: "80%",
                maxWidth: "600px",
                maxHeight: "80vh",
                overflowY: "auto",
                color: "#000",
              }}
            >
              <h3 style={{ marginBottom: "20px", textAlign: "center" }}>
                Reorder Questions
              </h3>

              {orderedQuestions.length === 0 ? (
                <p style={{ textAlign: "center", color: "#666" }}>
                  No questions found.
                </p>
              ) : (
                orderedQuestions.map((q, idx) => (
                  <div
                    key={q._id}
                    style={{
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #dee2e6",
                      padding: "12px",
                      marginBottom: "8px",
                      borderRadius: "5px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "#28a745",
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        minWidth: "60px",
                        textAlign: "center",
                      }}
                    >
                      Game Q{idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                        {q.question.slice(0, 80)}...
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <button
                        onClick={() => move(idx, idx - 1)}
                        disabled={idx === 0}
                        style={{
                          backgroundColor: idx === 0 ? "#ccc" : "#007bff",
                          color: "#fff",
                          border: "none",
                          borderRadius: "3px",
                          padding: "4px 8px",
                          fontSize: "12px",
                          cursor: idx === 0 ? "not-allowed" : "pointer",
                        }}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => move(idx, idx + 1)}
                        disabled={idx === orderedQuestions.length - 1}
                        style={{
                          backgroundColor:
                            idx === orderedQuestions.length - 1 ? "#ccc" : "#007bff",
                          color: "#fff",
                          border: "none",
                          borderRadius: "3px",
                          padding: "4px 8px",
                          fontSize: "12px",
                          cursor:
                            idx === orderedQuestions.length - 1
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleSave}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  Save Order
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

export default QuestionOrderModal;
