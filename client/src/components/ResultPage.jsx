import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/global/MainStyles.css';
import AlertModal from './AlertModal';
import Loading from './Loading';

export default function ResultPage() {
  // Core states
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Modal visibility states
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const navigate = useNavigate();
  
  // On component mount, fetch player data
  useEffect(() => {
    const playerId = sessionStorage.getItem("playerId");
    if (!playerId) {
      setError("Session expired. Please start again.");
      setLoading(false);
      return;
    }

    // Get stats stored during game
    const storedCorrect = sessionStorage.getItem("correctAnswers");
    const storedTotal = sessionStorage.getItem("totalQuestions");

    if (storedCorrect) setCorrectAnswers(parseInt(storedCorrect));
    if (storedTotal) setTotalQuestions(parseInt(storedTotal));

    // Fetch player info from backend
    const fetchPlayer = async () => {
      try {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/players/${playerId}`);
        if (!res.ok) throw new Error("Player not found");
        const data = await res.json();
        setPlayer(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch player data:", err.message);
        sessionStorage.clear();
        setError("Player not found or session expired.");
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [navigate]);

  // Format time in h m s
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  // Format finishedAt date and time for display
  const getFinishedDateTime = () => {
    if (!player || !player.finishedAt) return { formattedDate: '', formattedTime: '' };
    const date = new Date(player.finishedAt);
    const formattedDate = date.toLocaleDateString("en-SG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-SG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return { formattedDate, formattedTime };
  };

  // Show modal when user clicks to redeem
  const handleRedeemClick = () => {
    setShowRedeemModal(true);
  };

  // PATCH request to backend to mark player as redeemed
  const handleConfirmRedeem = async () => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/players/${player._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...player, redeemed: true }),
      });

      if (res.ok) {
        setPlayer({ ...player, redeemed: true, redeemedAt: new Date() });
        setShowSuccessModal(true);
      } else {
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Redeem error:", error);
      setShowErrorModal(true);
    }
  };

  // Show loader while fetching player info
  if (loading) {
    return (
      <div className="page-container">
        <img src="/images/waterfall.jpg" alt="Background" className="page-background" />
        <div className="page-overlay" />
        <div className="page-content" style={{ textAlign: "center" }}>
          <Loading />
        </div>
      </div>
    );
  }

  // Error fallback
  if (error) {
    return (
      <div style={{ textAlign: "center", marginTop: "4rem" }}>
        <h2>{error}</h2>
        <button
          onClick={() => navigate("/")}
          style={{
            marginTop: "2rem",
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Go Home
        </button>
      </div>
    );
  }

  const { formattedDate, formattedTime } = getFinishedDateTime();
  const totalTime = player.totalTimeInSeconds || 0;

  return (
    <div className="page-container">
      <img src="/images/waterfall.jpg" alt="Background" className="page-background" />
      <div className="page-overlay" />

      <div className="page-content" style={{ textAlign: "center" }}>
        <h2>Congratulations {player.username}!</h2>

        <p style={{ fontWeight: "bold", fontSize: "18px", color: "#333" }}>
          You have completed the quest with these stats:
        </p>

        <div style={{
          margin: "1.5rem 0",
          lineHeight: "1.8",
          padding: "20px",
          borderRadius: "10px"
        }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px", color: "#2e7d32" }}>
            Correct Answers: {correctAnswers}/{totalQuestions}
          </div>
          <div><strong>Total Time (with penalties):</strong> {formatTime(totalTime)}</div>
          <div><strong>Hints Used:</strong> {player.hintsUsed || 0}</div>
          <div><strong>Questions Skipped:</strong> {player.questionsSkipped || 0}</div>
          <div><strong>Wrong Attempts:</strong> {player.wrongAnswers || 0}</div>
        </div>

        <div className="button-group">
          <button className="leaderboard-button" onClick={() => navigate("/leaderboard")}>
            Leaderboard
          </button>
        </div>

        <p style={{ fontWeight: "bold", marginTop: "2rem" }}>
          Redeem your gift now!
        </p>

        {/* Show redeem button if not redeemed */}
        {!player.redeemed ? (
          <button
            onClick={handleRedeemClick}
            className="login-btn"
            style={{ marginTop: "1rem" }}
          >
            Click here to redeem
          </button>
        ) : (
          <p style={{ color: "green", fontWeight: "bold", marginTop: "1rem" }}>
            Redeemed at {new Date(player.redeemedAt).toLocaleString("en-SG")}
          </p>
        )}

        <p style={{
          marginTop: "2rem",
          fontWeight: "bold",
          color: "#333",
          fontSize: "16px"
        }}>
          Completed: {formattedDate}, {formattedTime}
        </p>
      </div>

      {/* Redeem Confirmation Modal */}
      <AlertModal
        isOpen={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
        onConfirm={handleConfirmRedeem}
        title="Redeem Gift"
        message="Once you click confirm, please claim your reward at the booth immediately."
        confirmText="Redeem Now"
        cancelText="Cancel"
        type="warning"
      />

      {/* Success Modal */}
      <AlertModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
        message="Your gift has been marked as redeemed. Please head to the booth now."
        confirmText="Got it"
        type="success"
        showCancel={false}
      />

      {/* Error Modal */}
      <AlertModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message="There was an error redeeming your gift. Please try again or contact staff."
        confirmText="Try Again"
        cancelText="Cancel"
        type="error"
        onConfirm={handleRedeemClick}
      />
    </div>
  );
}
