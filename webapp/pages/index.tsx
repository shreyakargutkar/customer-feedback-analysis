import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Hover states for CTA buttons
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const [stats, setStats] = useState<{
    total: number;
    topComplaint: string;
    mostMentioned: string;
    mostPositiveOutlet: string;
    loading: boolean;
  } | null>(null);

  // 🔐 EMPLOYEE-ONLY PROTECTION
  useEffect(() => {
    async function protectHome() {
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
      if (!profile || profile.role !== "employee") {
        router.replace("/add-comment");
      } else {
        setIsAuthorized(true);
      }
    }
    protectHome();
    setMounted(true);
  }, [router]);

  useEffect(() => {
    if (!isAuthorized) return;

    async function fetchAndComputeMetrics() {
      try {
        const resComments = await fetch("/api/comments");
        const jsonComments = await resComments.json();
        const commentsData = jsonComments.data || [];

        const resOutlets = await fetch("/api/outlets");
        const jsonOutlets = await resOutlets.json();
        const outletsData = jsonOutlets.data || [];
        const outletMap = new Map<string, string>();
        outletsData.forEach((o: any) => {
          if (o.id && o.outlet_name) {
            outletMap.set(o.id, o.outlet_name);
          }
        });

        if (commentsData.length === 0) {
          setStats({
            total: 0,
            topComplaint: "None",
            mostMentioned: "None",
            mostPositiveOutlet: "None",
            loading: false,
          });
          return;
        }

        const total = commentsData.length;
        const categoryCounts: { [key: string]: number } = {};
        const complaintCounts: { [key: string]: number } = {};

        commentsData.forEach((c: any) => {
          if (c.category) {
            categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
          }
          if (c.aspect_details && Array.isArray(c.aspect_details)) {
            c.aspect_details.forEach((ad: any) => {
              if (ad.aspect) {
                categoryCounts[ad.aspect] = (categoryCounts[ad.aspect] || 0) + 1;
                if (ad.sentiment === "Unfavourable") {
                  complaintCounts[ad.aspect] = (complaintCounts[ad.aspect] || 0) + 1;
                }
              }
            });
          } else {
            if (c.category && c.sentiment === "Unfavourable") {
              complaintCounts[c.category] = (complaintCounts[c.category] || 0) + 1;
            }
          }
        });

        let mostMentioned = "None";
        let maxMentionedCount = 0;
        Object.entries(categoryCounts).forEach(([cat, count]) => {
          if (count > maxMentionedCount) {
            maxMentionedCount = count;
            mostMentioned = cat;
          }
        });

        let topComplaint = "None";
        let maxComplaintCount = 0;
        Object.entries(complaintCounts).forEach(([cat, count]) => {
          if (count > maxComplaintCount) {
            maxComplaintCount = count;
            topComplaint = cat;
          }
        });

        const outletSentiment: { [key: string]: { favourable: number; total: number } } = {};
        commentsData.forEach((c: any) => {
          if (c.outlet_id) {
            if (!outletSentiment[c.outlet_id]) {
              outletSentiment[c.outlet_id] = { favourable: 0, total: 0 };
            }
            outletSentiment[c.outlet_id].total += 1;
            if (c.sentiment === "Favourable") {
              outletSentiment[c.outlet_id].favourable += 1;
            }
          }
        });

        let mostPositiveOutlet = "None";
        let highestRatio = -1;
        Object.entries(outletSentiment).forEach(([outletId, data]) => {
          const ratio = data.favourable / data.total;
          if (ratio > highestRatio && data.total > 0) {
            highestRatio = ratio;
            mostPositiveOutlet = outletMap.get(outletId) || "Unknown Outlet";
          }
        });

        setStats({
          total,
          topComplaint,
          mostMentioned,
          mostPositiveOutlet,
          loading: false,
        });
      } catch (err) {
        console.error("Error computing home metrics:", err);
        setStats({
          total: 0,
          topComplaint: "None",
          mostMentioned: "None",
          mostPositiveOutlet: "None",
          loading: false,
        });
      }
    }

    setStats({
      total: 0,
      topComplaint: "...",
      mostMentioned: "...",
      mostPositiveOutlet: "...",
      loading: true,
    });
    fetchAndComputeMetrics();
  }, [isAuthorized]);

  // Don't render until authorized
  if (!isAuthorized) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 54px)",
        background: "radial-gradient(circle at 50% 0%, #0C2340 0%, #08192E 100%)",
        color: "#F7FAFC",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        padding: "100px 32px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle background glow */}
      <div
        style={{
          position: "absolute",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(165, 201, 255, 0.03) 0%, transparent 70%)",
          top: "-400px",
          right: "-100px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ASYMMETRICAL 2-COLUMN HERO */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 60,
            alignItems: "center",
            marginBottom: 100,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Left Column - Editorial Hero content */}
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                color: "#A5C9FF",
                letterSpacing: "0.12em",
                marginBottom: 16,
              }}
            >
              Customer Intelligence
            </div>
            
            <h1
              style={{
                fontSize: "44px",
                fontWeight: 500,
                marginBottom: 20,
                color: "#F7FAFC",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              Feedback Insights
            </h1>

            <p
              style={{
                fontSize: "16px",
                color: "rgba(255, 255, 255, 0.64)",
                maxWidth: 520,
                marginBottom: 40,
                lineHeight: 1.6,
                fontWeight: 400,
              }}
            >
              An enterprise-grade customer experience intelligence platform. Automated sentiment categorization, negation-aware aspect matching, and explainable AI diagnostic logging.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link
                href="/comments"
                onMouseEnter={() => setHoveredBtn("comments")}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  padding: "10px 22px",
                  borderRadius: "6px",
                  background: hoveredBtn === "comments" ? "#CDE0FF" : "#A5C9FF",
                  color: "#08192E",
                  fontWeight: 500,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "14px",
                  transition: "all 0.15s ease",
                  boxShadow: "0 4px 12px rgba(165, 201, 255, 0.15)",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                View Comments
              </Link>

              <Link
                href="/add-comment"
                onMouseEnter={() => setHoveredBtn("add")}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  padding: "10px 22px",
                  borderRadius: "6px",
                  background: hoveredBtn === "add" ? "rgba(255, 255, 255, 0.05)" : "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#F7FAFC",
                  fontWeight: 500,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "14px",
                  transition: "all 0.15s ease",
                }}
              >
                Submit Feedback
              </Link>

              <Link
                href="/dashboard"
                onMouseEnter={() => setHoveredBtn("dashboard")}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  padding: "10px 22px",
                  borderRadius: "6px",
                  background: hoveredBtn === "dashboard" ? "rgba(255, 255, 255, 0.05)" : "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#F7FAFC",
                  fontWeight: 500,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "14px",
                  transition: "all 0.15s ease",
                }}
              >
                Dashboard
              </Link>
            </div>
          </div>

          {/* Right Column - Floating elevated analytics preview card */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                width: "100%",
                maxWidth: 340,
                background: "rgba(17, 42, 74, 0.4)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: 24,
                padding: 28,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.48)", letterSpacing: "0.08em", textTransform: "uppercase" }}>System Intelligence</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "11px", color: "#A5C9FF", fontWeight: 500 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#A5C9FF", display: "inline-block" }} />
                  Live Stats
                </span>
              </div>

              {stats?.loading ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                  Analyzing metrics...
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: "40px", fontWeight: 300, color: "#F7FAFC", letterSpacing: "-0.02em", lineHeight: 1 }}>
                      {stats?.total ?? 0}
                    </div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
                      Total customer feedbacks analyzed
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                        Most Mentioned Category
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: "#F7FAFC", textTransform: "capitalize" }}>
                        {stats?.mostMentioned || "N/A"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                        Top Complaint Aspect
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: stats?.topComplaint && stats.topComplaint !== "None" ? "#fca5a5" : "#F7FAFC", textTransform: "capitalize" }}>
                        {stats?.topComplaint || "None"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                        Most Positive Outlet
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: "#4ade80" }}>
                        {stats?.mostPositiveOutlet || "N/A"}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* FEATURE CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 36,
          }}
        >
          <FeatureCard
            title="Hybrid Sentiment Analytics"
            desc="Evaluates customer submissions with dual classification structures. Pairs high-fidelity machine learning with negation-aware keyword overrides."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
            }
          />
          <FeatureCard
            title="Aspect-Based Sentiment (ABSA)"
            desc="Extracts clauses, mapping sentiment predictions to specific service benchmarks like Staff Behaviour, Service Speed, and Product Quality."
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}

/* FEATURE CARD COMPONENT */
function FeatureCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        padding: "40px",
        borderRadius: 24,
        background: "rgba(17, 42, 74, 0.3)",
        border: hovered ? "1px solid rgba(165, 201, 255, 0.15)" : "1px solid rgba(255, 255, 255, 0.05)",
        boxShadow: hovered ? "0 20px 40px rgba(0, 0, 0, 0.2)" : "0 10px 30px rgba(0, 0, 0, 0.1)",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        cursor: "default",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "rgba(165, 201, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          border: "1px solid rgba(165, 201, 255, 0.12)",
          color: "#A5C9FF",
        }}
      >
        {icon}
      </div>
      
      <h3
        style={{
          fontSize: "18px",
          fontWeight: 500,
          marginBottom: 12,
          color: "#F7FAFC",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      
      <p
        style={{
          fontSize: "14px",
          color: "rgba(255, 255, 255, 0.6)",
          lineHeight: 1.6,
          margin: 0,
          fontWeight: 400,
        }}
      >
        {desc}
      </p>
    </div>
  );
}