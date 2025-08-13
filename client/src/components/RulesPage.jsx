import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Countdown from "./Countdown";
import AlertModal from "./AlertModal";
import Loading from "./Loading"; 
import "./MainStyles.css";

export default function RulesPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState(""); // <-- NEW
  const [showCountdown, setShowCountdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 

  // Modal state for errors
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // Fetch username and collection details from sessionStorage and backend
  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    const collectionId = sessionStorage.getItem("collectionId");

    // If username not found, redirect to name entry page
    if (!storedUsername) {
      navigate("/getname");
      return;
    } else {
      setUsername(storedUsername);
    }

    // Fetch collection name and welcome message using the stored collectionId
    if (collectionId) {
      fetch("http://localhost:5000/collections")
        .then((res) => res.json())
        .then((data) => {
          const match = data.find((col) => col._id === collectionId);
          if (match) {
            setCollectionName(match.name);
            setWelcomeMessage(match.welcomeMessage || ""); // <-- NEW
          }
          setIsLoading(false); // Done loading once collection info is retrieved
        })
        .catch((err) => {
          console.error("Error fetching collection name:", err);
          setIsLoading(false); // Still end loading even if fetch fails
          setModalTitle("Error Fetching Collection");
          setModalMessage("Could not fetch collection name. Please try again.");
          setShowErrorModal(true);
        });
    } else {
      setIsLoading(false); // If no collectionId exists, skip loading
    }
  }, [navigate]);

  // Starts the game: creates a player in DB and navigates to the game page
  const beginGame = async () => {
    sessionStorage.removeItem("playerId");
    sessionStorage.removeItem("playerIndex");
    sessionStorage.removeItem("quizStartTime");
    sessionStorage.removeItem("elapsed");
    sessionStorage.removeItem("hintsUsed");
    sessionStorage.removeItem("wrongAnswers");
    sessionStorage.removeItem("questionsSkipped");
    sessionStorage.removeItem("timePenalty");
    sessionStorage.removeItem("currentQuestionIndex");
    sessionStorage.removeItem("userAnswer");
    sessionStorage.removeItem("correctAnswers");
    sessionStorage.removeItem("totalQuestions");
    const collectionId = sessionStorage.getItem("collectionId");
    if (!collectionId) {
      setModalTitle("Missing Collection");
      setModalMessage("Please enter your code again.");
      setShowErrorModal(true);
      return;
    }

    try {
      const startedAt = new Date().toISOString();

      // Create player in backend
      const createRes = await fetch("http://localhost:5000/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, collectionId }),
      });

      if (!createRes.ok) {
        const msg = await createRes.text();
        throw new Error(msg || "Player creation failed.");
      }

      const player = await createRes.json();

      // Save player ID and index for later use
      sessionStorage.setItem("playerId", player._id);
      sessionStorage.setItem("playerIndex", player.playerIndex);

      // Mark the start time of the game in the DB
      await fetch(`http://localhost:5000/players/${player._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startedAt, totalTimeInSeconds: 0, collectionId }),
      });

      // Navigate to the game screen
      navigate("/game");
    } catch (err) {
      console.error(err);
      setModalTitle("Error Starting Game");
      setModalMessage("There was an error starting the game. Please try again.");
      setShowErrorModal(true);
    }
  };

  // Trigger the countdown before actually beginning the game
  const handleStart = () => {
    setShowCountdown(true);
  };

  return (
    <div className="page-container rules-page">
      <img src="/images/changihome.jpg" alt="Background" className="home-background" />
      <div className="home-overlay" />

      <div className="page-content" style={{ textAlign: "center" }}>
        {/* Show loading spinner while fetching collection name */}
        {isLoading ? (
          <Loading />
        ) : showCountdown ? (
          // Show countdown once "Yes" button is clicked
          <Countdown onComplete={beginGame} />
        ) : (
          <>
            <h2
              style={{
                fontSize: "1.8rem",
                fontWeight: "bold",
                marginBottom: "1.2rem",
                lineHeight: "1.4",
              }}
            >
              Welcome {username} to{" "}
              <span style={{ color: "#00c4cc" }}>{collectionName}</span>!
              <br />
              Are you ready to begin?
            </h2>
            <div
              style={{
                margin: "1rem 0",
                fontStyle: "italic",
                color: "#333",
                fontSize: "1.1rem",
              }}
            >
              {welcomeMessage}
            </div>
            <button onClick={handleStart} className="rules-start-button">
              Yes
            </button>
          </>
        )}
      </div>

      {/* Show any error modals when needed */}
      <AlertModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        type="error"
        showCancel={false}
      />
    </div>
  );
}