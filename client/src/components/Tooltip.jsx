import React from "react";

export default function Tooltip({ children }) {
  return (
    <div
      style={{
        background: "#e3f7ff",
        color: "#222",
        borderRadius: "6px",
        padding: "8px 12px",
        marginBottom: "10px",
        fontSize: "13px",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "#2196F3",
          color: "white",
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "14px",
          lineHeight: "18px"
        }}
      >
        i
      </span>
      {children}
    </div>
  );
}