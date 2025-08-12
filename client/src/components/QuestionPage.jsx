import React, { useState, useEffect, useRef } from "react";
import AlertModal from './AlertModal';
import Loading from './Loading';
import "./MainStyles.css";
import "./QuestionPage.css";

const QuestionPage = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  // --- State and refs ---
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(
    parseInt(sessionStorage.getItem("currentQuestionIndex") || "0", 10)
  );
  const [correctAnswers, setCorrectAnswers] = useState(
    parseInt(sessionStorage.getItem("correctAnswers") || "0", 10)
  );
  const [userAnswer, setUserAnswer] = useState("");
  const [hintsUsed, setHintsUsed] = useState(
    parseInt(sessionStorage.getItem("hintsUsed") || "0", 10)
  );
  const [elapsed, setElapsed] = useState(
    parseInt(sessionStorage.getItem("elapsed") || "0", 10)
  );
  const [gameSettings, setGameSettings] = useState(null);
  const [timerPaused, setTimerPaused] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showHintModal, setShowHintModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [infoTitle, setInfoTitle] = useState("");
  const [infoType, setInfoType] = useState("info");

  // --- Refs for values not triggering re-render ---
  const savedStartTime = sessionStorage.getItem("quizStartTime");
  if (!savedStartTime) {
    sessionStorage.setItem("quizStartTime", Date.now().toString());
  }
  const startTime = useRef(parseInt(sessionStorage.getItem("quizStartTime"), 10));
  const wrongAnswers = useRef(
    parseInt(sessionStorage.getItem("wrongAnswers") || "0", 10)
  );
  const questionsSkipped = useRef(
    parseInt(sessionStorage.getItem("questionsSkipped") || "0", 10)
  );
  const timePenalty = useRef(
    parseInt(sessionStorage.getItem("timePenalty") || "0", 10)
  );

  // --- Persist state/refs to sessionStorage ---
  useEffect(() => {
    sessionStorage.setItem("currentQuestionIndex", currentIndex.toString());
  }, [currentIndex]);

  useEffect(() => {
    sessionStorage.setItem("correctAnswers", correctAnswers.toString());
  }, [correctAnswers]);

  useEffect(() => {
    sessionStorage.setItem("hintsUsed", hintsUsed.toString());
  }, [hintsUsed]);

  useEffect(() => {
    sessionStorage.setItem("elapsed", elapsed.toString());
  }, [elapsed]);

  // Persist refs when they change (manually after mutation)
  const persistRefs = () => {
    sessionStorage.setItem("wrongAnswers", wrongAnswers.current.toString());
    sessionStorage.setItem("questionsSkipped", questionsSkipped.current.toString());
    sessionStorage.setItem("timePenalty", timePenalty.current.toString());
  };

  // Timer control functions (manual pause/resume, not for tab inactivity)
  const pauseTimer = () => {
    setTimerPaused(true);
  };

  const resumeTimer = () => {
    setTimerPaused(false);
  };

  // Helper functions for modals
  const showInfo = (title, message, type = "info") => {
    setInfoTitle(title);
    setInfoMessage(message);
    setInfoType(type);
    setShowInfoModal(true);
  };

  const showAnswerInfo = (title, message, type = "success") => {
    setInfoTitle(title);
    setInfoMessage(message);
    setInfoType(type);
    setShowAnswerModal(true);
    pauseTimer();
  };

  // --- Back Button Protection ---
  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault();
      setShowLeaveModal(true);
      window.history.pushState(null, "", window.location.href);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // --- Fetch Questions and Settings ---
  async function fetchQuestionsAndSettings() {
    const collectionId = sessionStorage.getItem("collectionId");
    if (!collectionId) {
      setError("No collection selected. Please enter a code or play as a guest.");
      setLoading(false);
      return;
    }

    try {
      // Fetch effective settings for this collection
      const settingsResponse = await fetch(`${baseUrl}/collections/${collectionId}/effective-settings`);
      if (!settingsResponse.ok) {
        const data = await settingsResponse.json();
        setError(data.message || "Failed to load game settings.");
        setLoading(false);
        return;
      }
      const settingsData = await settingsResponse.json();
      setGameSettings(settingsData);

      // Fetch collection details to get the code
      const collectionRes = await fetch(`${baseUrl}/collections/${collectionId}`);
      const collection = await collectionRes.json();

      if (!collection) {
        setError("Collection not found or is offline.");
        setLoading(false);
        return;
      }

      let fetchedQuestions = [];
      if (collection.questionOrder && collection.questionOrder.length > 0) {
        const response = await fetch(`${baseUrl}/collections/${collection._id}/questions`);
        if (!response.ok) {
          const data = await response.json();
          setError(data.message || "Failed to load questions.");
          setLoading(false);
          return;
        }
        const data = await response.json();
        fetchedQuestions = Array.isArray(data) ? data : data.questions || [];
      } else {
        const res = await fetch(`${baseUrl}/questions?collectionId=${collectionId}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.message || "Failed to load questions.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        fetchedQuestions = data;
      }

      // Apply game mode randomization per-game
      const playerIndex = parseInt(sessionStorage.getItem("playerIndex") || "0", 10);

      if (settingsData && settingsData.gameMode === 'rotating') {
        const n = fetchedQuestions.length;
        const rotated = fetchedQuestions.map((_, i) => fetchedQuestions[(i + playerIndex) % n]);
        setQuestions(rotated);
      } else if (settingsData && settingsData.gameMode === 'rotating-reverse') {
        const n = fetchedQuestions.length;
        const rotated = fetchedQuestions.map((_, i) => fetchedQuestions[(i - playerIndex - 1 + n) % n]);
        setQuestions(rotated);
      } else if (settingsData && settingsData.gameMode === 'random') {
        const shuffled = [...fetchedQuestions];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setQuestions(shuffled);
      } else {
        setQuestions(fetchedQuestions);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch questions and settings:", error);
      setError("Something went wrong. Please try again later.");
      setLoading(false);
    }
  }

  // Timer effect: always uses real time since start, plus penalties
  useEffect(() => {
    const interval = setInterval(() => {
      if (!timerPaused) {
        const now = Date.now();
        const newElapsed = Math.max(0, Math.floor((now - startTime.current) / 1000) + timePenalty.current);
        setElapsed(newElapsed);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerPaused]);

  // --- Persist refs after mutation ---
  // Call persistRefs() after any mutation to wrongAnswers, questionsSkipped, or timePenalty

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, seconds);
    const hours = String(Math.floor(safeSeconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, "0");
    const secs = String(safeSeconds % 60).padStart(2, "0");
    return `${hours}:${mins}:${secs}`;
  };

  const formatPenaltyTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return secs > 0 ? `${mins} minute${mins > 1 ? 's' : ''} and ${secs} second${secs > 1 ? 's' : ''}` : `${mins} minute${mins > 1 ? 's' : ''}`;
    }
    return `${secs} second${secs > 1 ? 's' : ''}`;
  };

  const animateAirplaneMovement = () => {
    const airplane = document.querySelector('.game-airplane-current');
    if (airplane) {
      airplane.classList.add('game-airplane-moving');
      setTimeout(() => {
        airplane.classList.remove('game-airplane-moving');
      }, 1200);
    }
  };

  const handleHintClick = () => {
    const hint = questions[currentIndex]?.hint;
    if (!hint || !gameSettings) return;
    setShowHintModal(true);
  };

  const confirmHint = () => {
    const hint = questions[currentIndex]?.hint;
    setHintsUsed((prev) => {
      const newVal = prev + 1;
      sessionStorage.setItem("hintsUsed", newVal.toString());
      return newVal;
    });
    timePenalty.current += gameSettings.hintPenalty;
    persistRefs();
    showInfo("💡 Hint", hint, "info");
  };

  const handleSubmit = () => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion || !gameSettings) return;

    if (!userAnswer.trim()) {
      showInfo("Missing Answer", "Please enter your answer.", "warning");
      return;
    }

    setShowSubmitModal(true);
  };

  const confirmSubmit = () => {
    const currentQuestion = questions[currentIndex];
    const input = userAnswer.toLowerCase().trim();
    const acceptableAnswers = Array.isArray(currentQuestion.answer)
      ? currentQuestion.answer
      : [currentQuestion.answer];

    const isCorrect = acceptableAnswers
  .map(ans => ans.toLowerCase().trim())
  .includes(input);


    if (isCorrect) {
      setCorrectAnswers((prev) => {
        const newVal = prev + 1;
        sessionStorage.setItem("correctAnswers", newVal.toString());
        return newVal;
      });
      setUserAnswer("");
      const funFact = questions[currentIndex].funFact || "No fun fact available.";
      showAnswerInfo("Correct!", funFact, "success");
    } else {
      wrongAnswers.current += 1;
      timePenalty.current += gameSettings.wrongAnswerPenalty;
      persistRefs();
      setUserAnswer("");
      showAnswerInfo("Incorrect", "Try again! You can still answer this question.", "error");
    }
  };

  const handleSkip = () => {
    if (!gameSettings) return;
    setShowSkipModal(true);
  };

  const confirmSkip = () => {
    timePenalty.current += gameSettings.skipPenalty;
    questionsSkipped.current += 1;
    persistRefs();
    setUserAnswer("");
    const currentQuestion = questions[currentIndex];
    const correctAnswer = Array.isArray(currentQuestion.answer)
      ? currentQuestion.answer[0]
      : currentQuestion.answer;
    const funFact = currentQuestion.funFact || "No fun fact available.";
    const message = `The correct answer was: ${correctAnswer}\n\n🎉 Fun Fact: ${funFact}`;
    showAnswerInfo("⏭️ Question Skipped", message, "warning");
  };

  const handleAnswerModalClose = () => {
    setShowAnswerModal(false);
    resumeTimer();
    const isCorrectAnswer = infoType === "success";
    const isSkipped = infoType === "warning";
    const isLast = currentIndex === questions.length - 1;

    if (isCorrectAnswer || isSkipped) {
      if (isLast) {
        handleFinish(isCorrectAnswer);
      } else {
        animateAirplaneMovement();
        setTimeout(() => {
          setCurrentIndex((prev) => {
            const nextIndex = prev + 1;
            sessionStorage.setItem("currentQuestionIndex", nextIndex.toString());
            return nextIndex;
          });
        }, 600);
      }
    }
  };

  const handleFinish = async (answeredLast) => {
    const finalCorrect = correctAnswers + (answeredLast ? 1 : 0);
    const rawTime = Math.floor((Date.now() - startTime.current) / 1000);
    const finalTime = Math.max(0, rawTime + timePenalty.current);

    showInfo("🎊 Quiz Complete!", "Great job! Redirecting to results...", "success");

    const playerId = sessionStorage.getItem("playerId");
    const collectionId = sessionStorage.getItem("collectionId");

    if (playerId) {
      try {
        await fetch(`${baseUrl}/players/${playerId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: finalCorrect,
            totalTimeInSeconds: finalTime,
            hintsUsed,
            finishedAt: new Date(),
            collectionId,
            wrongAnswers: wrongAnswers.current,
            questionsSkipped: questionsSkipped.current
          }),
        });
      } catch (error) {
        console.error("Failed to submit results:", error);
      }
    }

    sessionStorage.setItem("correctAnswers", finalCorrect.toString());
    sessionStorage.setItem("totalQuestions", questions.length.toString());

    // Clear progress-related sessionStorage keys
    sessionStorage.removeItem("currentQuestionIndex");
    sessionStorage.removeItem("elapsed");
    sessionStorage.removeItem("hintsUsed");
    sessionStorage.removeItem("wrongAnswers");
    sessionStorage.removeItem("questionsSkipped");
    sessionStorage.removeItem("timePenalty");
    sessionStorage.removeItem("quizStartTime"); 

    setTimeout(() => {
      window.location.href = "/results";
    }, 2000);
  };

  // --- Fetch questions on mount ---
  useEffect(() => {
    fetchQuestionsAndSettings();
    // eslint-disable-next-line
  }, []);

  // Handle error state
  if (error) {
    return (
      <div className="game-page-wrapper">
        <AlertModal
          isOpen={true}
          onClose={() => window.location.href = "/getcode"}
          title="Error"
          message={error}
          confirmText="Back to Code Entry"
          type="error"
          showCancel={false}
        />
      </div>
    );
  }

  if (showLeaveModal) {
    return (
      <AlertModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={async () => {
          const playerId = sessionStorage.getItem("playerId");
          if (playerId) {
              await fetch(`${baseUrl}/players/${playerId}`, {
                method: "DELETE",
              });
          }
          sessionStorage.removeItem("gameState");
          sessionStorage.removeItem("playerId");
          sessionStorage.removeItem("playerIndex");
          sessionStorage.removeItem("collectionId");
          sessionStorage.removeItem("correctAnswers");
          sessionStorage.removeItem("totalQuestions");
          sessionStorage.removeItem("currentQuestionIndex");
          sessionStorage.removeItem("elapsed");
          sessionStorage.removeItem("hintsUsed");
          sessionStorage.removeItem("wrongAnswers");
          sessionStorage.removeItem("questionsSkipped");
          sessionStorage.removeItem("timePenalty");
          sessionStorage.removeItem("quizStartTime");
          window.location.href = "/";
        }}
        title="Leave Game?"
        message="Leaving this page will end your quiz progress. Are you sure?"
        confirmText="Leave"
        cancelText="Stay"
        type="warning"
        showCancel={true}
      />
    );
  }

  if (loading || questions.length === 0 || !gameSettings) {
    return (
      <div className="game-page-wrapper">
        <Loading />
      </div>
    );
  }

  if (!questions[currentIndex]) {
    return (
      <div className="game-page-wrapper">
        <Loading />
      </div>
    );
  }

  const penaltyText = gameSettings ? {
    hint: formatPenaltyTime(gameSettings.hintPenalty),
    skip: formatPenaltyTime(gameSettings.skipPenalty),
    wrong: formatPenaltyTime(gameSettings.wrongAnswerPenalty)
  } : { hint: "", skip: "", wrong: "" };

  const formatPenaltyShort = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0 && secs > 0) return `${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m`;
    return `${secs}s`;
  };

  return (
    <div className="game-page-wrapper">
      {/* Header with logo and time */}
      <div className="game-header">
        <div className="game-logo-container">
          <img src="/images/ces.jpg" alt="Changi Experience Studio" className="game-ces-logo" />
        </div>
        <div className="game-time-display">
          Time: {formatTime(elapsed)} {timerPaused && <span style={{ color: "#ff9800" }}>(⏸️ Paused)</span>}
        </div>
      </div>

      {/* Progress section */}
      <div className="game-progress-section">
        <div className="game-progress-text">
          Progress: {currentIndex + 1}/{questions.length}
        </div>
        <div className="game-progress-bar-container">
          <div className="game-progress-line"></div>
          <div className="game-progress-track">
            {questions.map((_, index) => (
              <div key={index} className="game-progress-item">
                {index === currentIndex ? (
                  <span className="game-airplane-current">✈️</span>
                ) : (
                  <div
                    className={`game-progress-dot ${index < currentIndex ? 'game-progress-completed' : 'game-progress-pending'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Question section */}
      <div className="game-question-section">
        <div className="game-question-header">
          <span className="game-airplane-small">✈️</span>
          Stop {currentIndex + 1}: {questions[currentIndex].title || `Question ${currentIndex + 1}`}
        </div>
        <div className="game-question-text">
          {questions[currentIndex].question}
        </div>

        {questions[currentIndex].image && (
          <img
            src={`${baseUrl}/${questions[currentIndex].image}`}
            alt={`Question ${currentIndex + 1}`}
            style={{
              maxWidth: "90%",
              maxHeight: "300px",
              marginTop: "15px",
              borderRadius: "12px",
              display: "block",
              margin: "15px auto 0 auto"
            }}
          />
        )}
      </div>

      {/* Answer input */}
      <div className="game-answer-section">
        {questions[currentIndex].type === "mcq" ? (
          <div className="game-mcq-options">
            {questions[currentIndex].options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => setUserAnswer(option)}
                className={`game-mcq-option-button ${userAnswer === option ? "selected" : ""
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <input
            type="text"
            placeholder="Type your answer here"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="game-answer-input"
            autoFocus
          />
        )}
      </div>

      {/* Top Action buttons - Hint and Skip */}
      <div className="game-top-actions-section">
        <button
          onClick={handleHintClick}
          className="game-hint-button"
        >
          Hint (+{formatPenaltyShort(gameSettings.hintPenalty)})
        </button>
        <button
          onClick={handleSkip}
          className="game-skip-button"
        >
          Skip (+{formatPenaltyShort(gameSettings.skipPenalty)})
        </button>
      </div>

      {/* Submit button */}
      <div className="game-submit-section">
        <button
          onClick={handleSubmit}
          className="game-submit-button"
        >
          Submit Answer
        </button>
      </div>

      {/* Modals */}
      <AlertModal
        isOpen={showHintModal}
        onClose={() => setShowHintModal(false)}
        onConfirm={confirmHint}
        title="Use Hint?"
        message={`Using a hint will add a ${penaltyText.hint} penalty to your time.`}
        confirmText="Use Hint"
        cancelText="Cancel"
        type="warning"
        icon="💡"
      />

      <AlertModal
        isOpen={showSkipModal}
        onClose={() => setShowSkipModal(false)}
        onConfirm={confirmSkip}
        title="Skip Question?"
        message={`Skipping this question will add a ${penaltyText.skip} penalty to your time.`}
        confirmText="Skip"
        cancelText="Cancel"
        type="warning"
        icon="⏭️"
      />

      <AlertModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={confirmSubmit}
        title="Submit Answer?"
        message={`Are you sure? Wrong answers add a ${penaltyText.wrong} penalty.`}
        confirmText="Submit"
        cancelText="Cancel"
        type="info"
        icon="📝"
      />

      <AlertModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title={infoTitle}
        message={infoMessage}
        confirmText="OK"
        type={infoType}
        showCancel={false}
      />

      <AlertModal
        isOpen={showAnswerModal}
        onClose={handleAnswerModalClose}
        title={infoTitle}
        message={infoMessage}
        confirmText="Continue"
        type={infoType}
        showCancel={false}
      />
    </div>
  );
};

export default QuestionPage;