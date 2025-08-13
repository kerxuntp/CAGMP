// unchanged import statements
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertModal from "./AlertModal";
import "../styles/global/MainStyles.css";


const CreateQuestion = () => {
  const [number, setNumber] = useState("");
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setAlertTitle("Not Logged In");
      setAlertMessage("You must be logged in to access this page.");
      setAlertType("error");
      setShowAlert(true);
      return;
    }
    const fetchCollections = async () => {
      try {
        const res = await fetch("http://localhost:5000/collections/");
        const data = await res.json();
        setCollections(data);
      } catch {
        setAlertTitle("Error");
        setAlertMessage("Failed to fetch collections.");
        setAlertType("error");
        setShowAlert(true);
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
      if (!number || isNaN(Number(number))) {
        return showError("Invalid Input", "Please enter a valid question number.");
      }
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

      // Optional: check whether a doc with this number already exists (informational only)
      let existingByNumber = null;
      try {
        const existsRes = await fetch(`http://localhost:5000/questions/${number}`);
        if (existsRes.ok) {
          const existsJson = await existsRes.json();
          existingByNumber = existsJson?.data || null;
        }
      } catch {
        // ignore precheck errors
      }

      // Build payload
      const formData = new FormData();
      formData.append("number", String(number).trim());
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
      const res = await fetch("http://localhost:5000/questions", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        return showError("Error", data.message || "Could not add question.");
      }

      setAlertTitle("Success");
      setAlertMessage(
        existingByNumber
          ? "Question saved and merged into the existing number (collections updated)."
          : "Question added successfully!"
      );
      setAlertType("success");
      setShowAlert(true);

      // Reset form
      setNumber("");
      setSelectedCollectionIds([]);
      setQuestion("");
      setHint("");
      setAnswer("");
      setFunFact("");
      setType("open");
      setOptions(["", ""]);
      setCorrectIndex(null);
      setIsModalOpen(false);
      setImage(null);
    } catch (err) {
      showError("Error", "Failed to add question.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

          <input
            type="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Question Number"
            required
            className="login-btn"
          />

          <div className="collection-box">
            <p className="collection-title">Select Collections:</p>
            {collections.map((col) => (
              <label
                key={col._id}
                className="collection-item"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 10px',
                  background: '#222',
                  color: '#fff',
                  margin: '5px 0',
                  borderRadius: '6px'
                }}
              >
                <span>{col.name}</span>
                <input
                  type="checkbox"
                  checked={selectedCollectionIds.includes(col._id)}
                  onChange={() => toggleCollection(col._id)}
                />
              </label>
            ))}
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
