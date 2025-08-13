import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertModal from "./AlertModal";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
import "../styles/global/MainStyles.css";

const CreateQuestion = () => {
  const [number, setNumber] = useState("");
  const [collectionId, setCollectionId] = useState("");
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

  // AlertModal state
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
        const response = await fetch(`${API_BASE_URL}/collections/`);
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

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 4) setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctIndex === index) setCorrectIndex(null);
      else if (correctIndex > index) setCorrectIndex(correctIndex - 1);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    // Fetch all existing questions to check duplicates
    const allRes = await fetch(`${API_BASE_URL}/questions`);
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
      }

      if (cleanOptions.length !== uniqueOptions.length) {
        return showError("Duplicate Options", "Each MCQ option must be unique.");
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

    const response = await fetch(`${API_BASE_URL}/questions`, {
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

  // AlertModal close handler
  const handleAlertClose = () => {
    setShowAlert(false);
    if (alertTitle === "Not Logged In") {
      navigate("/login");
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

          <select
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
            required
            className="dropdown-select"
          >
            <option value="">Select Collection</option>
            {collections.map((col) => (
              <option key={col._id} value={col._id}>
                {col.name}
              </option>
            ))}
          </select>

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
            style={{ marginBottom: "10px" }}
          />

          {type === "mcq" && (
            <button type="button" onClick={openModal} className="login-btn">
              Manage MCQ Options
            </button>
          )}

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
          <button
            type="button"
            onClick={() => navigate("/questions")}
            className="login-btn"
            style={{ marginTop: "12px" }}
          >
            Return
          </button>
        </form>
      </div>

      {/* Modal for MCQ Options */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Manage MCQ Options</h3>
            <div className="mcq-options-container">
              {options.map((opt, index) => (
                <div key={index} className="mcq-option-row">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    className="login-btn"
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(index)} style={{ marginLeft: 6 }}>
                      ✖
                    </button>
                  )}
                </div>
              ))}
              {options.length < 4 && (
                <button type="button" onClick={addOption} style={{ marginTop: 8 }}>
                  + Add Option
                </button>
              )}
              <select
                value={correctIndex !== null ? correctIndex : ""}
                onChange={(e) => setCorrectIndex(Number(e.target.value))}
                required
                className="dropdown-select"
                style={{ marginTop: 10 }}
              >
                <option value="">Select Correct Answer</option>
                {options.map((opt, idx) => (
                  <option key={idx} value={idx}>
                    {`Option ${String.fromCharCode(65 + idx)} - ${opt || "Empty"}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={closeModal} className="login-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={showAlert}
        onClose={handleAlertClose}
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