import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AlertModal from "./AlertModal";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
import "../styles/global/MainStyles.css";

const EditQuestion = () => {
  const { number, collectionId } = useParams();
  const navigate = useNavigate();

  const [collectionName, setCollectionName] = useState("");
  const [question, setQuestion] = useState("");
  const [hint, setHint] = useState("");
  const [answer, setAnswer] = useState("");
  const [funFact, setFunFact] = useState("");
  const [type, setType] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [image, setImage] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [deleteImage, setDeleteImage] = useState(false);

  // Modal and alert states
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info");
  const [showTypeChangeModal, setShowTypeChangeModal] = useState(false);
  const [typeChangeMessage, setTypeChangeMessage] = useState("");
  const [pendingType, setPendingType] = useState("");
  const [showExitModal, setShowExitModal] = useState(false);

  // Track original data for unsaved changes
  const originalData = useRef({});
  const [isDirty, setIsDirty] = useState(false);

  // Modal for MCQ options
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOptionsSaved, setShowOptionsSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setAlertTitle("Not Logged In");
      setAlertMessage("You must be logged in to access this page.");
      setAlertType("error");
      setShowAlert(true);
      return;
    }

    if (!collectionId) {
      setAlertTitle("Missing Data");
      setAlertMessage("Collection ID is missing.");
      setAlertType("error");
      setShowAlert(true);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/collections/`);
        const data = await res.json();
        const target = data.find((c) => c._id === collectionId);
        if (target) setCollectionName(target.name);
      } catch {
        setAlertTitle("Error");
        setAlertMessage("Failed to load collection.");
        setAlertType("error");
        setShowAlert(true);
      }
    })();

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/questions/${number}/${collectionId}`);
        if (!res.ok) throw new Error();
        const { data } = await res.json();
        setQuestion(data.question);
        setHint(data.hint);
        setExistingImage(data.image);
        setAnswer(Array.isArray(data.answer) ? data.answer.join(", ") : data.answer);
        setFunFact(data.funFact || "");
        setType(data.type || "open");
        setOptions(Array.isArray(data.options) ? data.options : ["", ""]);
        setCorrectIndex(
          Array.isArray(data.options) && Array.isArray(data.answer)
            ? data.options.findIndex((opt) => opt === data.answer[0])
            : null
        );
        // Save original data for dirty check
        originalData.current = {
          question: data.question,
          hint: data.hint,
          answer: Array.isArray(data.answer) ? data.answer.join(", ") : data.answer,
          funFact: data.funFact || "",
          type: data.type || "open",
          options: Array.isArray(data.options) ? data.options : ["", ""],
          correctIndex:
            Array.isArray(data.options) && Array.isArray(data.answer)
              ? data.options.findIndex((opt) => opt === data.answer[0])
              : null,
          image: data.image,
        };
      } catch {
        setAlertTitle("Error");
        setAlertMessage("Failed to load question.");
        setAlertType("error");
        setShowAlert(true);
      }
    })();
  }, [number, collectionId, navigate]);

  // Dirty check
  useEffect(() => {
    const orig = originalData.current;
    if (
      question !== orig.question ||
      hint !== orig.hint ||
      answer !== orig.answer ||
      funFact !== orig.funFact ||
      type !== orig.type ||
      JSON.stringify(options) !== JSON.stringify(orig.options) ||
      correctIndex !== orig.correctIndex ||
      image !== orig.image
    ) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [question, hint, answer, funFact, type, options, correctIndex, image]);

  // Option handlers
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    setIsDirty(true);
  };

  const addOption = () => {
    if (options.length < 4) setOptions([...options, ""]);
    setIsDirty(true);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctIndex === index) setCorrectIndex(null);
      else if (correctIndex > index) setCorrectIndex(correctIndex - 1);
      setIsDirty(true);
    }
  };

  // Type change logic
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    if (type === "open" && newType === "mcq" && answer.trim()) {
      setTypeChangeMessage("Switching to MCQ will remove all existing open-ended answers.");
      setPendingType(newType);
      setShowTypeChangeModal(true);
    } else if (type === "mcq" && newType === "open" && (options.some(opt => opt.trim()) || correctIndex !== null)) {
      setTypeChangeMessage("Switching to open-ended will remove all current MCQ options and correct answers.");
      setPendingType(newType);
      setShowTypeChangeModal(true);
    } else {
      setType(newType);
      if (newType === "open") {
        setOptions(["", ""]);
        setCorrectIndex(null);
      } else {
        setAnswer("");
      }
      setIsDirty(true);
    }
  };

  const confirmTypeChange = () => {
    setType(pendingType);
    if (pendingType === "open") {
      setOptions(["", ""]);
      setCorrectIndex(null);
      setAnswer("");
    } else {
      setAnswer("");
    }
    setShowTypeChangeModal(false);
    setIsDirty(true);
  };

  const cancelTypeChange = () => {
    setShowTypeChangeModal(false);
    setPendingType("");
  };

  // Exit confirmation
  const handleExit = () => {
    if (isDirty) {
      setShowExitModal(true);
    } else {
      navigate("/questions?collection=all");
    }
  };

  const confirmExit = () => {
    setShowExitModal(false);
    navigate("/questions?collection=all");
  };

  const cancelExit = () => {
    setShowExitModal(false);
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      setAlertTitle("Invalid Input");
      setAlertMessage("Please enter a question description.");
      setAlertType("error");
      setShowAlert(true);
      return;
    }

    if (question.length > 1500) {
      setAlertTitle("Too Long");
      setAlertMessage("Question description must not exceed 1500 characters.");
      setAlertType("error");
      setShowAlert(true);
      return;
    }

    if (!hint.trim() || !funFact.trim()) {
      setAlertTitle("Missing Fields");
      setAlertMessage("Hint and fun fact cannot be empty.");
      setAlertType("error");
      setShowAlert(true);
      return;
    }

    const formData = new FormData();
    formData.append("question", question.trim());
    formData.append("hint", hint.trim());
    formData.append("funFact", funFact.trim());
    formData.append("collectionId", collectionId);
    formData.append("number", number);
    formData.append("type", type);

    if (type === "mcq") {
      const trimmedOptions = options.map((opt) => opt.trim()).filter((opt) => opt);
      const uniqueOptions = [...new Set(trimmedOptions)];

      if (trimmedOptions.length < 2 || trimmedOptions.length > 4) {
        setAlertTitle("MCQ Error");
        setAlertMessage("Please enter between 2 and 4 non-empty MCQ options.");
        setAlertType("error");
        setShowAlert(true);
        return;
      }

      if (trimmedOptions.length !== uniqueOptions.length) {
        setAlertTitle("Duplicate Options");
        setAlertMessage("Each MCQ option must be unique.");
        setAlertType("error");
        setShowAlert(true);
        return;
      }

      if (correctIndex === null || !trimmedOptions[correctIndex]) {
        setAlertTitle("Correct Answer Required");
        setAlertMessage("Please select a valid correct answer.");
        setAlertType("error");
        setShowAlert(true);
        return;
      }

      // Append each option
      trimmedOptions.forEach((opt) => formData.append("options", opt));
      // Append correct answer
      formData.append("answer", trimmedOptions[correctIndex]);
    } else {
      const parsedAnswers = answer
        .split(",")
        .map((a) => a.trim().replace(/^['"]|['"]$/g, ""))
        .filter((a) => a);

      if (!parsedAnswers.length) {
        setAlertTitle("Invalid Input");
        setAlertMessage("Please enter at least one valid open-ended answer.");
        setAlertType("error");
        setShowAlert(true);
        return;
      }

      parsedAnswers.forEach((ans) => formData.append("answer", ans));
    }

    if (image) formData.append("image", image);
    if (deleteImage) formData.append("deleteImage", "true");

    try {
      const res = await fetch(
        `${API_BASE_URL}/questions/${number}/${collectionId}`,
        { method: "PATCH", body: formData }
      );
      if (res.ok) {
        setAlertTitle("Success");
        setAlertMessage("Question updated successfully!");
        setAlertType("success");
        setShowAlert(true);
        setIsDirty(false);
      } else {
        const data = await res.json();
        setAlertTitle("Error");
        setAlertMessage(data.message || "Update failed.");
        setAlertType("error");
        setShowAlert(true);
      }
    } catch {
      setAlertTitle("Server Error");
      setAlertMessage("Something went wrong.");
      setAlertType("error");
      setShowAlert(true);
    }
  };


  // MCQ Options Modal logic
  const openModal = () => setIsModalOpen(true);
  const handleSaveOptions = () => {
    setIsModalOpen(false);
    setShowOptionsSaved(true);
  };
  const handleOptionsSavedClose = () => setShowOptionsSaved(false);

  // AlertModal close handler
  const handleAlertClose = () => {
    setShowAlert(false);
    if (alertTitle === "Not Logged In" || alertTitle === "Missing Data" || alertTitle === "Error") {
      navigate("/questions?collection=all");
    }
  };

  return (
    <div className="login-container">
      <img src="/images/changihome.jpg" alt="Background" className="background-image" />
      <div className="page-overlay"></div>
      <div className="page-content scrollable-container">
        <h2>Edit {collectionName} Q#{number}</h2>
        <form onSubmit={handleSubmit} className="centered-form">
          <select value={type} onChange={handleTypeChange} required className="dropdown-select">
            <option value="open">Open-Ended Question</option>
            <option value="mcq">Multiple Choice Question</option>
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

          <button type="submit" className="login-btn">
            Save
          </button>
          <button
            type="button"
            onClick={() => { handleExit() }}
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
              <button type="button" onClick={handleSaveOptions} className="login-btn">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Options Saved Alert */}
      <AlertModal
        isOpen={showOptionsSaved}
        onClose={handleOptionsSavedClose}
        title="Options Saved"
        message="MCQ options have been saved!"
        confirmText="OK"
        type="success"
        showCancel={false}
      />

      {/* Type change confirmation modal */}
      <AlertModal
        isOpen={showTypeChangeModal}
        onClose={cancelTypeChange}
        onConfirm={confirmTypeChange}
        title="Warning"
        message={typeChangeMessage}
        confirmText="Confirm"
        cancelText="Cancel"
        type="warning"
        showCancel={true}
      />

      {/* Exit confirmation modal */}
      <AlertModal
        isOpen={showExitModal}
        onClose={cancelExit}
        onConfirm={confirmExit}
        title="Unsaved Changes"
        message="Are you sure you want to exit? Unsaved changes will be lost."
        confirmText="Exit"
        cancelText="Stay"
        type="warning"
        showCancel={true}
      />

      {/* General alert modal */}
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

export default EditQuestion;