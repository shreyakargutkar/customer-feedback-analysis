// pages/dashboard.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard() {
  const router = useRouter();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [trend, setTrend] = useState<any>({});
  // 🔹 1. NEW STATES FOR OUTLET FILTERING
  const [outlets, setOutlets] = useState<any[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>("");

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
      }
    }

    protectPage();
  }, [router]);

  // 🔹 4. FILTER COMMENTS BY SELECTED OUTLET
  const outletComments = selectedOutlet
    ? comments.filter((c) => c.outlet_id === selectedOutlet)
    : [];

  const stats = {
    total: outletComments.length,
    favourable: outletComments.filter((c) => c.sentiment === "Favourable").length,
    unfavourable: outletComments.filter((c) => c.sentiment === "Unfavourable").length,
    neutral: outletComments.filter((c) => c.sentiment === "Neutral").length,
  };

  async function loadComments() {
    setLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .select("id,created_at,sentiment,comment_text,outlet_id")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      setComments([]);
    } else {
      setComments(data || []);
    }
    setLoading(false);
  }

  async function loadTrend() {
    const res = await fetch("/api/trend");
    const json = await res.json();
    setTrend(json.trend || {});
  }

  // 🔹 2. NEW FUNCTION TO LOAD OUTLETS
  async function loadOutlets() {
    const res = await fetch("/api/outlets");
    const json = await res.json();
    setOutlets(json.data || []);
  }

  // 🔹 3. CALL loadOutlets IN useEffect
  useEffect(() => {
    loadComments();
    loadTrend();
    loadOutlets();
  }, []);

  const pieData = {
    labels: ["Favourable", "Unfavourable", "Neutral"],
    datasets: [
      {
        label: "Sentiment",
        data: [stats.favourable, stats.unfavourable, stats.neutral],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(251, 191, 36, 0.8)",
        ],
        borderColor: [
          "rgba(34, 197, 94, 1)",
          "rgba(239, 68, 68, 1)",
          "rgba(251, 191, 36, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const pieOptions: any = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#e5e7eb",
          font: { size: 13, family: "Inter, sans-serif" },
          padding: 15,
        },
      },
      title: {
        display: true,
        text: "Sentiment Distribution",
        color: "#f9fafb",
        font: { size: 18, weight: "600", family: "Inter, sans-serif" },
        padding: { top: 10, bottom: 20 },
      },
    },
  };

  function lastNDates(n: number) {
    const days: string[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString());
    }
    return days;
  }

  const labels = lastNDates(7);
  const countsMap: Record<string, number> = {};
  labels.forEach((l) => (countsMap[l] = 0));
  outletComments.forEach((c) => {
    if (!c?.created_at) return;
    const d = new Date(c.created_at).toLocaleDateString();
    if (countsMap[d] !== undefined) countsMap[d] += 1;
  });

  const barData = {
    labels,
    datasets: [
      {
        label: "Comments",
        data: labels.map((l) => countsMap[l] ?? 0),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const barOptions: any = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Comments (Last 7 Days)",
        color: "#f9fafb",
        font: { size: 18, weight: "600", family: "Inter, sans-serif" },
        padding: { top: 10, bottom: 20 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: "#9ca3af",
          font: { size: 12 },
        },
        grid: { color: "rgba(75, 85, 99, 0.3)" },
      },
      x: {
        ticks: { color: "#9ca3af", font: { size: 12 } },
        grid: { display: false },
      },
    },
  };

  function detectIssue(text: string) {
    const t = text.toLowerCase();

    if (t.includes("wait") || t.includes("slow") || t.includes("delay"))
      return "Service Speed";

    if (t.includes("staff") || t.includes("rude") || t.includes("behavior"))
      return "Staff Behaviour";

    if (t.includes("food") || t.includes("taste") || t.includes("cold"))
      return "Food Quality";

    if (t.includes("dirty") || t.includes("clean"))
      return "Cleanliness";

    if (t.includes("bill") || t.includes("price") || t.includes("cost"))
      return "Billing / Pricing";

    return "General Service";
  }

  function generateConclusion(comments: any[]) {
    const negative = comments.filter(
      (c) => c.sentiment === "Unfavourable" && c.comment_text
    );

    if (negative.length === 0) {
      return {
        summary:
          "Customers are generally satisfied with this outlet. No major recurring issues were detected.",
        actions: [],
      };
    }

    const issueCount: Record<string, number> = {};

    negative.forEach((c) => {
      const issue = detectIssue(c.comment_text);
      issueCount[issue] = (issueCount[issue] || 0) + 1;
    });

    const sortedIssues = Object.entries(issueCount).sort(
      (a, b) => b[1] - a[1]
    );

    const topIssue = sortedIssues[0][0];

    return {
      summary: `Negative feedback indicates recurring issues related to ${topIssue.toLowerCase()}. Customers appear dissatisfied with this aspect of service at the selected outlet.`,
      actions: [
        `Investigate ${topIssue.toLowerCase()} related complaints.`,
        "Provide corrective training or process improvements.",
        "Monitor customer feedback after improvements are applied.",
      ],
    };
  }

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
              Analytics Dashboard
            </h1>
            <p
              style={{
                color: "#9ca3af",
                marginTop: 8,
                fontSize: 16,
                fontWeight: 400,
              }}
            >
              Real-time insights and sentiment analytics
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link
              href="/comments"
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
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              View Comments
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

        {/* STATS CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
            marginBottom: 32,
          }}
        >
          <StatCard
            label="Total Comments"
            value={loading ? "..." : stats.total}
            color="#60a5fa"
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            }
          />
          <StatCard
            label="Favourable"
            value={loading ? "..." : stats.favourable}
            color="#22c55e"
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
            }
          />
          <StatCard
            label="Unfavourable"
            value={loading ? "..." : stats.unfavourable}
            color="#ef4444"
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
              </svg>
            }
          />
          <StatCard
            label="Neutral"
            value={loading ? "..." : stats.neutral}
            color="#fbbf24"
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="15" x2="16" y2="15"></line>
              </svg>
            }
          />
        </div>

        {/* CHARTS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
              borderRadius: 16,
              padding: 28,
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            }}
          >
            <Pie data={pieData} options={pieOptions} />
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
              borderRadius: 16,
              padding: 28,
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            }}
          >
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* MONTHLY SENTIMENT TREND */}
        <div
          style={{
            background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
            borderRadius: 16,
            padding: 28,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            marginBottom: 32,
          }}
        >
          <h2
            style={{
              color: "#f9fafb",
              marginBottom: 24,
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            Monthly Sentiment Trend
          </h2>

          {Object.keys(trend).length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "#9ca3af",
                padding: "20px 0",
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
              Loading trend data...
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
                    <th style={headerStyle}>Month</th>
                    <th style={{ ...headerStyle, textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#22c55e",
                          }}
                        />
                        Favourable
                      </div>
                    </th>
                    <th style={{ ...headerStyle, textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#ef4444",
                          }}
                        />
                        Unfavourable
                      </div>
                    </th>
                    <th style={{ ...headerStyle, textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#fbbf24",
                          }}
                        />
                        Neutral
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(trend).map((month, idx) => (
                    <tr
                      key={month}
                      style={{
                        borderBottom:
                          idx < Object.keys(trend).length - 1
                            ? "1px solid rgba(255, 255, 255, 0.05)"
                            : "none",
                      }}
                    >
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 500, color: "#f9fafb" }}>
                          {month}
                        </div>
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: "center",
                          color: "#22c55e",
                          fontSize: 16,
                          fontWeight: 600,
                        }}
                      >
                        {trend[month].Favourable || 0}
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: "center",
                          color: "#ef4444",
                          fontSize: 16,
                          fontWeight: 600,
                        }}
                      >
                        {trend[month].Unfavourable || 0}
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: "center",
                          color: "#fbbf24",
                          fontSize: 16,
                          fontWeight: 600,
                        }}
                      >
                        {trend[month].Neutral || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 🔹 6. OUTLET DROPDOWN SELECTOR */}
        <div
          style={{
            background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
            borderRadius: 16,
            padding: 28,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            marginBottom: 32,
          }}
        >
          <label
            style={{
              color: "#cbd5e1",
              fontWeight: 600,
              fontSize: 15,
              display: "block",
              marginBottom: 8,
            }}
          >
            Select Outlet
          </label>
          <select
            value={selectedOutlet}
            onChange={(e) => setSelectedOutlet(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              width: "100%",
              maxWidth: 320,
              background: "rgba(15,23,42,0.6)",
              color: "#f9fafb",
              border: "1px solid rgba(255,255,255,0.2)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <option value="">-- Select Outlet --</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.outlet_name}
              </option>
            ))}
          </select>
        </div>

        {/* SERVICE IMPROVEMENT CONCLUSION - 🔹 5. NOW USES outletComments */}
        {selectedOutlet ? (
          (() => {
            const conclusion = generateConclusion(outletComments);
            return (
              <div
                style={{
                  background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
                  borderRadius: 16,
                  padding: 28,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                }}
              >
                <h2
                  style={{
                    color: "#f9fafb",
                    marginBottom: 16,
                    fontSize: 20,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Service Improvement Conclusion
                </h2>

                <p
                  style={{
                    color: "#e5e7eb",
                    lineHeight: 1.7,
                    fontSize: 15,
                    marginBottom: 16,
                  }}
                >
                  {conclusion.summary}
                </p>

                {conclusion.actions.length > 0 && (
                  <>
                    <h4
                      style={{
                        marginTop: 20,
                        marginBottom: 12,
                        color: "#fbbf24",
                        fontSize: 16,
                        fontWeight: 600,
                      }}
                    >
                      Recommended Actions
                    </h4>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 20,
                        color: "#e5e7eb",
                        lineHeight: 1.8,
                      }}
                    >
                      {conclusion.actions.map((a, i) => (
                        <li key={i} style={{ marginBottom: 8 }}>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            );
          })()
        ) : (
          <div
            style={{
              padding: 24,
              borderRadius: 12,
              background: "rgba(15,23,42,0.6)",
              color: "#9ca3af",
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            Please select an outlet to view service improvement insights.
          </div>
        )}

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
  fontWeight: 500,
};

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
        borderRadius: 12,
        padding: 20,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#9ca3af",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: 600,
          }}
        >
          {label}
        </div>
        <div style={{ color: color, opacity: 0.8 }}>{icon}</div>
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