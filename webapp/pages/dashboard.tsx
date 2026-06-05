import { useEffect, useState, useMemo } from "react";
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
  const [outlets, setOutlets] = useState<any[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>("");

  // focus & hover states
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

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
      }
    }

    protectPage();
  }, [router]);

  const { outletComments, stats } = useMemo(() => {
    const filtered = selectedOutlet
      ? comments.filter((c) => c.outlet_id === selectedOutlet)
      : [];
    let favourable = 0;
    let unfavourable = 0;
    let neutral = 0;
    for (let i = 0; i < filtered.length; i++) {
      const sentiment = filtered[i].sentiment;
      if (sentiment === "Favourable") favourable++;
      else if (sentiment === "Unfavourable") unfavourable++;
      else if (sentiment === "Neutral") neutral++;
    }
    return {
      outletComments: filtered,
      stats: {
        total: filtered.length,
        favourable,
        unfavourable,
        neutral
      }
    };
  }, [comments, selectedOutlet]);

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

  async function loadOutlets() {
    const res = await fetch("/api/outlets");
    const json = await res.json();
    const data = json.data || [];
    setOutlets(data);
    if (data.length > 0) {
      setSelectedOutlet(data[0].id);
    }
  }

  useEffect(() => {
    loadComments();
    loadTrend();
    loadOutlets();
  }, []);

  const pieData = useMemo(() => ({
    labels: ["Favourable", "Unfavourable", "Neutral"],
    datasets: [
      {
        label: "Sentiment",
        data: [stats.favourable, stats.unfavourable, stats.neutral],
        backgroundColor: [
          "rgba(74, 222, 128, 0.15)",
          "rgba(248, 113, 113, 0.15)",
          "rgba(253, 224, 71, 0.15)",
        ],
        borderColor: [
          "#4ade80",
          "#fca5a5",
          "#fde047",
        ],
        borderWidth: 1.5,
      },
    ],
  }), [stats.favourable, stats.unfavourable, stats.neutral]);

  const barData = useMemo(() => {
    const labels = lastNDates(7);
    const countsMap: Record<string, number> = {};
    for (let i = 0; i < labels.length; i++) {
      countsMap[labels[i]] = 0;
    }
    for (let i = 0; i < outletComments.length; i++) {
      const c = outletComments[i];
      if (!c?.created_at) continue;
      const d = new Date(c.created_at).toLocaleDateString();
      if (countsMap[d] !== undefined) countsMap[d] += 1;
    }
    return {
      labels,
      datasets: [
        {
          label: "Comments",
          data: labels.map((l) => countsMap[l] ?? 0),
          backgroundColor: "rgba(165, 201, 255, 0.15)",
          borderColor: "#A5C9FF",
          borderWidth: 1.5,
          borderRadius: 4,
        },
      ],
    };
  }, [outletComments]);

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
        
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 80,
            flexWrap: "wrap",
            gap: 24,
          }}
        >
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
              Operations Center
            </div>
            <h1
              style={{
                color: "#F7FAFC",
                fontSize: "36px",
                fontWeight: 500,
                margin: 0,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
              }}
            >
              Analytics Dashboard
            </h1>
            <p
              style={{
                color: "rgba(255, 255, 255, 0.6)",
                marginTop: 6,
                fontSize: "14px",
                fontWeight: 400,
              }}
            >
              Real-time insights and aspect-based sentiment analysis mapping.
            </p>
          </div>
          
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {/* OUTLET SELECTOR DROPDOWN */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <select
                value={selectedOutlet}
                onFocus={() => setFocusedField("outlet")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                style={{
                  padding: "9px 12px",
                  borderRadius: 6,
                  background: "rgba(8, 25, 46, 0.4)",
                  color: "#F7FAFC",
                  border: focusedField === "outlet" ? "1px solid #A5C9FF" : "1px solid rgba(255, 255, 255, 0.12)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  outline: "none",
                  boxShadow: focusedField === "outlet" ? "0 0 0 3px rgba(165, 201, 255, 0.2)" : "none",
                  transition: "all 0.15s ease",
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

            <Link
              href="/comments"
              onMouseEnter={() => setHoveredBtn("comments")}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                background: hoveredBtn === "comments" ? "rgba(255, 255, 255, 0.05)" : "transparent",
                color: "#F7FAFC",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                fontWeight: 500,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: "13px",
                transition: "all 0.15s ease",
              }}
            >
              View Comments
            </Link>
          </div>
        </div>

        {/* METRICS TILES (Card-less, spacious text blocks) */}
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
            <div style={{ fontSize: "36px", fontWeight: 300, color: "#F7FAFC", lineHeight: 1 }}>
              {loading ? "..." : stats.total}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.48)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>Total Submissions</div>
          </div>
          <div>
            <div style={{ fontSize: "36px", fontWeight: 300, color: "#4ade80", lineHeight: 1 }}>
              {loading ? "..." : stats.favourable}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.48)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>Favourable</div>
          </div>
          <div>
            <div style={{ fontSize: "36px", fontWeight: 300, color: "#fca5a5", lineHeight: 1 }}>
              {loading ? "..." : stats.unfavourable}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.48)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>Unfavourable</div>
          </div>
          <div>
            <div style={{ fontSize: "36px", fontWeight: 300, color: "#fcd34d", lineHeight: 1 }}>
              {loading ? "..." : stats.neutral}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.48)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>Neutral</div>
          </div>
        </div>

        {/* CHARTS GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: 36,
            marginBottom: 60,
          }}
        >
          <div
            style={{
              background: "rgba(17, 42, 74, 0.2)",
              borderRadius: 24,
              padding: 32,
              border: "1px solid rgba(255, 255, 255, 0.05)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ maxWidth: 280, margin: "0 auto" }}>
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>
          
          <div
            style={{
              background: "rgba(17, 42, 74, 0.2)",
              borderRadius: 24,
              padding: 32,
              border: "1px solid rgba(255, 255, 255, 0.05)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* MONTHLY SENTIMENT TREND */}
        <div
          style={{
            background: "rgba(17, 42, 74, 0.2)",
            borderRadius: 24,
            padding: 36,
            border: "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
            marginBottom: 60,
          }}
        >
          <h2
            style={{
              color: "#F7FAFC",
              marginBottom: 24,
              fontSize: "18px",
              fontWeight: 500,
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
                color: "rgba(255, 255, 255, 0.48)",
                padding: "20px 0",
                fontSize: "13px",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ animation: "spin 1.2s linear infinite" }}
              >
                <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10"></circle>
              </svg>
              Loading trend data...
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
                <thead>
                  <tr>
                    <th style={headerStyle}>Month</th>
                    <th style={{ ...headerStyle, textAlign: "center" }}>Favourable</th>
                    <th style={{ ...headerStyle, textAlign: "center" }}>Unfavourable</th>
                    <th style={{ ...headerStyle, textAlign: "center" }}>Neutral</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(trend).map((month) => (
                    <tr
                      key={month}
                      style={{
                        background: "rgba(8, 25, 46, 0.2)",
                      }}
                    >
                      <td style={{ ...cellStyle, borderTopLeftRadius: "8px", borderBottomLeftRadius: "8px" }}>
                        <div style={{ fontWeight: 500, color: "#F7FAFC" }}>
                          {month}
                        </div>
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: "center",
                          color: "#4ade80",
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                        {trend[month].Favourable || 0}
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: "center",
                          color: "#fca5a5",
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                        {trend[month].Unfavourable || 0}
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: "center",
                          color: "#fcd34d",
                          fontSize: 14,
                          fontWeight: 500,
                          borderTopRightRadius: "8px",
                          borderBottomRightRadius: "8px",
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

        {/* SERVICE IMPROVEMENT & COMPLAINT DIAGNOSTICS */}
        {selectedOutlet && (
          (() => {
            const conclusion = generateConclusion(outletComments);
            const complaintIntel = generateComplaintIntelligence(outletComments);
            return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, alignItems: "start" }}>
                
                {/* Conclusion Card */}
                <div
                  style={{
                    background: "rgba(17, 42, 74, 0.2)",
                    borderRadius: 24,
                    padding: 36,
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <h2
                    style={{
                      color: "#F7FAFC",
                      marginBottom: 16,
                      fontSize: "18px",
                      fontWeight: 500,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Service Improvement Conclusion
                  </h2>

                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.72)",
                      lineHeight: 1.6,
                      fontSize: "14px",
                      marginBottom: 24,
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
                          color: "#A5C9FF",
                          fontSize: "11px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em"
                        }}
                      >
                        Recommended Actions
                      </h4>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: 18,
                          color: "rgba(255, 255, 255, 0.72)",
                          lineHeight: 1.7,
                          fontSize: "13px",
                        }}
                      >
                        {conclusion.actions.map((a, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                {/* Complaint Diagnostics Card */}
                {outletComments.length > 0 && (
                  <div
                    style={{
                      background: "rgba(17, 42, 74, 0.2)",
                      borderRadius: 24,
                      padding: 36,
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                      <h2
                        style={{
                          color: "#F7FAFC",
                          margin: 0,
                          fontSize: "18px",
                          fontWeight: 500,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        Complaint Intelligence (ABSA Diagnostics)
                      </h2>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                      <div style={{ background: "rgba(8, 25, 46, 0.2)", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.03)" }}>
                        <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", fontWeight: 500, letterSpacing: "0.05em", marginBottom: 6 }}>Top Aspect</div>
                        <div style={{ fontSize: "14px", color: "#fca5a5", fontWeight: 600, textTransform: "uppercase" }}>{complaintIntel.topIssue}</div>
                      </div>
                      <div style={{ background: "rgba(8, 25, 46, 0.2)", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.03)" }}>
                        <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", fontWeight: 500, letterSpacing: "0.05em", marginBottom: 6 }}>Complaint Trend</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px", fontWeight: 600, color: complaintIntel.trend === "increasing" ? "#fca5a5" : complaintIntel.trend === "decreasing" ? "#4ade80" : "#fcd34d" }}>
                          <span style={{ textTransform: "uppercase" }}>{complaintIntel.trend}</span>
                        </div>
                      </div>
                    </div>

                    <h4 style={{ color: "#A5C9FF", margin: "0 0 10px 0", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Recurring Aspect Insights</h4>
                    <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(255, 255, 255, 0.72)", lineHeight: 1.7, fontSize: "13px" }}>
                      {complaintIntel.insights.map((insight, idx) => (
                        <li key={idx} style={{ marginBottom: 6 }}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })()
        )}
      </div>
    </div>
  );
}

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
  color: "rgba(255, 255, 255, 0.72)",
  fontSize: "13px",
};

// Static helper functions & constants moved outside React component
const pieOptions: any = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        color: "rgba(255, 255, 255, 0.6)",
        font: { size: 11, family: "'Inter', sans-serif" },
        padding: 12,
      },
    },
    title: {
      display: true,
      text: "Sentiment Share",
      color: "#F7FAFC",
      font: { size: 15, weight: "500", family: "'Inter', sans-serif" },
      padding: { top: 6, bottom: 16 },
    },
  },
};

const barOptions: any = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { display: false },
    title: {
      display: true,
      text: "Submission Volume (Last 7 Days)",
      color: "#F7FAFC",
      font: { size: 15, weight: "500", family: "'Inter', sans-serif" },
      padding: { top: 6, bottom: 16 },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
        color: "rgba(255, 255, 255, 0.48)",
        font: { size: 10, family: "'Inter', sans-serif" },
      },
      grid: { color: "rgba(255, 255, 255, 0.04)" },
    },
    x: {
      ticks: { color: "rgba(255, 255, 255, 0.48)", font: { size: 10, family: "'Inter', sans-serif" } },
      grid: { display: false },
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

function detectIssue(text: string) {
  const t = text.toLowerCase();
  if (t.includes("wait") || t.includes("slow") || t.includes("delay")) return "Service Speed";
  if (t.includes("staff") || t.includes("rude") || t.includes("behavior")) return "Staff Behaviour";
  if (t.includes("food") || t.includes("taste") || t.includes("cold")) return "Food Quality";
  if (t.includes("dirty") || t.includes("clean")) return "Cleanliness";
  if (t.includes("bill") || t.includes("price") || t.includes("cost")) return "Billing / Pricing";
  return "General Service";
}

function generateConclusion(comments: any[]) {
  const negative = comments.filter((c) => c.sentiment === "Unfavourable" && c.comment_text);
  if (negative.length === 0) {
    return {
      summary: "Customers are generally satisfied with this outlet. No major recurring issues were detected.",
      actions: [],
    };
  }

  const issueCount: Record<string, number> = {};
  negative.forEach((c) => {
    const issue = detectIssue(c.comment_text);
    issueCount[issue] = (issueCount[issue] || 0) + 1;
  });

  const sortedIssues = Object.entries(issueCount).sort((a, b) => b[1] - a[1]);
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

function generateComplaintIntelligence(comments: any[]) {
  const negative = comments.filter((c) => c.sentiment === "Unfavourable" && c.comment_text);
  if (negative.length === 0) {
    return {
      topIssue: "None",
      issueFrequency: 0,
      trend: "stable" as const,
      insights: ["No recurring complaints detected. Service standards are high."],
    };
  }

  const issueCount: Record<string, number> = {};
  negative.forEach((c) => {
    const issue = detectIssue(c.comment_text);
    issueCount[issue] = (issueCount[issue] || 0) + 1;
  });

  const sortedIssues = Object.entries(issueCount).sort((a, b) => b[1] - a[1]);
  const topIssue = sortedIssues[0] ? sortedIssues[0][0] : "General Service";
  const issueFrequency = sortedIssues[0] ? sortedIssues[0][1] : 0;

  const half = Math.ceil(negative.length / 2);
  const recentComplaints = negative.slice(0, half).length;
  const olderComplaints = negative.slice(half).length;

  let trend: "increasing" | "decreasing" | "stable" = "stable";
  if (recentComplaints > olderComplaints * 1.1) {
    trend = "increasing";
  } else if (recentComplaints < olderComplaints * 0.9) {
    trend = "decreasing";
  }

  const insights: string[] = [];
  sortedIssues.forEach(([issue, count]) => {
    const percentage = ((count / negative.length) * 100).toFixed(0);
    insights.push(`${issue} accounts for ${percentage}% of all complaints (${count} cases).`);
  });

  return {
    topIssue,
    issueFrequency,
    trend,
    insights,
  };
}