import { useState, useEffect, useRef } from "react";

const VIOLET = "#7C3AED";
const CYAN = "#06B6D4";
const VIOLET_LIGHT = "#A78BFA";
const CYAN_LIGHT = "#67E8F9";
const BG = "#080B14";
const CARD = "#0D1120";
const BORDER = "#1E2640";
const TEXT = "#E2E8F0";
const MUTED = "#64748B";

const SPRING = { type: "spring", stiffness: 300, damping: 30 };

function useInView(ref, threshold = 0.15) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return inView;
}

function FadeIn({ children, delay = 0, y = 30, style = {} }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : `translateY(${y}px)`,
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SlideIn({ children, delay = 0, x = 50 }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : `translateX(${x}px)`,
        transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function AnimatedGradientText({ children, style = {} }) {
  return (
    <span style={{
      background: `linear-gradient(135deg, ${VIOLET_LIGHT}, ${CYAN_LIGHT}, ${VIOLET_LIGHT})`,
      backgroundSize: "200%",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      animation: "shimmer 4s linear infinite",
      ...style
    }}>
      {children}
    </span>
  );
}

function PulseOrb({ size = 400, color, top, left, right, bottom, opacity = 0.12 }) {
  return (
    <div style={{
      position: "absolute",
      width: size, height: size,
      borderRadius: "50%",
      background: color,
      filter: "blur(80px)",
      opacity,
      top, left, right, bottom,
      pointerEvents: "none",
      animation: "pulse 8s ease-in-out infinite",
    }} />
  );
}

function ContactCard({ icon, label, value, href, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <FadeIn delay={delay}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "20px 24px",
          background: hovered ? "rgba(124,58,237,0.08)" : CARD,
          border: `1px solid ${hovered ? VIOLET : BORDER}`,
          borderRadius: 16,
          textDecoration: "none",
          transition: "all 0.3s ease",
          transform: hovered ? "translateY(-2px)" : "none",
          boxShadow: hovered ? `0 0 24px rgba(124,58,237,0.2)` : "none",
        }}
      >
        <div style={{
          width: 48, height: 48,
          borderRadius: 12,
          background: hovered ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.1)",
          border: `1px solid ${hovered ? VIOLET_LIGHT : "rgba(124,58,237,0.3)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
          transition: "all 0.3s ease",
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: MUTED,
            marginBottom: 4,
          }}>
            {label}
          </div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: 14,
            color: hovered ? VIOLET_LIGHT : TEXT,
            transition: "color 0.3s ease",
          }}>
            {value}
          </div>
        </div>
      </a>
    </FadeIn>
  );
}

function FloatingInput({ label, name, type = "text", value, onChange, placeholder, required, rows }) {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value;
  const common = {
    width: "100%",
    boxSizing: "border-box",
    padding: "20px 16px 8px",
    background: focused ? "rgba(124,58,237,0.05)" : "rgba(255,255,255,0.02)",
    border: `1px solid ${focused ? VIOLET : isActive ? "rgba(124,58,237,0.4)" : BORDER}`,
    borderRadius: 12,
    color: TEXT,
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 15,
    outline: "none",
    transition: "all 0.3s ease",
    boxShadow: focused ? `0 0 16px rgba(124,58,237,0.15)` : "none",
    resize: "none",
  };
  return (
    <div style={{ position: "relative" }}>
      <label style={{
        position: "absolute",
        top: isActive ? 8 : 17,
        left: 16,
        fontFamily: "'DM Mono', monospace",
        fontSize: isActive ? 10 : 13,
        letterSpacing: isActive ? "0.15em" : 0,
        textTransform: isActive ? "uppercase" : "none",
        color: focused ? VIOLET_LIGHT : MUTED,
        pointerEvents: "none",
        transition: "all 0.25s ease",
        zIndex: 1,
      }}>
        {label}{required ? " *" : ""}
      </label>
      {rows ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={focused ? placeholder : ""}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...common, paddingTop: 28, lineHeight: 1.6 }}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={focused ? placeholder : ""}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={common}
        />
      )}
    </div>
  );
}

function SubmitButton({ submitting }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="submit"
      disabled={submitting}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: "16px",
        background: submitting
          ? BORDER
          : hovered
          ? `linear-gradient(135deg, #6D28D9, #0891B2)`
          : `linear-gradient(135deg, ${VIOLET}, ${CYAN})`,
        border: "none",
        borderRadius: 12,
        color: "#fff",
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: 15,
        letterSpacing: "0.04em",
        cursor: submitting ? "not-allowed" : "pointer",
        transition: "all 0.3s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        transform: hovered && !submitting ? "translateY(-1px)" : "none",
        boxShadow: hovered && !submitting ? `0 8px 32px rgba(124,58,237,0.4)` : "none",
      }}
    >
      {submitting ? (
        <span style={{
          width: 20, height: 20,
          border: "2px solid rgba(255,255,255,0.3)",
          borderTop: "2px solid #fff",
          borderRadius: "50%",
          display: "inline-block",
          animation: "spin 0.8s linear infinite",
        }} />
      ) : (
        <>
          <span>Send Message</span>
          <span style={{ fontSize: 18 }}>→</span>
        </>
      )}
    </button>
  );
}

