// pages/comments.tsx
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
  outlet_name?: string;
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
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      // Allow both admin and employee
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
      loadComments();
    }
  }, [isAuthorized, outletId]);

  if (!isAuthorized) return null;

  // Filter comments based on search query and sentiment
  const filteredComments = comments.filter((c) => {
    const matchesQuery =
      query === "" ||
      c.guest_name?.toLowerCase().includes(query.toLowerCase()) ||
      c.comment_text?.toLowerCase().includes(query.toLowerCase()) ||
      c.email?.toLowerCase().includes(query.toLowerCase()) ||
      c.phone?.includes(query);

    const matchesSentiment =
      filterSentiment === "all" || c.sentiment === filterSentiment;

    return matchesQuery && matchesSentiment;
  });

  const stats = {
    total: filteredComments.length,
    favourable: filteredComments.filter((c) => c.sentiment === "Favourable")
      .length,
    unfavourable: filteredComments.filter(
      (c) => c.sentiment === "Unfavourable"
    ).length,
    neutral: filteredComments.filter((c) => c.sentiment === "Neutral").length,
  };

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
              Comments Management
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
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Comment
            </Link>
            <button
              onClick={handleLogout}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                background: "rgba(239, 68, 68, 0.1)",
                color: "#f87171",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                cursor: "pointer",
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
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
            marginBottom: 32,
          }}
        >
          <StatCard label="Total" value={stats.total} color="#60a5fa" />
          <StatCard
            label="Favourable"
            value={stats.favourable}
            color="#22c55e"
          />
          <StatCard
            label="Unfavourable"
            value={stats.unfavourable}
            color="#ef4444"
          />
          <StatCard label="Neutral" value={stats.neutral} color="#fbbf24" />
        </div>

        {/* FILTERS */}
        <div
          style={{
            background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
            borderRadius: 16,
            padding: 24,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 20,
            }}
          >
            {/* Search */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#cbd5e1",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}
              >
                Search
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email, phone..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(15,23,42,0.6)",
                  color: "#f9fafb",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            {/* Outlet Filter */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#cbd5e1",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}
              >
                Outlet
              </label>
              <select
                value={outletId}
                onChange={(e) => setOutletId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(15,23,42,0.6)",
                  color: "#f9fafb",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontSize: 14,
                  cursor: "pointer",
                }}
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
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#cbd5e1",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}
              >
                Sentiment
              </label>
              <select
                value={filterSentiment}
                onChange={(e) => setFilterSentiment(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(15,23,42,0.6)",
                  color: "#f9fafb",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <option value="all">All Sentiments</option>
                <option value="Favourable">Favourable</option>
                <option value="Unfavourable">Unfavourable</option>
                <option value="Neutral">Neutral</option>
              </select>
            </div>
          </div>
        </div>

        {/* COMMENTS TABLE */}
        <div
          style={{
            background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
            borderRadius: 16,
            padding: 28,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                color: "#9ca3af",
                padding: "40px 0",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ animation: "spin 1s linear infinite" }}
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
              Loading comments...
            </div>
          ) : filteredComments.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "#9ca3af",
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ margin: "0 auto 16px", opacity: 0.5 }}
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <p style={{ fontSize: 16, fontWeight: 500 }}>No comments found</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <th style={headerStyle}>Date</th>
                    <th style={headerStyle}>Guest</th>
                    <th style={headerStyle}>Contact</th>
                    <th style={headerStyle}>Comment</th>
                    <th style={headerStyle}>Sentiment</th>
                    <th style={headerStyle}>Rating</th>
                    <th style={headerStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComments.map((comment, idx) => (
                    <tr
                      key={comment.id}
                      style={{
                        borderBottom:
                          idx < filteredComments.length - 1
                            ? "1px solid rgba(255, 255, 255, 0.05)"
                            : "none",
                      }}
                    >
                      <td style={cellStyle}>
                        {comment.created_at
                          ? new Date(comment.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 500, color: "#f9fafb" }}>
                          {comment.guest_name || "—"}
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ fontSize: 13 }}>
                          {comment.email && (
                            <div style={{ marginBottom: 4 }}>
                              {comment.email}
                            </div>
                          )}
                          {comment.phone && <div>{comment.phone}</div>}
                          {!comment.email && !comment.phone && "—"}
                        </div>
                      </td>
                      <td style={{ ...cellStyle, maxWidth: 300 }}>
                        <div
                          style={{
                            fontSize: 14,
                            lineHeight: 1.5,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
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
                            padding: "4px 10px",
                            borderRadius: 6,
                            background: "rgba(251, 191, 36, 0.15)",
                            color: "#fbbf24",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                          {comment.rating || "—"}
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#f87171",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
  padding: "12px 16px",
  textAlign: "left",
  color: "#cbd5e1",
  fontSize: 13,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const cellStyle: React.CSSProperties = {
  padding: "16px",
  color: "#e5e7eb",
  fontSize: 14,
};

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

function SentimentBadge({
  sentiment,
}: {
  sentiment?: "Favourable" | "Unfavourable" | "Neutral";
}) {
  const colors = {
    Favourable: { bg: "rgba(34, 197, 94, 0.15)", text: "#22c55e" },
    Unfavourable: { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444" },
    Neutral: { bg: "rgba(251, 191, 36, 0.15)", text: "#fbbf24" },
  };

  const color = sentiment ? colors[sentiment] : colors.Neutral;

  return (
    <div
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: 6,
        background: color.bg,
        color: color.text,
        fontSize: 12,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {sentiment || "—"}
    </div>
  );
}