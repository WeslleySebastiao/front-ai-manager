import React from "react"
import { useNavigate } from "react-router-dom"

export default function ResumePage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060910",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'JetBrains Mono', monospace",
      gap: 20,
    }}>
      <span style={{
        fontSize: 11,
        color: "rgba(0,255,157,0.6)",
        letterSpacing: 2,
        textTransform: "uppercase",
      }}>
        ./resume — em construção
      </span>

      <h1 style={{
        fontSize: 28,
        fontFamily: "sans-serif",
        color: "rgba(255,255,255,0.7)",
        textAlign: "center",
      }}>
        Currículo completo em breve
      </h1>

      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: 12,
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "rgba(255,255,255,0.5)",
          borderRadius: 8,
          padding: "10px 20px",
          cursor: "pointer",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
        }}
      >
        ← voltar
      </button>
    </div>
  )
}