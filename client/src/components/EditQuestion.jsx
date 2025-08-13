import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AlertModal from "./AlertModal";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
import "../styles/global/MainStyles.css";

const EditQuestion = () => {
  const { number } = useParams(); // unique question number
  const navigate = useNavigate();

  const [collections, setCollections] = useState([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState([]);

  const [question, setQuestion] = useState("");
  const [hint, setHint] = useState("");
  const [answer, setAnswer] = useState(""); // open-ended input (comma-separated)
  const [funFact, setFunFact] = useState("");
  const [type, setType] = useState("open");
  const [options, setOptions] = useState(["", ""]);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [image, setImage] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [deleteImage, setDeleteImage] = useState(false);

  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info");

  const originalData = useRef({});

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setAlertTitle("Not Logged In");
      setAlertMessage("You must be logged in to access this page.");
      setAlertType("error");
      setShowAlert(true);
      return;
    }

    // Load all collections
    fetch(`${API_BASE_URL}/collections/`)
      .then((res) => res.json())
      .then((data) => setCollections(data))
      .catch(() => {
        setAlertTitle("Error");
        setAlertMessage("Failed to load collections.");
        setAlertType("error");
        setShowAlert(true);
      });

    // Load question by number
    fetch(`${API_BASE_URL}/questions/${Number(number)}`)
      .then((res) => res.json())
      .then((result) => {
        const data = result?.data || result;
        if (!data || !data.question) throw new Error("No question found");

        setQuestion(data.question);
        setHint(data.hint || "");
        setExistingImage(data.image || null);
        setFunFact(data.funFact || "");
        setType(data.type || "open");

        const safeOptions = Array.isArray(data.options) ? data.options : ["", ""];
        setOptions(safeOptions);

        if (data.type === "mcq") {
          const idx =
            Array.isArray(safeOptions) && Array.isArray(data.answer)
              ? safeOptions.findIndex((opt) => opt === data.answer[0])
              : -1;
          setCorrectIndex(idx >= 0 ? idx : null);
          setAnswer("");
        } else {
          setCorrectIndex(null);
          const openAns = Array.isArray(data.answer)
            ? data.answer.join(", ")
            : String(data.answer || "");
          setAnswer(openAns);
        }

        setSelectedCollectionIds((data.collectionIds || []).map((id) => id.toString()));
        originalData.current = data;
      })
      .catch(() => {
        setAlertTitle("Error");
        setAlertMessage("Failed to load question.");
        setAlertType("error");
        setShowAlert(true);
      });
  }, [number, navigate]);

  const toggleCollection = (id) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 4) setOptions((o) => [...o, ""]);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctIndex === index) setCorrectIndex(null);
      else if (correctIndex > index) setCorrectIndex((ci) => ci - 1);
    }
  };

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

    const trimmedAnswers =
      type === "open"
        ? answer
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a)
        : correctIndex !== null
        ? [options[correctIndex]]
        : [];

    if (type === "mcq") {
      const trimmedOptions = options.map((opt) => opt.trim()).filter(Boolean);
      if (trimmedOptions.length < 2) {
        setAlertTitle("Invalid Input");
        setAlertMessage("MCQ requires at least 2 options.");
        setAlertType("error");
        setShowAlert(true);
        return;
      }
      if (correctIndex === null) {
        setAlertTitle("Invalid Input");
        setAlertMessage("Please select the correct MCQ answer.");
        setAlertType("error");
        setShowAlert(true);
        return;
      }
    } else {
      if (trimmedAnswers.length === 0) {
        setAlertTitle("Invalid Input");
        setAlertMessage("Please enter at least one acceptable answer.");
        setAlertType("error");
        setShowAlert(true);
        return;
      }
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
    formData.append("type", type);
    formData.append(
      "collectionIds",
      JSON.stringify(selectedCollectionIds.map((id) => id.trim()))
    );

    if (type === "mcq") {
      const trimmedOptions = options.map((opt) => opt.trim()).filter(Boolean);
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
      // send arrays as JSON strings (matches your backend)
      formData.append("options", JSON.stringify(trimmedOptions));
      formData.append("answer", JSON.stringify([trimmedOptions[correctIndex]]));
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
      formData.append("answer", JSON.stringify(parsedAnswers));
    }

    if (image) formData.append("image", image);
    if (deleteImage) formData.append("deleteImage", "true");

    try {
      const res = await fetch(`${API_BASE_URL}/questions/${number}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed.");

      setAlertTitle("Success");
      setAlertMessage("Question updated successfully!");
      setAlertType("success");
      setShowAlert(true);
    } catch (err) {
      setAlertTitle("Error");
      setAlertMessage(err?.message || "Failed to update question.");
      setAlertType("error");
      setShowAlert(true);
    }
  };

  const handleAlertClose = () => {
    setShowAlert(false);
    if (alertType === "success") navigate("/questions?collection=all");
  };

  return (
    <div className="login-container">
      <img src="/images/changihome.jpg" alt="Background" className="background-image" />
      <div className="page-overlay"></div>
      <div className="page-content scrollable-container">
        <h2>Edit Question #{number}</h2>

        <form onSubmit={handleSubmit} className="centered-form">
          {/* Collections */}
          <label>Collections:</label>
          <div className="checkbox-container">
            {collections.map((col) => (
              <label key={col._id} className="checkbox-label">
                {col.name}
                <input
                  type="checkbox"
                  checked={selectedCollectionIds.includes(col._id)}
                  onChange={() => toggleCollection(col._id)}
                />
              </label>
            ))}
          </div>

          {/* Type */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            className="dropdown-select"
          >
            <option value="open">Open-Ended Question</option>
            <option value="mcq">Multiple Choice Question</option>
          </select>

          {/* Question / Hint */}
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

          {/* Image */}
          {existingImage ? (
            <div style={{ marginBottom: 8 }}>
              <small>Current image: {existingImage}</small>
            </div>
          ) : null}

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="login-btn"
          />

          <label className="checkbox-label" style={{ maxWidth: 260 }}>
            Delete existing image
            <input
              type="checkbox"
              checked={deleteImage}
              onChange={(e) => setDeleteImage(e.target.checked)}
            />
          </label>

          {/* MCQ section */}
          {type === "mcq" && (
            <>
              {options.map((opt, index) => (
                <div key={index}>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    className="login-btn"
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(index)}>
                      ✖
                    </button>
                  )}
                </div>
              ))}
              {options.length < 4 && (
                <button type="button" onClick={addOption}>
                  + Add Option
                </button>
              )}

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

          {/* Open-ended section */}
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

          <button type="submit" className="login-btn">Save</button>
          <button
            type="button"
            onClick={() => navigate("/questions?collection=all")}
            className="login-btn"
          >
            Cancel
          </button>
        </form>
      </div>

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
