// unchanged import statements
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertModal from "./AlertModal";
import "./MainStyles.css";

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
        const response = await fetch("http://localhost:5000/collections/");
        const data = await response.json();
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

  const handleSubmit = async (e) => {
Questions
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Basic validation
      if (!number || isNaN(Number(number))) {
        setAlertTitle("Invalid Input");
        setAlertMessage("Please enter a valid question number.");
        setAlertType("error");
        setShowAlert(true);
        setIsSubmitting(false);
        return;

  e.preventDefault();
  setIsSubmitting(true);

  try {
    // Fetch all existing questions to check duplicates
    const allRes = await fetch("http://localhost:5000/questions");
    const allQuestions = await allRes.json();
    const exists = allQuestions.some(
      (q) => q.number === parseInt(number) && q.collectionId === collectionId
    );
    if (exists) {
      return showError("Duplicate Question", "A question with that number already exists in the selected collection.");
    }

    // Basic validations
    if (!number || !collectionId || !question || !type || !hint || !funFact) {
      return showError("Missing Fields", "Please fill in all required fields.");
    }

    if (question.length > 1500) {
      return showError("Too Long", "Question description must not exceed 1500 characters.");
    }

    const formData = new FormData();
    formData.append("number", number);
    formData.append("collectionId", collectionId);
    formData.append("question", question);
    formData.append("type", type);
    formData.append("hint", hint);
    formData.append("funFact", funFact);

    if (type === "mcq") {
      const cleanOptions = options.map((opt) => opt.trim()).filter((opt) => opt);
      const uniqueOptions = [...new Set(cleanOptions)];

      if (cleanOptions.length < 2 || cleanOptions.length > 4) {
        return showError("MCQ Error", "Please enter between 2 and 4 non-empty MCQ options.");
main
      }
      if (!question.trim()) {
        setAlertTitle("Invalid Input");
        setAlertMessage("Please enter a question.");
        setAlertType("error");
        setShowAlert(true);
        setIsSubmitting(false);
        return;
      }
      if (selectedCollectionIds.length === 0) {
        setAlertTitle("Invalid Input");
        setAlertMessage("Please select at least one collection.");
        setAlertType("error");
        setShowAlert(true);
        setIsSubmitting(false);
        return;
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
          setAlertTitle("Invalid Input");
          setAlertMessage("MCQ requires at least 2 options.");
          setAlertType("error");
          setShowAlert(true);
          setIsSubmitting(false);
          return;
        }
        if (correctIndex === null || !trimmedOptions[correctIndex]) {
          setAlertTitle("Invalid Input");
          setAlertMessage("Please select the correct MCQ answer.");
          setAlertType("error");
          setShowAlert(true);
          setIsSubmitting(false);
          return;
        }
      } else {
        if (trimmedAnswers.length === 0) {
          setAlertTitle("Invalid Input");
          setAlertMessage("Please enter at least one acceptable answer.");
          setAlertType("error");
          setShowAlert(true);
          setIsSubmitting(false);
          return;
        }
      }

      // Optional: check if a doc with this number already exists (informational)
      let existingByNumber = null;
      try {
        const existsRes = await fetch(`http://localhost:5000/questions/${number}`);
        if (existsRes.ok) {
          const existsJson = await existsRes.json();
          existingByNumber = existsJson?.data || null;
        }
      } catch {
        // ignore precheck errors; backend will still upsert safely
      }

Questions
      const formData = new FormData();
      formData.append("number", String(number).trim());
      // Send collectionIds as a single JSON string (server accepts this)
      formData.append(
        "collectionIds",
        JSON.stringify(selectedCollectionIds.map((id) => id.trim()))
      );
      formData.append("question", question.trim());
      formData.append("type", type);
      formData.append("hint", hint.trim());
      formData.append("answer", JSON.stringify(trimmedAnswers));
      formData.append("funFact", funFact.trim());
      if (type === "mcq") {
        const trimmedOptions = options.map((opt) => opt.trim()).filter(Boolean);
        formData.append("options", JSON.stringify(trimmedOptions));
      }
      if (image) formData.append("image", image);

      const response = await fetch("http://localhost:5000/questions", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
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
      } else {
        setAlertTitle("Error");
        setAlertMessage(data.message || "Could not add question.");
        setAlertType("error");
        setShowAlert(true);

      if (cleanOptions.length !== uniqueOptions.length) {
        return showError("Duplicate Options", "Each MCQ option must be unique.");
main
      }

      if (correctIndex === null || !cleanOptions[correctIndex]) {
        return showError("Correct Answer Required", "Please select a valid correct answer.");
      }

      // Append options and correct answer
      cleanOptions.forEach((opt) => formData.append("options", opt));
      formData.append("answer", cleanOptions[correctIndex]);

    } else {
      // Open-ended answer parsing
      const parsedAnswers = answer
        .split(",")
        .map((ans) => ans.trim().replace(/^['"]|['"]$/g, ""))
        .filter((ans) => ans);

      if (!parsedAnswers.length) {
        return showError("Missing Answer", "Please enter at least one valid open-ended answer.");
      }

      parsedAnswers.forEach((ans) => formData.append("answer", ans));
    }

    if (image) formData.append("image", image);

    const response = await fetch("http://localhost:5000/questions", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      setAlertTitle("Success");
      setAlertMessage("Question added successfully!");
      setAlertType("success");
      setShowAlert(true);
      setNumber("");
      setCollectionId("");
      setQuestion("");
      setHint("");
      setAnswer("");
      setFunFact("");
      setType("open");
      setOptions(["", ""]);
      setCorrectIndex(null);
      setIsModalOpen(false);
      setImage(null);
    } else {
      const data = await response.json();
      return showError("Error", data.message || "Could not add question.");
    }
Questions

  } catch (err) {
    return showError("Error", "Failed to add question.");
  }

  setIsSubmitting(false);
};

const showError = (title, message) => {
  setAlertTitle(title);
  setAlertMessage(message);
  setAlertType("error");
  setShowAlert(true);
  setIsSubmitting(false);
};


  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
main

    setIsSubmitting(false);
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
