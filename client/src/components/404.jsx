import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/global/MainStyles.css";

function ErrorPage() {
  const location = useLocation();
  const navigate = useNavigate();

  function handleRedirect() {
    navigate("/");
  }

  return (
    <div className="page-container">
      <img src="/images/waterfall.jpg" alt="Background" className="page-background" />
      <div className="page-overlay"></div>
      <div className="page-content" style={{ textAlign: "center", marginTop: "10vh" }}>
        <h2 style={{ color: "#000", fontWeight: "bold" }}>404 - Page Not Found</h2>
        <p style={{ fontSize: "18px", margin: "24px 0", color: "#000" }}>
          Sorry, the page <b style={{ color: "#000" }}>{location.pathname}</b> does not exist or could not be found.
        </p>
        <button
          className="return-button"
          onClick={handleRedirect}
          style={{
            padding: "12px 32px",
            fontSize: "18px",
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginTop: "16px"
          }}
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}

export default ErrorPage;