import React, { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { profile, projects, socials, skills } from "../../data/portfolio.config"
import type { Project } from "../../data/portfolio.config"

// ── Icons ──────────────────────────────────────────────────────────────────
function GithubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function LinkedinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function MailIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function ArrowRightIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function ExternalLinkIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

// ── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
    "Em produção":        { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", text: "#34d399", dot: "#10b981", label: "Em produção" },
    "Em desenvolvimento": { bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)",  text: "#fbbf24", dot: "#f59e0b", label: "Em dev" },
    "Arquivado":          { bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)", text: "#94a3b8", dot: "#64748b", label: "Arquivado" },
  }
  const s = map[status] ?? map["Arquivado"]

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: 11, fontWeight: 500,
      background: s.bg, color: s.text,
      border: `1px solid ${s.border}`,
      borderRadius: 20, padding: "3px 10px",
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%", background: s.dot,
        boxShadow: status === "Em produção" ? `0 0 5px ${s.dot}` : "none",
        animation: status === "Em produção" ? "lp-pulse 2s infinite" : "none",
      }} />
      {s.label}
    </span>
  )
}

// ── Project Card ───────────────────────────────────────────────────────────
function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        gridColumn: project.highlight ? "span 2" : "span 1",
        display: "flex", flexDirection: "column",
        textDecoration: "none",
        background: hovered ? "rgba(19,91,236,0.05)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? "rgba(19,91,236,0.3)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 14,
        padding: project.highlight ? "26px 30px" : "22px 24px",
        transition: "all 0.22s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 8px 28px rgba(19,91,236,0.1), 0 1px 3px rgba(0,0,0,0.3)"
          : "0 1px 3px rgba(0,0,0,0.25)",
        animation: "lp-fadeUp 0.45s ease both",
        animationDelay: `${index * 0.07 + 0.2}s`,
        cursor: "pointer",
        minHeight: project.highlight ? 180 : 160,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <StatusBadge status={project.status} />
        <span style={{
          color: hovered ? "rgba(19,91,236,0.7)" : "rgba(255,255,255,0.18)",
          transition: "color 0.2s",
        }}>
          <ExternalLinkIcon size={13} />
        </span>
      </div>

      <h3 style={{
        fontSize: project.highlight ? 19 : 15,
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700, color: "#fff",
        margin: "0 0 8px", letterSpacing: -0.2,
      }}>
        {project.name}
      </h3>

      <p style={{
        fontSize: 13, color: "rgba(255,255,255,0.38)",
        lineHeight: 1.65, margin: "0 0 18px", flex: 1,
        fontFamily: "'Space Grotesk', sans-serif", fontWeight: 400,
      }}>
        {project.description}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {project.tags.map((tag) => (
          <span key={tag} style={{
            fontSize: 11, fontWeight: 500,
            fontFamily: "'Space Grotesk', sans-serif",
            color: "rgba(19,91,236,0.75)",
            background: "rgba(19,91,236,0.08)",
            border: "1px solid rgba(19,91,236,0.15)",
            borderRadius: 5, padding: "2px 8px",
          }}>
            {tag}
          </span>
        ))}
      </div>
    </a>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = "rgba(255,255,255,0.028)"
      ctx.lineWidth = 1
      const size = 72
      for (let x = 0; x <= canvas.width; x += size) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
      }
      for (let y = 0; y <= canvas.height; y += size) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
      }
    }
    draw()
    window.addEventListener("resize", draw)
    return () => window.removeEventListener("resize", draw)
  }, [])

  return (
    <>
      <style>{`
        @keyframes lp-fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }

        .lp-nav-link {
          color: rgba(255,255,255,0.38);
          text-decoration: none;
          font-size: 13px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 500;
          transition: color 0.18s;
        }
        .lp-nav-link:hover { color: rgba(255,255,255,0.8); }

        .lp-btn-primary {
          display: inline-flex; align-items: center; gap: 7px;
          background: #135bec; color: #fff;
          border: none; border-radius: 10px;
          padding: 11px 20px;
          font-size: 14px; font-family: 'Space Grotesk', sans-serif;
          font-weight: 600; cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(19,91,236,0.28);
        }
        .lp-btn-primary:hover {
          background: #1a68f5;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(19,91,236,0.38);
        }

        .lp-btn-ghost {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 11px 20px;
          font-size: 14px; font-family: 'Space Grotesk', sans-serif;
          font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .lp-btn-ghost:hover {
          border-color: rgba(255,255,255,0.22);
          color: #fff;
          background: rgba(255,255,255,0.06);
        }

        .lp-skill-pill {
          font-size: 12px; font-weight: 500;
          font-family: 'Space Grotesk', sans-serif;
          color: rgba(255,255,255,0.38);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 4px 12px;
          background: rgba(255,255,255,0.025);
          transition: all 0.18s; cursor: default;
        }
        .lp-skill-pill:hover {
          color: rgba(255,255,255,0.72);
          border-color: rgba(19,91,236,0.28);
          background: rgba(19,91,236,0.06);
        }

        .lp-social-btn {
          display: inline-flex; align-items: center; gap: 7px;
          color: rgba(255,255,255,0.38); text-decoration: none;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13px; font-weight: 500;
          padding: 7px 14px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          transition: all 0.18s;
        }
        .lp-social-btn:hover {
          color: rgba(255,255,255,0.75);
          border-color: rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.05);
        }

        .lp-projects-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px;
        }

        @media (max-width: 680px) {
          .lp-projects-grid { grid-template-columns: 1fr !important; }
          .lp-projects-grid > * { grid-column: span 1 !important; }
          .lp-hero-actions { flex-direction: column; align-items: flex-start; }
          .lp-nav-inner { padding: 0 20px !important; }
          .lp-main-inner { padding: 110px 20px 60px !important; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#101622",
        color: "#fff",
        fontFamily: "'Space Grotesk', sans-serif",
        position: "relative",
      }}>

        {/* Canvas grid */}
        <canvas ref={canvasRef} style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        }} />

        {/* Blue glow accent */}
        <div style={{
          position: "fixed", top: -280, right: -180, width: 680, height: 680,
          background: "radial-gradient(circle, rgba(19,91,236,0.055) 0%, transparent 68%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* ── NAV ─────────────────────────────────────── */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
          background: "rgba(16,22,34,0.82)",
          animation: "lp-fadeUp 0.35s ease both",
        }}>
          <div className="lp-nav-inner" style={{
            maxWidth: 1060, margin: "0 auto",
            padding: "0 48px", height: 62,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 7,
                background: "rgba(19,91,236,0.12)",
                border: "1px solid rgba(19,91,236,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#135bec" }}>
                  smart_toy
                </span>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#fff", letterSpacing: -0.2 }}>
                Coordina
              </span>
            </div>

            {/* Links */}
            <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="lp-nav-link">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* ── MAIN ────────────────────────────────────── */}
        <main>
          <div className="lp-main-inner" style={{
            maxWidth: 1060, margin: "0 auto",
            padding: "118px 48px 80px",
            position: "relative", zIndex: 1,
          }}>

            {/* ── HERO ──────────────────────────────────── */}
            <section style={{ marginBottom: 80 }}>

              <h1 style={{
                fontSize: "clamp(34px, 5vw, 58px)",
                fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5,
                margin: "0 0 10px",
                animation: "lp-fadeUp 0.45s ease both", animationDelay: "0.1s",
              }}>
                {profile.name}
              </h1>

              <h2 style={{
                fontSize: "clamp(19px, 2.8vw, 30px)",
                fontWeight: 500, lineHeight: 1.25, marginBottom: 22,
                animation: "lp-fadeUp 0.45s ease both", animationDelay: "0.14s",
              }}>
                <span style={{ color: "rgba(255,255,255,0.38)" }}>{profile.title} </span>
                <span style={{ color: "#135bec" }}>{profile.titleHighlight}</span>
              </h2>

              <p style={{
                fontSize: 15.5, color: "rgba(255,255,255,0.42)",
                lineHeight: 1.75, maxWidth: 490,
                fontWeight: 400, marginBottom: 34,
                animation: "lp-fadeUp 0.45s ease both", animationDelay: "0.18s",
              }}>
                {profile.bio}
              </p>

              <div className="lp-hero-actions" style={{
                display: "flex", gap: 10, marginBottom: 36,
                animation: "lp-fadeUp 0.45s ease both", animationDelay: "0.22s",
              }}>
                <button className="lp-btn-primary" onClick={() => navigate("/resume")}>
                  {profile.ctaResume}
                  <ArrowRightIcon size={14} />
                </button>
                <button className="lp-btn-ghost" onClick={() => navigate("/login")}>
                  {profile.ctaLogin}
                </button>
              </div>

              <div style={{
                display: "flex", flexWrap: "wrap", gap: 7,
                animation: "lp-fadeUp 0.45s ease both", animationDelay: "0.26s",
              }}>
                {skills.map((skill) => (
                  <span key={skill} className="lp-skill-pill">{skill}</span>
                ))}
              </div>
            </section>

            {/* ── PROJECTS HEADER ───────────────────────── */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
              animation: "lp-fadeUp 0.45s ease both", animationDelay: "0.28s",
            }}>
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: 1.4,
                textTransform: "uppercase", color: "rgba(255,255,255,0.22)",
                whiteSpace: "nowrap",
              }}>
                Projetos
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>

            {/* ── PROJECTS GRID ─────────────────────────── */}
            <section style={{ marginBottom: 68 }}>
              <div className="lp-projects-grid">
                {projects.map((project, i) => (
                  <ProjectCard key={project.id} project={project} index={i} />
                ))}
              </div>
            </section>

            {/* ── FOOTER ────────────────────────────────── */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 24 }} />

            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap", gap: 14,
              animation: "lp-fadeUp 0.45s ease both", animationDelay: "0.5s",
            }}>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {socials.map((s) => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="lp-social-btn">
                    {s.icon === "github"   && <GithubIcon   size={13} />}
                    {s.icon === "linkedin" && <LinkedinIcon size={13} />}
                    {s.icon === "mail"     && <MailIcon     size={13} />}
                    {s.label}
                  </a>
                ))}
              </div>

              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.16)" }}>
                {new Date().getFullYear()} — {profile.name}
              </span>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}