function InfoRow({ icon, label, children }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{
        width: 36, height: 36, flexShrink: 0,
        borderRadius: 8,
        background: "rgba(6,182,212,0.1)",
        border: "1px solid rgba(6,182,212,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16,
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: MUTED,
          marginBottom: 3,
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 500,
          fontSize: 14,
          color: TEXT,
          lineHeight: 1.5,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ContactUs() {
  const [formData, setFormData] = useState({ full_name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(id);
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d?.message || "Failed to send message");
      }
      setSubmitted(true);
      setFormData({ full_name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: ${BG}; }
        @keyframes shimmer { 0%,100% { background-position: 0% 50% } 50% { background-position: 100% 50% } }
        @keyframes pulse { 0%,100% { opacity: 0.12; transform: scale(1); } 50% { opacity: 0.18; transform: scale(1.08); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes borderPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.0); }
          50% { box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }
        }
        @keyframes dash {
          to { stroke-dashoffset: -100; }
        }
        ::selection { background: rgba(124,58,237,0.4); color: #fff; }
        input::placeholder, textarea::placeholder { color: ${MUTED}; font-family: 'Space Grotesk', sans-serif; }
        a { color: inherit; }

        @media (max-width: 768px) {
          .hero-title { font-size: clamp(2.5rem, 10vw, 5rem) !important; }
          .main-grid { grid-template-columns: 1fr !important; }
          .contact-cards { grid-template-columns: 1fr !important; }
          .info-card { padding: 24px !important; }
        }
        @media (max-width: 480px) {
          .hero-section { padding: 80px 20px 60px !important; }
          .section-pad { padding: 60px 20px !important; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: BG,
        color: TEXT,
        fontFamily: "'Space Grotesk', sans-serif",
        overflowX: "hidden",
      }}>

        {/* ── HERO ── */}
        <section
          className="hero-section"
          style={{
            position: "relative",
            padding: "120px 40px 80px",
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          <PulseOrb size={500} color={VIOLET} top={-100} left="20%" opacity={0.14} />
          <PulseOrb size={400} color={CYAN} top={50} right="10%" opacity={0.1} />

          {/* Grid lines */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: `
              linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }} />

          <div style={{ position: "relative", maxWidth: 900, margin: "0 auto" }}>
            <FadeIn delay={0}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 20px",
                borderRadius: 100,
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.3)",
                marginBottom: 32,
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: VIOLET_LIGHT,
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: VIOLET_LIGHT,
                  boxShadow: `0 0 8px ${VIOLET_LIGHT}`,
                  animation: "pulse 2s ease-in-out infinite",
                  display: "inline-block",
                }} />
                Contact Us
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <h1
                className="hero-title"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(3rem, 8vw, 6rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.03em",
                  marginBottom: 24,
                  color: "#fff",
                }}
              >
                Let's Build
                <br />
                <AnimatedGradientText>Something Great</AnimatedGradientText>
              </h1>
            </FadeIn>

            <FadeIn delay={0.3}>
              <p style={{
                fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
                color: MUTED,
                maxWidth: 520,
                margin: "0 auto",
                lineHeight: 1.7,
                fontWeight: 400,
              }}>
                We're ready to automate your workflows. Reach out and we'll get back within one business day.
              </p>
            </FadeIn>

            {/* Decorative circuit node */}
            <FadeIn delay={0.4}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0,
                marginTop: 48,
              }}>
                {["Phone", "Email", "WhatsApp"].map((t, i) => (
                  <div key={t} style={{ display: "flex", alignItems: "center" }}>
                    <div style={{
                      padding: "6px 16px",
                      borderRadius: 100,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11,
                      color: MUTED,
                      letterSpacing: "0.1em",
                    }}>{t}</div>
                    {i < 2 && (
                      <div style={{
                        width: 32, height: 1,
                        background: `linear-gradient(90deg, ${BORDER}, rgba(124,58,237,0.3), ${BORDER})`,
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── CONTACT CARDS ── */}
        <section className="section-pad" style={{ padding: "40px 40px", maxWidth: 1200, margin: "0 auto" }}>
          <div
            className="contact-cards"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            <ContactCard icon="📞" label="Phone" value="+91 9322475209" href="tel:+919322475209" delay={0.1} />
            <ContactCard icon="✉️" label="Email" value="vimleshnew29@gmail.com" href="mailto:vimleshnew29@gmail.com" delay={0.2} />
            <ContactCard icon="💬" label="WhatsApp" value="Chat with us" href="https://wa.me/919322475209" delay={0.3} />
          </div>
        </section>

        {/* ── FORM + INFO ── */}
        <section className="section-pad" style={{ padding: "40px 40px 100px", maxWidth: 1200, margin: "0 auto" }}>
          <div
            className="main-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 32,
              alignItems: "start",
            }}
          >
            {/* Form card */}
            <SlideIn x={-40} delay={0.1}>
              <div style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: 24,
                padding: "40px",
                position: "relative",
                overflow: "hidden",
                animation: "borderPulse 4s ease-in-out infinite",
              }}>
                {/* Gradient accent corner */}
                <div style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0,
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${VIOLET}, ${CYAN}, transparent)`,
                }} />
                <div style={{
                  position: "absolute",
                  top: -60, right: -60,
                  width: 160, height: 160,
                  borderRadius: "50%",
                  background: VIOLET,
                  opacity: 0.04,
                  filter: "blur(40px)",
                }} />

                {submitted ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <div style={{
                      width: 72, height: 72,
                      borderRadius: "50%",
                      background: "rgba(6,182,212,0.1)",
                      border: "1px solid rgba(6,182,212,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 32, margin: "0 auto 20px",
                      animation: "float 3s ease-in-out infinite",
                    }}>
                      ✓
                    </div>
                    <h3 style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700, fontSize: 24,
                      color: "#fff", marginBottom: 10,
                    }}>
                      Message Sent!
                    </h3>
                    <p style={{ color: MUTED, fontSize: 14, marginBottom: 28 }}>
                      We'll get back to you within one business day.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      style={{
                        padding: "10px 28px",
                        background: "rgba(124,58,237,0.15)",
                        border: `1px solid ${VIOLET}`,
                        borderRadius: 10,
                        color: VIOLET_LIGHT,
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 600, fontSize: 14,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      Send Another
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 28 }}>
                      <h2 style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700, fontSize: 24,
                        color: "#fff", marginBottom: 6,
                      }}>
                        Send a Message
                      </h2>
                      <p style={{ color: MUTED, fontSize: 14 }}>
                        Tell us about your automation requirements.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <FloatingInput
                        label="Full Name" name="full_name" value={formData.full_name}
                        onChange={handleChange} placeholder="Your full name" required
                      />
                      <FloatingInput
                        label="Email" name="email" type="email" value={formData.email}
                        onChange={handleChange} placeholder="your@email.com" required
                      />
                      <FloatingInput
                        label="Phone" name="phone" type="tel" value={formData.phone}
                        onChange={handleChange} placeholder="+91 9322475209"
                      />
                      <FloatingInput
                        label="Message" name="message" value={formData.message}
                        onChange={handleChange} placeholder="Describe your project or requirements..." required rows={5}
                      />

                      {error && (
                        <div style={{
                          padding: "12px 16px",
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.25)",
                          borderRadius: 10,
                          color: "#F87171",
                          fontSize: 13,
                          fontFamily: "'DM Mono', monospace",
                        }}>
                          {error}
                        </div>
                      )}

                      <SubmitButton submitting={submitting} />
                    </form>
                  </>
                )}
              </div>
            </SlideIn>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <SlideIn x={40} delay={0.2}>
                <div
                  className="info-card"
                  style={{
                    background: CARD,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 24,
                    padding: "36px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, transparent, ${CYAN}, transparent)`,
                  }} />

                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    marginBottom: 28,
                  }}>
                    <div style={{
                      width: 40, height: 40,
                      borderRadius: 10,
                      background: "rgba(124,58,237,0.15)",
                      border: "1px solid rgba(124,58,237,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18,
                    }}>⚡</div>
                    <div>
                      <h3 style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700, fontSize: 18, color: "#fff",
                      }}>
                        Tek Node
                      </h3>
                      <div style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 10, letterSpacing: "0.15em",
                        textTransform: "uppercase", color: VIOLET_LIGHT,
                      }}>
                        Automation Studio
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <InfoRow icon="📞" label="Phone">
                      <a href="tel:+919322475209" style={{ color: TEXT, textDecoration: "none" }}>
                        +91 9322475209
                      </a>
                    </InfoRow>
                    <InfoRow icon="✉️" label="Email">
                      <a href="mailto:vimleshnew29@gmail.com" style={{ color: TEXT, textDecoration: "none" }}>
                        vimleshnew29@gmail.com
                      </a>
                    </InfoRow>
                    <InfoRow icon="💬" label="WhatsApp">
                      <a href="https://wa.me/919322475209" target="_blank" rel="noopener noreferrer" style={{ color: TEXT, textDecoration: "none" }}>
                        Chat with us instantly
                      </a>
                    </InfoRow>
                    <InfoRow icon="🕐" label="Business Hours">
                      Mon – Sat · 9:00 AM – 7:00 PM IST
                    </InfoRow>
                  </div>

                  {/* Status badge */}
                  <div style={{
                    marginTop: 28,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    borderRadius: 100,
                    background: "rgba(6,182,212,0.08)",
                    border: "1px solid rgba(6,182,212,0.2)",
                  }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: "#34D399",
                      boxShadow: "0 0 6px #34D399",
                      animation: "pulse 2s ease-in-out infinite",
                      display: "inline-block",
                    }} />
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11, letterSpacing: "0.12em",
                      color: CYAN_LIGHT,
                    }}>
                      Currently accepting projects
                    </span>
                  </div>
                </div>
              </SlideIn>

              {/* Map */}
              <SlideIn x={40} delay={0.35}>
                <div style={{
                  background: CARD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 24,
                  overflow: "hidden",
                  height: 240,
                  position: "relative",
                }}>
                  <div style={{
                    position: "absolute", top: 12, left: 12, zIndex: 10,
                    padding: "6px 12px",
                    background: "rgba(8,11,20,0.85)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: CYAN_LIGHT,
                  }}>
                    📍 Location
                  </div>
                  <iframe
                    title="Tek Node Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.8!2d72.5!3d23.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDAwJzAwLjAiTiA3MsKwMzQnMjAuMCJF!5e0!3m2!1sen!2sin!4v1"
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) brightness(0.85)" }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </SlideIn>
            </div>
          </div>
        </section>

        {/* ── FOOTER STRIP ── */}
        <div style={{
          borderTop: `1px solid ${BORDER}`,
          padding: "24px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          maxWidth: 1200,
          margin: "0 auto",
        }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.1em", color: MUTED }}>
            © 2025 Tek Node · All rights reserved
          </div>
          <div style={{
            display: "flex", gap: 24,
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, letterSpacing: "0.1em",
          }}>
            {["Privacy", "Terms", "Support"].map(l => (
              <span key={l} style={{ color: MUTED, cursor: "pointer" }}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}