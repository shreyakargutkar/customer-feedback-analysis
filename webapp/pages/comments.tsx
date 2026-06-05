import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

type CommentRow = {
  id: string;
  guest_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  comment_text?: string;
  rating?: string;
  sentiment?: "Favourable" | "Unfavourable" | "Neutral";
  sentiment_confidence?: number;
  sentiment_reason?: string;
  matched_keywords?: string[];
  benchmarks?: string[];
  sub_benchmarks?: string[];
  created_at?: string;
  outlet_id?: string;
  outlet_name?: string;
  ai_reasoning?: any;
};

export default function CommentsPage() {
  const router = useRouter();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterSentiment, setFilterSentiment] = useState("all");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [outletId, setOutletId] = useState("");
  const [selectedXAIComment, setSelectedXAIComment] = useState<CommentRow | null>(null);
  const [isXAIModalOpen, setIsXAIModalOpen] = useState(false);

  // Focus & hover states for styling
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [hoveredInspectId, setHoveredInspectId] = useState<string | null>(null);
  const [hoveredDeleteId, setHoveredDeleteId] = useState<string | null>(null);

  useEffect(() => {
    async function protectPage() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role !== "admin" && profile?.role !== "employee") {
        router.replace("/add-comment");
      } else {
        setIsAuthorized(true);
      }
    }
    protectPage();
  }, [router]);

  async function loadOutlets() {
    const res = await fetch("/api/outlets");
    const json = await res.json();
    setOutlets(json.data || []);
  }

  async function loadComments() {
    try {
      setLoading(true);
      const url = outletId
        ? `/api/comments?outlet_id=${outletId}`
        : "/api/comments";
      const res = await fetch(url);
      const json = await res.json();
      setComments(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this comment?")) return;
    await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
    loadComments();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  useEffect(() => {
    if (isAuthorized) {
      loadOutlets();
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (isAuthorized) {
      loadComments();
    }
  }, [isAuthorized, outletId]);

  if (!isAuthorized) return null;

  const { filteredComments, stats } = useMemo(() => {
    const q = query.toLowerCase();
    const filtered = comments.filter((c) => {
      const matchesQuery =
        q === "" ||
        c.guest_name?.toLowerCase().includes(q) ||
        c.comment_text?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(query);

      const matchesSentiment =
        filterSentiment === "all" || c.sentiment === filterSentiment;

      return matchesQuery && matchesSentiment;
    });

    let favourable = 0;
    let unfavourable = 0;
    let neutral = 0;
    for (let i = 0; i < filtered.length; i++) {
      const s = filtered[i].sentiment;
      if (s === "Favourable") favourable++;
      else if (s === "Unfavourable") unfavourable++;
      else if (s === "Neutral") neutral++;
    }

    return {
      filteredComments: filtered,
      stats: {
        total: filtered.length,
        favourable,
        unfavourable,
        neutral
      }
    };
  }, [comments, query, filterSentiment]);

  const favourableRatio = stats.total > 0 ? Math.round((stats.favourable / stats.total) * 100) : 0;

  const getInputStyle = (fieldName: string): React.CSSProperties => {
    const isFocused = focusedField === fieldName;
    return {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 8,
      background: "rgba(8, 25, 46, 0.4)",
      color: "#F7FAFC",
      border: isFocused ? "1px solid #A5C9FF" : "1px solid rgba(255, 255, 255, 0.12)",
      fontSize: 13,
      outline: "none",
      transition: "all 0.2s ease",
      boxShadow: isFocused ? "0 0 0 3px rgba(165, 201, 255, 0.2)" : "inset 0 1px 2px rgba(0,0,0,0.2)",
    };
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 54px)",
        background: "radial-gradient(circle at 50% 0%, #0C2340 0%, #08192E 100%)",
        padding: "80px 32px",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        {/* ASYMMETRICAL EDITORIAL HERO */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 48,
            alignItems: "center",
            marginBottom: 80,
          }}
        >
          {/* Left Side: Clean Typography */}
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                color: "#A5C9FF",
                letterSpacing: "0.12em",
                marginBottom: 12,
              }}
            >
              Customer Intelligence
            </div>
            <h1
              style={{
                color: "#F7FAFC",
                fontSize: "36px",
                fontWeight: 500,
                margin: "0 0 16px 0",
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
              }}
            >
              Feedback Insights
            </h1>
            <p
              style={{
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "14px",
                margin: 0,
                lineHeight: 1.6,
                maxWidth: 500,
              }}
            >
              Monitor customer reviews, analyze local ML model diagnostics, and inspect aspect-based polarity mappings.
            </p>
          </div>

          {/* Right Side: Floating Analytics Card */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                width: "100%",
                maxWidth: 300,
                background: "rgba(17, 42, 74, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: 20,
                padding: 24,
                boxShadow: "0 15px 35px rgba(0, 0, 0, 0.2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Satisfactory Rating</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "10px", color: "#4ade80", fontWeight: 500 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                  Healthy
                </span>
              </div>
              <div style={{ fontSize: "32px", fontWeight: 300, color: "#F7FAFC", letterSpacing: "-0.02em" }}>{favourableRatio}%</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Favourable sentiment proportion</div>
            </div>
          </div>
        </div>

        {/* STATS METRIC TILES (Compact and card-less layout with high whitespace) */}
        <div
          style={{
            display: "flex",
            gap: 60,
            marginBottom: 60,
            flexWrap: "wrap",
            paddingBottom: 24,
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div>
            <div style={{ fontSize: "36px", fontWeight: 300, color: "#F7FAFC", lineHeight: 1 }}>{stats.total}</div>
            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.48)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>Total Submissions</div>
          </div>
          <div>
            <div style={{ fontSize: "36px", fontWeight: 300, color: "#4ade80", lineHeight: 1 }}>{stats.favourable}</div>
            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.48)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>Favourable</div>
          </div>
          <div>
            <div style={{ fontSize: "36px", fontWeight: 300, color: "#fca5a5", lineHeight: 1 }}>{stats.unfavourable}</div>
            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.48)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>Unfavourable</div>
          </div>
          <div>
            <div style={{ fontSize: "36px", fontWeight: 300, color: "#fcd34d", lineHeight: 1 }}>{stats.neutral}</div>
            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.48)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>Neutral</div>
          </div>
        </div>

        {/* FILTERS PANEL */}
        <div
          style={{
            background: "rgba(17, 42, 74, 0.2)",
            borderRadius: 20,
            padding: "24px 32px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
            }}
          >
            {/* Search */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.48)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Search Guest Feedback
              </label>
              <input
                type="text"
                value={query}
                onFocus={() => setFocusedField("search")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email, phone..."
                style={getInputStyle("search")}
              />
            </div>

            {/* Outlet Filter */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.48)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Filter by Outlet
              </label>
              <select
                value={outletId}
                onFocus={() => setFocusedField("outlet")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setOutletId(e.target.value)}
                style={getInputStyle("outlet")}
              >
                <option value="">All Outlets</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.outlet_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sentiment Filter */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.48)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Filter by Sentiment
              </label>
              <select
                value={filterSentiment}
                onFocus={() => setFocusedField("sentiment")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setFilterSentiment(e.target.value)}
                style={getInputStyle("sentiment")}
              >
                <option value="all">All Sentiments</option>
                <option value="Favourable">Favourable</option>
                <option value="Unfavourable">Unfavourable</option>
                <option value="Neutral">Neutral</option>
              </select>
            </div>
          </div>
        </div>

        {/* COMMENTS TABLE CARD (Clean surface, soft borders, larger padding) */}
        <div
          style={{
            background: "rgba(17, 42, 74, 0.2)",
            borderRadius: 24,
            padding: "36px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                color: "rgba(255, 255, 255, 0.6)",
                padding: "60px 0",
                fontSize: 14,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ animation: "spin 1.2s linear infinite" }}
              >
                <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10"></circle>
              </svg>
              Analyzing feed...
            </div>
          ) : filteredComments.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 0",
                color: "rgba(255, 255, 255, 0.48)",
              }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ margin: "0 auto 16px", opacity: 0.5 }}
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <p style={{ fontSize: 15, fontWeight: 500, color: "#F7FAFC", margin: 0 }}>No comments found</p>
              <p style={{ fontSize: 13, margin: "6px 0 0" }}>Adjust your filters or submit new feedback</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                <thead>
                  <tr>
                    <th style={headerStyle}>Date</th>
                    <th style={headerStyle}>Guest</th>
                    <th style={headerStyle}>Contact</th>
                    <th style={headerStyle}>Comment</th>
                    <th style={headerStyle}>Sentiment</th>
                    <th style={headerStyle}>Rating</th>
                    <th style={{ ...headerStyle, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComments.map((comment) => (
                    <tr
                      key={comment.id}
                      style={{
                        background: "rgba(8, 25, 46, 0.2)",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(8, 25, 46, 0.4)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(8, 25, 46, 0.2)"}
                    >
                      <td style={{ ...cellStyle, borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>
                        {comment.created_at
                          ? new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                          : "—"}
                      </td>
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 500, color: "#F7FAFC" }}>
                          {comment.guest_name || "—"}
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 1 }}>
                          {comment.email && (
                            <span style={{ color: "rgba(255, 255, 255, 0.72)" }}>
                              {comment.email}
                            </span>
                          )}
                          {comment.phone && <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>{comment.phone}</span>}
                          {!comment.email && !comment.phone && "—"}
                        </div>
                      </td>
                      <td style={{ ...cellStyle, maxWidth: 300 }}>
                        <div
                          style={{
                            fontSize: 13,
                            lineHeight: 1.5,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            color: "rgba(255, 255, 255, 0.72)",
                          }}
                        >
                          {comment.comment_text || "—"}
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <SentimentBadge sentiment={comment.sentiment} />
                      </td>
                      <td style={cellStyle}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: "rgba(165, 201, 255, 0.08)",
                            color: "#A5C9FF",
                            fontSize: 12,
                            fontWeight: 500,
                            border: "1px solid rgba(165, 201, 255, 0.15)",
                          }}
                        >
                          ★ {comment.rating || "—"}
                        </div>
                      </td>
                      <td style={{ ...cellStyle, borderTopRightRadius: "10px", borderBottomRightRadius: "10px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 8 }}>
                          <button
                            onClick={() => {
                              setSelectedXAIComment(comment);
                              setIsXAIModalOpen(true);
                            }}
                            onMouseEnter={() => setHoveredInspectId(comment.id)}
                            onMouseLeave={() => setHoveredInspectId(null)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              background: hoveredInspectId === comment.id ? "rgba(165, 201, 255, 0.08)" : "transparent",
                              color: hoveredInspectId === comment.id ? "#A5C9FF" : "rgba(255, 255, 255, 0.8)",
                              border: "1px solid rgba(255, 255, 255, 0.12)",
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <circle cx="11" cy="11" r="8"></circle>
                              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                              <line x1="11" y1="8" x2="11" y2="14"></line>
                              <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                            Inspect AI
                          </button>
                          <button
                            onClick={() => handleDelete(comment.id)}
                            onMouseEnter={() => setHoveredDeleteId(comment.id)}
                            onMouseLeave={() => setHoveredDeleteId(null)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              background: hoveredDeleteId === comment.id ? "rgba(255, 139, 139, 0.12)" : "transparent",
                              color: "#FF8B8B",
                              border: hoveredDeleteId === comment.id ? "1px solid rgba(255, 139, 139, 0.4)" : "1px solid rgba(255, 139, 139, 0.2)",
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* XAI INSPECTOR MODAL */}
      {isXAIModalOpen && selectedXAIComment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          {/* Backdrop blur overlay */}
          <div
            onClick={() => setIsXAIModalOpen(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(8, 25, 46, 0.75)",
              backdropFilter: "blur(20px)",
              transition: "all 0.3s ease",
            }}
          />

          {/* Modal Card */}
          <div
            style={{
              position: "relative",
              background: "rgba(17, 42, 74, 0.95)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: 24,
              width: "100%",
              maxWidth: 800,
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 30px 60px rgba(0, 0, 0, 0.4)",
              color: "#F7FAFC",
              fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "28px 32px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 500,
                    margin: 0,
                    color: "#F7FAFC",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    letterSpacing: "-0.01em",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A5C9FF" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  AI Sentiment Inspector
                </h2>
                <p style={{ color: "rgba(255, 255, 255, 0.48)", fontSize: "12px", marginTop: 4, marginBottom: 0 }}>
                  Guest: <strong style={{ color: "#F7FAFC" }}>{selectedXAIComment.guest_name || "Anonymous"}</strong> • Rating: <strong style={{ color: "#A5C9FF" }}>{selectedXAIComment.rating}/5</strong>
                </p>
              </div>
              <button
                onClick={() => setIsXAIModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255, 255, 255, 0.48)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 4,
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#FF8B8B"}
                onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255, 255, 255, 0.48)"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            {!selectedXAIComment.ai_reasoning ? (
              <div style={{ padding: "60px 32px", textAlign: "center", color: "rgba(255, 255, 255, 0.6)" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" style={{ margin: "0 auto 16px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p style={{ fontSize: 15, fontWeight: 500, color: "#F7FAFC", marginBottom: 6 }}>AI reasoning logs are unavailable for this entry.</p>
                <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.48)", maxWidth: 450, margin: "0 auto", lineHeight: 1.5 }}>
                  This record may have been created before Explainable AI logic was introduced, or saved during database retry fallback.
                </p>
              </div>
            ) : (
              <>
                <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: 28 }}>
                  
                  {/* RAW CUSTOMER COMMENT */}
                  <div style={panelStyle}>
                    <div style={panelTitleStyle}>Raw Customer Comment</div>
                    <div style={{ fontSize: "14px", fontStyle: "italic", color: "#F7FAFC", lineHeight: 1.6 }}>
                      "{selectedXAIComment.comment_text}"
                    </div>
                  </div>

                  {/* PIPELINE & NLP PREPROCESSING */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                    
                    {/* PIPELINE USED */}
                    <div style={panelStyle}>
                      <div style={panelTitleStyle}>1. Ingestion Pipeline</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {selectedXAIComment.ai_reasoning.pipeline_used === "local_nlp_engine" || selectedXAIComment.ai_reasoning.pipeline_used === "transformer_primary" ? (
                          <div style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            background: "rgba(165, 201, 255, 0.08)",
                            border: "1px solid rgba(165, 201, 255, 0.15)",
                            color: "#A5C9FF",
                            fontSize: 12,
                            fontWeight: 500,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#A5C9FF", display: "inline-block" }} />
                            {selectedXAIComment.ai_reasoning.pipeline_used === "local_nlp_engine" ? "Local ML Engine" : "OpenRouter Transformer"}
                          </div>
                        ) : (
                          <div style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            background: "rgba(251, 191, 36, 0.08)",
                            border: "1px solid rgba(251, 191, 36, 0.15)",
                            color: "#fbbf24",
                            fontSize: 12,
                            fontWeight: 500,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />
                            Rule-Based NLP Fallback
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.48)", marginTop: 10, lineHeight: 1.5 }}>
                        {selectedXAIComment.ai_reasoning.pipeline_used === "local_nlp_engine" ? (
                          "Sentiment analyzed via local high-fidelity lexicon engine."
                        ) : selectedXAIComment.ai_reasoning.pipeline_used === "transformer_primary" ? (
                          "Sentiment analyzed via OpenRouter free model."
                        ) : (
                          "Local primary engine failed. Polarity scored via negation-aware keyword counts."
                        )}
                      </div>
                    </div>

                    {/* PROCESSED TEXT */}
                    <div style={panelStyle}>
                      <div style={panelTitleStyle}>2. NLP Preprocessing</div>
                      <div style={{
                        background: "rgba(8, 25, 46, 0.4)",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontFamily: "monospace",
                        fontSize: "12px",
                        color: "#34d399",
                        wordBreak: "break-all",
                        lineHeight: 1.4,
                      }}>
                        {selectedXAIComment.ai_reasoning.processed_text || "—"}
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.48)", marginTop: 10, lineHeight: 1.5 }}>
                        Cleaned tokens (contraction expanded, punctuation and stopwords filtered).
                      </div>
                    </div>
                  </div>

                  {/* SENTIMENT & CONFIDENCE METRICS */}
                  <div style={panelStyle}>
                    <div style={panelTitleStyle}>3. Sentiment & Confidence Metrics</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
                      
                      <div style={{ background: "rgba(8, 25, 46, 0.2)", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.03)" }}>
                        <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.48)", textTransform: "uppercase", fontWeight: 500, letterSpacing: "0.05em" }}>Raw Prediction</div>
                        <div style={{ marginTop: 8 }}>
                          {selectedXAIComment.ai_reasoning.roberta_prediction ? (
                            <SentimentBadge sentiment={selectedXAIComment.ai_reasoning.roberta_prediction} />
                          ) : (
                            <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.4)" }}>N/A (Fallback)</span>
                          )}
                        </div>
                        {selectedXAIComment.ai_reasoning.roberta_confidence !== null && selectedXAIComment.ai_reasoning.roberta_confidence !== undefined && (
                          <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", marginTop: 6 }}>
                            Conf: {(selectedXAIComment.ai_reasoning.roberta_confidence * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>

                      <div style={{ background: "rgba(8, 25, 46, 0.2)", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.03)" }}>
                        <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.48)", textTransform: "uppercase", fontWeight: 500, letterSpacing: "0.05em" }}>Final Sentiment Score</div>
                        <div style={{ marginTop: 8 }}>
                          <SentimentBadge sentiment={selectedXAIComment.ai_reasoning.final_sentiment || selectedXAIComment.sentiment} />
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", marginTop: 6 }}>
                          Final Conf: {((selectedXAIComment.sentiment_confidence || 0.5) * 100).toFixed(0)}%
                        </div>
                      </div>

                      <div style={{ background: "rgba(8, 25, 46, 0.2)", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.03)", gridColumn: "span 2" }}>
                        <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.48)", textTransform: "uppercase", fontWeight: 500, letterSpacing: "0.05em", marginBottom: 8 }}>Confidence Meter</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ flexGrow: 1, background: "rgba(8, 25, 46, 0.4)", height: 6, borderRadius: 3, overflow: "hidden", border: "1px solid rgba(255,255,255,0.03)" }}>
                            <div style={{
                              width: `${((selectedXAIComment.sentiment_confidence || 0.5) * 100)}%`,
                              background: selectedXAIComment.sentiment === "Favourable" ? "#22c55e" : selectedXAIComment.sentiment === "Unfavourable" ? "#ef4444" : "#fbbf24",
                              height: "100%",
                              borderRadius: 3,
                              transition: "all 0.3s ease",
                            }} />
                          </div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#F7FAFC" }}>
                            {((selectedXAIComment.sentiment_confidence || 0.5) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* KEYWORD VALIDATION */}
                  <div style={panelStyle}>
                    <div style={panelTitleStyle}>4. Keyword Validation & Overlaps</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
                      
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                          Positive Matches ({selectedXAIComment.ai_reasoning.keyword_validation?.positive_matches?.length || 0})
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {selectedXAIComment.ai_reasoning.keyword_validation?.positive_matches?.length > 0 ? (
                            selectedXAIComment.ai_reasoning.keyword_validation.positive_matches.map((kw: string, i: number) => (
                              <span key={i} style={{ padding: "4px 8px", borderRadius: 6, background: "rgba(34, 197, 94, 0.08)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.15)", fontSize: "11px", fontWeight: 500 }}>
                                {kw}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)" }}>None</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
                          Negative Matches ({selectedXAIComment.ai_reasoning.keyword_validation?.negative_matches?.length || 0})
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {selectedXAIComment.ai_reasoning.keyword_validation?.negative_matches?.length > 0 ? (
                            selectedXAIComment.ai_reasoning.keyword_validation.negative_matches.map((kw: string, i: number) => (
                              <span key={i} style={{ padding: "4px 8px", borderRadius: 6, background: "rgba(239, 68, 68, 0.08)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.15)", fontSize: "11px", fontWeight: 500 }}>
                                {kw}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)" }}>None</span>
                          )}
                        </div>
                      </div>

                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.48)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        Negations Detected: 
                        <span style={{
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: selectedXAIComment.ai_reasoning.negation_detected ? "rgba(255, 139, 139, 0.1)" : "rgba(255,255,255,0.03)",
                          color: selectedXAIComment.ai_reasoning.negation_detected ? "#FF8B8B" : "rgba(255, 255, 255, 0.4)",
                          fontWeight: 600,
                          fontSize: "10px"
                        }}>
                          {selectedXAIComment.ai_reasoning.negation_detected ? "YES" : "NO"}
                        </span>
                      </div>
                      {selectedXAIComment.ai_reasoning.confidence_adjustments && (
                        <div style={{ fontSize: "11px", color: "#fcd34d", marginLeft: "auto", fontStyle: "italic" }}>
                          {selectedXAIComment.ai_reasoning.confidence_adjustments}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ABSA MULTI-ASPECT CLAUSE GRID */}
                  <div style={panelStyle}>
                    <div style={panelTitleStyle}>5. Aspect-Based Clause Extraction</div>
                    {selectedXAIComment.ai_reasoning.aspect_analysis && selectedXAIComment.ai_reasoning.aspect_analysis.length > 0 ? (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px", fontSize: "12px" }}>
                          <thead>
                            <tr style={{ color: "rgba(255, 255, 255, 0.4)" }}>
                              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 500 }}>Clause Segment</th>
                              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 500 }}>Mapped Aspect</th>
                              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 500 }}>Sentiment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedXAIComment.ai_reasoning.aspect_analysis.map((clause: any, i: number) => (
                              <tr key={i} style={{ background: "rgba(8, 25, 46, 0.2)" }}>
                                <td style={{ padding: "10px", color: "#F7FAFC", fontStyle: "italic", borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }}>
                                  "{clause.clause}"
                                </td>
                                <td style={{ padding: "10px" }}>
                                  <span style={{
                                    padding: "3px 6px",
                                    borderRadius: 4,
                                    background: "rgba(255,255,255,0.03)",
                                    color: "rgba(255, 255, 255, 0.8)",
                                    fontWeight: 500,
                                    fontSize: "10px",
                                    border: "1px solid rgba(255, 255, 255, 0.05)",
                                  }}>
                                    {clause.aspect}
                                  </span>
                                </td>
                                <td style={{ padding: "10px", borderTopRightRadius: 6, borderBottomRightRadius: 6 }}>
                                  <SentimentBadge sentiment={clause.sentiment} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.4)", padding: "4px 0" }}>
                        No specific aspects classified (general comment).
                      </div>
                    )}
                  </div>

                  {/* DECISION TRACE */}
                  <div style={{
                    background: "rgba(165, 201, 255, 0.03)",
                    border: "1px solid rgba(165, 201, 255, 0.15)",
                    borderRadius: 14,
                    padding: "20px",
                  }}>
                    <div style={{ ...panelTitleStyle, color: "#A5C9FF", marginBottom: 8 }}>6. Sentiment Decision Rationale</div>
                    <div style={{ fontSize: "13px", color: "#F7FAFC", lineHeight: 1.6 }}>
                      {selectedXAIComment.ai_reasoning.final_reason || selectedXAIComment.sentiment_reason || "No reasoning details logged for this record."}
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div style={{
                  padding: "16px 32px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                  display: "flex",
                  justifyContent: "flex-end"
                }}>
                  <button
                    onClick={() => setIsXAIModalOpen(false)}
                    style={{
                      padding: "8px 18px",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: 6,
                      color: "#F7FAFC",
                      fontWeight: 500,
                      cursor: "pointer",
                      fontSize: "12px",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)"}
                  >
                    Close Inspector
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: "rgba(8, 25, 46, 0.2)",
  border: "1px solid rgba(255, 255, 255, 0.04)",
  borderRadius: 12,
  padding: "16px 20px",
};

const panelTitleStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 600,
  textTransform: "uppercase",
  color: "rgba(255, 255, 255, 0.4)",
  letterSpacing: "0.08em",
  marginBottom: 10,
};

const headerStyle: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  color: "rgba(255, 255, 255, 0.4)",
  fontSize: "10px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const cellStyle: React.CSSProperties = {
  padding: "14px",
  color: "rgba(255, 255, 255, 0.8)",
  fontSize: "13px",
};

function SentimentBadge({
  sentiment,
}: {
  sentiment?: "Favourable" | "Unfavourable" | "Neutral";
}) {
  const colors = {
    Favourable: { bg: "rgba(34, 197, 94, 0.08)", text: "#4ade80", border: "rgba(34, 197, 94, 0.15)" },
    Unfavourable: { bg: "rgba(239, 68, 68, 0.08)", text: "#fca5a5", border: "rgba(239, 68, 68, 0.15)" },
    Neutral: { bg: "rgba(251, 191, 36, 0.08)", text: "#fcd34d", border: "rgba(251, 191, 36, 0.15)" },
  };

  const color = sentiment ? colors[sentiment] : colors.Neutral;

  return (
    <div
      style={{
        display: "inline-block",
        padding: "3px 8px",
        borderRadius: 6,
        background: color.bg,
        color: color.text,
        border: `1px solid ${color.border}`,
        fontSize: "10px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {sentiment || "—"}
    </div>
  );
}