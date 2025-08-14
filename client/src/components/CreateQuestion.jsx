import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertModal from "./AlertModal";
import Loading from "./Loading";
import "../styles/global/MainStyles.css";



const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://shared-api-url.com';

const CreateQuestion = () => {
  // Remove number state
  const [selectedCollectionIds, setSelectedCollectionIds] = useState([]);
  const [question, setQuestion] = useState("");
  const [hint, setHint] = useState("");
  const [answer, setAnswer] = useState("");
  const [funFact, setFunFact] = useState("");
  const [type, setType] = useState("open");
  const [options, setOptions] = useState(["", ""]);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [collections, setCollections] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [image, setImage] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setAlertTitle("Not Logged In");
      setAlertMessage("You must be logged in to access this page.");
      setAlertType("error");
      setShowAlert(true);
      setLoading(false);
      return;
    }
    const fetchCollections = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/collections/`);
        if (!res.ok) throw new Error("Failed to fetch collections");
        const data = await res.json();
        setCollections(Array.isArray(data) ? data : []);
      } catch {
        setAlertTitle("Error");
        setAlertMessage("Failed to fetch collections.");
        setAlertType("error");
        setShowAlert(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, [navigate]);

  const toggleCollection = (id) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const showError = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType("error");
    setShowAlert(true);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Basic validation
  // No manual number field, backend will auto-assign
      if (!question.trim()) {
        return showError("Invalid Input", "Please enter a question.");
      }
      if (question.length > 1500) {
        return showError("Too Long", "Question description must not exceed 1500 characters.");
      }
      if (selectedCollectionIds.length === 0) {
        return showError("Invalid Input", "Please select at least one collection.");
      }
      if (!hint.trim() || !funFact.trim()) {
        return showError("Missing Fields", "Hint and fun fact cannot be empty.");
      }

      // Prepare answers/options
      let trimmedAnswers =
        type === "mcq"
          ? (correctIndex !== null ? [options[correctIndex]] : [])
          : answer
              .split(",")
              .map((ans) => ans.trim())
              .filter((ans) => ans);

      if (type === "mcq") {
        const trimmedOptions = options.map((opt) => opt.trim()).filter(Boolean);
        if (trimmedOptions.length < 2) {
          return showError("Invalid Input", "MCQ requires at least 2 options.");
        }
        if (correctIndex === null || !trimmedOptions[correctIndex]) {
          return showError("Invalid Input", "Please select the correct MCQ answer.");
        }
      } else {
        if (trimmedAnswers.length === 0) {
          return showError("Invalid Input", "Please enter at least one acceptable answer.");
        }
      }

  // No precheck for number needed

      // Build payload
      const formData = new FormData();
  // Do not send number, backend will assign
      formData.append(
        "collectionIds",
        JSON.stringify(selectedCollectionIds.map((id) => id.trim()))
      );
      formData.append("question", question.trim());
      formData.append("type", type);
      formData.append("hint", hint.trim());
      formData.append("funFact", funFact.trim());
      if (type === "mcq") {
        const trimmedOptions = options.map((opt) => opt.trim()).filter(Boolean);
        formData.append("options", JSON.stringify(trimmedOptions));
        formData.append("answer", JSON.stringify([trimmedOptions[correctIndex]]));
      } else {
        formData.append("answer", JSON.stringify(trimmedAnswers));
      }
      if (image) formData.append("image", image);

      // Create / merge one doc per question number
      const res = await fetch(`${API_BASE_URL}/questions`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        return showError("Error", data.message || "Could not add question.");
      }

  setAlertTitle("Success");
  setAlertMessage("Question added successfully!");
  setAlertType("success");
  setShowAlert(true);

      // Reset form
  // No number to reset
      setSelectedCollectionIds([]);
      setQuestion("");
      setHint("");
      setAnswer("");
      setFunFact("");
      setType("open");
      setOptions(["", ""]);
      setCorrectIndex(null);
      setImage(null);
    } catch {
      showError("Error", "Failed to add question.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="login-container">
        <img src="/images/changihome.jpg" alt="Background" className="background-image" />
        <div className="page-overlay"></div>
        <div className="page-content scrollable-container" style={{ textAlign: "center" }}>
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <img src="/images/changihome.jpg" alt="Background" className="background-image" />
      <div className="page-overlay"></div>
      <div className="page-content scrollable-container">
        <h2>Create a New Question</h2>
        <form onSubmit={handleSubmit} className="centered-form">
          <select value={type} onChange={(e) => setType(e.target.value)} required className="dropdown-select">
            <option value="open">Open-Ended Question</option>
            <option value="mcq">Multiple Choice Question</option>
          </select>

          {/* Number field removed, backend will auto-assign */}

          <div className="collection-box">
            <p className="collection-title">Select Collections:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {collections.map((col) => (
                <div
                  key={col._id}
                  className="collection-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#222',
                    color: '#fff',
                    margin: '0',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    gap: '12px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCollectionIds.includes(col._id)}
                    onChange={() => toggleCollection(col._id)}
                    style={{ marginRight: '10px', accentColor: '#17C4C4', width: '18px', height: '18px' }}
                  />
                  <span style={{ flex: 1 }}>{col.name}</span>
                </div>
              ))}
            </div>
          </div>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Question Description"
            required
            className="login-btn"
          />

          <input
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Hint"
            className="login-btn"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="login-btn"
          />

          {type === "open" && (
            <>
              <p>Enter acceptable answers (comma-separated):</p>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Answer(s)"
                className="login-btn"
              />
            </>
          )}

          {type === "mcq" && (
            <>
              {/* MCQ options */}
              {options.map((opt, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[idx] = e.target.value;
                      setOptions(next);
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    className="login-btn"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = options.filter((_, i) => i !== idx);
                        setOptions(next);
                        if (correctIndex === idx) setCorrectIndex(null);
                        else if (correctIndex > idx) setCorrectIndex((ci) => ci - 1);
                      }}
                    >
                      ✖
                    </button>
                  )}
                </div>
              ))}
              {options.length < 4 && (
                <button type="button" onClick={() => setOptions((o) => [...o, ""])}>
                  + Add Option
                </button>
              )}

              {/* Correct answer picker */}
              <select
                value={correctIndex !== null ? correctIndex : ""}
                onChange={(e) => setCorrectIndex(Number(e.target.value))}
                required
                className="dropdown-select"
              >
                <option value="">Select Correct Answer</option>
                {options.map((opt, idx) => (
                  <option key={idx} value={idx}>
                    Option {String.fromCharCode(65 + idx)} - {opt}
                  </option>
                ))}
              </select>
            </>
          )}

          <input
            type="text"
            value={funFact}
            onChange={(e) => setFunFact(e.target.value)}
            placeholder="Fun Fact"
            className="login-btn"
          />

          <button type="submit" className="login-btn" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Add"}
          </button>
          <button type="button" onClick={() => navigate("/questions")} className="login-btn">
            Return
          </button>
        </form>
      </div>

      <AlertModal
        isOpen={showAlert}
        onClose={() => {
          setShowAlert(false);
          if (alertTitle === "Not Logged In") navigate("/login");
        }}
        title={alertTitle}
        message={alertMessage}
        confirmText="OK"
        type={alertType}
        showCancel={false}
      />
    </div>
  );
};

export default CreateQuestion;
