import { useEffect, useState } from "react";
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

  useEffect(() => {
    async function protectPage() {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        router.replace("/add-comment");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role !== "employee") {
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

  useEffect(() => {
    if (isAuthorized) {
      loadOutlets();
      loadComments();
    }
  }, [isAuthorized, outletId]);

  const stats = {
    total: comments.length,
    positive: comments.filter((c) => c.sentiment === "Favourable").length,
    negative: comments.filter((c) => c.sentiment === "Unfavourable").length,
    neutral: comments.filter((c) => c.sentiment === "Neutral").length,
  };

  const filtered = comments.filter((c) => {
    const q = query.toLowerCase();
    const matchesSearch =
      c.guest_name?.toLowerCase().includes(q) ||
      c.comment_text?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q);

    const matchesSentiment =
      filterSentiment === "all" || c.sentiment === filterSentiment;

    return matchesSearch && matchesSentiment;
  });

  const sentimentStyle = (sentiment?: string) => {
    if (sentiment === "Favourable") {
      return {
        bg: "rgba(34, 197, 94, 0.15)",
        color: "#86efac",
        border: "1px solid rgba(34, 197, 94, 0.3)",
      };
    }
    if (sentiment === "Unfavourable") {
      return {
        bg: "rgba(239, 68, 68, 0.15)",
        color: "#fca5a5",
        border: "1px solid rgba(239, 68, 68, 0.3)",
      };
    }
    return {
      bg: "rgba(234, 179, 8, 0.15)",
      color: "#fde68a",
      border: "1px solid rgba(234, 179, 8, 0.3)",
    };
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "#64748b";
    if (confidence >= 0.8) return "#22c55e";
    if (confidence >= 0.6) return "#fbbf24";
    return "#ef4444";
  };

  function renderStars(value?: string) {
    const n = Number(value);
    if (!n) return <span style={{ color: "#64748b" }}>—</span>;
    return (
      <span style={{ fontSize: 16 }}>
        <span style={{ color: "#fbbf24" }}>{"★".repeat(n)}</span>
        <span style={{ color: "#475569" }}>{"★".repeat(5 - n)}</span>
      </span>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        padding: "40px 20px",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <h1
              style={{
                color: "#f9fafb",
                fontSize: 36,
                fontWeight: 700,
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Guest Comments
            </h1>
            <p
              style={{
                color: "#9ca3af",
                marginTop: 8,
                fontSize: 16,
                fontWeight: 400,
              }}
            >
              View and manage all customer feedback
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link
              href="/dashboard"
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.05)",
                color: "#cbd5e1",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                transition: "all 0.2s ease",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Dashboard
            </Link>
            <Link
              href="/add-comment"
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                color: "#ffffff",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                transition: "all 0.2s ease",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Comment
            </Link>
          </div>
        </div>

        {/* STATS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
            marginBottom: 32,
          }}
        >
          <StatCard label="Total Comments" value={stats.total} color="#60a5fa" />
          <StatCard label="Favourable" value={stats.positive} color="#22c55e" />
          <StatCard label="Unfavourable" value={stats.negative} color="#ef4444" />
          <StatCard label="Neutral" value={stats.neutral} color="#fbbf24" />
        </div>

        {/* FILTERS */}
        <div
          style={{
            background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            placeholder="Search by name, comment, phone, email, or address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: 300,
              padding: "14px 16px",
              borderRadius: 10,
              background: "rgba(15, 23, 42, 0.4)",
              border: "2px solid rgba(255, 255, 255, 0.08)",
              color: "#f9fafb",
              fontSize: 15,
              outline: "none",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              fontFamily: "inherit",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(96, 165, 250, 0.6)";
              e.target.style.background = "rgba(15, 23, 42, 0.6)";
              e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.target.style.background = "rgba(15, 23, 42, 0.4)";
              e.target.style.boxShadow = "none";
            }}
          />
          <select
            value={outletId}
            onChange={(e) => setOutletId(e.target.value)}
            style={{
              padding: "14px 16px",
              borderRadius: 10,
              background: "rgba(15, 23, 42, 0.4)",
              border: "2px solid rgba(255, 255, 255, 0.08)",
              color: "#f9fafb",
              fontSize: 15,
              outline: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <option value="">All Outlets</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.outlet_name}
              </option>
            ))}
          </select>
          <select
            value={filterSentiment}
            onChange={(e) => setFilterSentiment(e.target.value)}
            style={{
              padding: "14px 16px",
              borderRadius: 10,
              background: "rgba(15, 23, 42, 0.4)",
              border: "2px solid rgba(255, 255, 255, 0.08)",
              color: "#f9fafb",
              fontSize: 15,
              outline: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <option value="all">All Sentiments</option>
            <option value="Favourable">Favourable</option>
            <option value="Unfavourable">Unfavourable</option>
            <option value="Neutral">Neutral</option>
          </select>
          <div
            style={{
              color: "#9ca3af",
              fontSize: 14,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {filtered.length} results
          </div>
        </div>

        {/* TABLE */}
        <div
          style={{
            background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
            borderRadius: 16,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "rgba(15, 23, 42, 0.5)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <th style={headerStyle}>Guest Details</th>
                  <th style={headerStyle}>Comment</th>
                  <th style={{ ...headerStyle, textAlign: "center" }}>Rating</th>
                  <th style={{ ...headerStyle, textAlign: "center" }}>Sentiment</th>
                  <th style={{ ...headerStyle, textAlign: "center" }}>Confidence</th>
                  <th style={headerStyle}>AI Reason</th>
                  <th style={{ ...headerStyle, textAlign: "center" }}>Date</th>
                  <th style={{ ...headerStyle, textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: 48,
                        textAlign: "center",
                        color: "#9ca3af",
                      }}
                    >
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{
                          margin: "0 auto 12px",
                          animation: "spin 1s linear infinite",
                        }}
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 6v6l4 2"></path>
                      </svg>
                      <div>Loading comments...</div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: 48,
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        style={{ margin: "0 auto 16px" }}
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <div style={{ fontSize: 16, fontWeight: 500 }}>
                        No comments found
                      </div>
                      <div style={{ fontSize: 14, marginTop: 8 }}>
                        {query || filterSentiment !== "all" || outletId
                          ? "Try adjusting your filters"
                          : "Add your first comment to get started"}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const s = sentimentStyle(c.sentiment);
                    return (
                      <tr
                        key={c.id}
                        style={{
                          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                          transition: "background 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(15, 23, 42, 0.5)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <td style={cellStyle}>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#f9fafb",
                              marginBottom: 6,
                            }}
                          >
                            {c.guest_name || "—"}
                          </div>
                          {c.phone && (
                            <div style={{ fontSize: 13, color: "#9ca3af" }}>
                              📞 {c.phone}
                            </div>
                          )}
                          {c.email && (
                            <div style={{ fontSize: 13, color: "#9ca3af" }}>
                              ✉️ {c.email}
                            </div>
                          )}
                          {c.address && (
                            <div style={{ fontSize: 13, color: "#9ca3af" }}>
                              📍 {c.address}
                            </div>
                          )}
                        </td>
                        <td style={{ ...cellStyle, maxWidth: 400 }}>
                          <div
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              lineHeight: 1.5,
                              color: "#e5e7eb",
                            }}
                          >
                            {c.comment_text || "—"}
                          </div>
                        </td>
                        <td style={{ ...cellStyle, textAlign: "center" }}>
                          {renderStars(c.rating)}
                        </td>
                        <td style={{ ...cellStyle, textAlign: "center" }}>
                          <span
                            style={{
                              padding: "6px 14px",
                              borderRadius: 8,
                              fontWeight: 600,
                              fontSize: 13,
                              background: s.bg,
                              color: s.color,
                              border: s.border,
                              display: "inline-block",
                            }}
                          >
                            {c.sentiment || "—"}
                          </span>
                        </td>
                        <td style={{ ...cellStyle, textAlign: "center" }}>
                          {c.sentiment_confidence != null ? (
                            <div
                              style={{
                                display: "inline-flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 18,
                                  fontWeight: 700,
                                  color: getConfidenceColor(c.sentiment_confidence),
                                }}
                              >
                                {Math.round(c.sentiment_confidence * 100)}%
                              </div>
                              <div
                                style={{
                                  width: 60,
                                  height: 4,
                                  background: "rgba(255, 255, 255, 0.1)",
                                  borderRadius: 2,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${c.sentiment_confidence * 100}%`,
                                    height: "100%",
                                    background: getConfidenceColor(c.sentiment_confidence),
                                    borderRadius: 2,
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: "#64748b" }}>—</span>
                          )}
                        </td>
                        <td style={{ ...cellStyle, maxWidth: 300 }}>
                          <div
                            style={{
                              fontSize: 13,
                              color: "#9ca3af",
                              fontStyle: "italic",
                              lineHeight: 1.5,
                            }}
                          >
                            {c.sentiment_reason || "—"}
                          </div>
                        </td>
                        <td style={{ ...cellStyle, textAlign: "center" }}>
                          {c.created_at ? (
                            <div style={{ fontSize: 14, color: "#9ca3af" }}>
                              {new Date(c.created_at).toLocaleDateString()}
                            </div>
                          ) : (
                            <span style={{ color: "#64748b" }}>—</span>
                          )}
                        </td>
                        <td style={{ ...cellStyle, textAlign: "center" }}>
                          <button
                            onClick={() => handleDelete(c.id)}
                            style={{
                              padding: "8px 16px",
                              borderRadius: 8,
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              background: "rgba(239, 68, 68, 0.1)",
                              color: "#fca5a5",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              fontFamily: "inherit",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(239, 68, 68, 0.2)";
                              e.currentTarget.style.borderColor =
                                "rgba(239, 68, 68, 0.5)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "rgba(239, 68, 68, 0.1)";
                              e.currentTarget.style.borderColor =
                                "rgba(239, 68, 68, 0.3)";
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  padding: "16px 20px",
  color: "#cbd5e1",
  fontSize: 13,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  textAlign: "left",
};

const cellStyle: React.CSSProperties = {
  padding: "16px 20px",
  fontSize: 14,
};

/* STAT CARD COMPONENT */
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
        borderRadius: 12,
        padding: 20,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#9ca3af",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}