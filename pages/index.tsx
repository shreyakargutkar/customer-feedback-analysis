import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

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

  // Don't render until authorized
  if (!isAuthorized) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        color: "#e5e7eb",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        padding: "40px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background elements */}
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
          top: "-300px",
          right: "-200px",
          animation: "float 20s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)",
          bottom: "-150px",
          left: "-100px",
          animation: "float 15s ease-in-out infinite reverse",
          pointerEvents: "none",
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
        {/* HEADER */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 64,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Logo/Icon */}
          <div
            style={{
              width: 80,
              height: 80,
              margin: "0 auto 24px",
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "0 20px 40px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
              animation: "fadeInScale 1s ease-out",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <line x1="9" y1="10" x2="15" y2="10"></line>
              <line x1="12" y1="7" x2="12" y2="13"></line>
            </svg>
          </div>

          <h1
            style={{
              fontSize: 48,
              fontWeight: 800,
              marginBottom: 16,
              color: "#f9fafb",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
            }}
          >
            Customer Feedback Analysis
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Intelligence System
            </span>
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "#9ca3af",
              maxWidth: 700,
              margin: "0 auto 40px",
              lineHeight: 1.7,
            }}
          >
            An intelligent web-based platform that collects customer feedback,
            performs sentiment analysis, detects keywords, and automatically
            categorizes feedback into service benchmarks for actionable
            insights.
          </p>

          {/* ACTION BUTTONS */}
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Link
              href="/comments"
              style={{
                padding: "14px 28px",
                borderRadius: 12,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#e5e7eb",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                fontSize: 15,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.borderColor =
                  "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor =
                  "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <svg
                width="18"
                height="18"
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
                padding: "14px 28px",
                borderRadius: 12,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#e5e7eb",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                fontSize: 15,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.borderColor =
                  "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor =
                  "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <svg
                width="18"
                height="18"
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
              Add New Comment
            </Link>
            <Link
              href="/dashboard"
              style={{
                padding: "14px 28px",
                borderRadius: 12,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#e5e7eb",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                fontSize: 15,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.borderColor =
                  "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor =
                  "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <svg
                width="18"
                height="18"
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
          </div>
        </div>

        {/* FEATURES */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          <FeatureCard
            title="Sentiment Analysis"
            desc="Automatically classifies customer comments as favourable or unfavourable using advanced keyword and rating logic."
            icon={
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
            }
            delay={0}
            mounted={mounted}
          />
          <FeatureCard
            title="Keyword Detection"
            desc="Identifies important positive and negative keywords from feedback to understand customer emotions and pain points."
            icon={
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            }
            delay={100}
            mounted={mounted}
          />
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

/* FEATURE CARD COMPONENT */
function FeatureCard({
  title,
  desc,
  icon,
  delay,
  mounted,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  delay: number;
  mounted: boolean;
}) {
  return (
    <div
      style={{
        padding: 32,
        borderRadius: 16,
        background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
        transition: "all 0.3s ease",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${delay}ms`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.4)";
        e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.3)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: "rgba(59, 130, 246, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          border: "1px solid rgba(59, 130, 246, 0.3)",
          color: "#60a5fa",
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 12,
          color: "#f9fafb",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 15,
          color: "#9ca3af",
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        {desc}
      </p>
    </div>
  );
}

/* STAT ITEM COMPONENT */
function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 800,
          color: "#60a5fa",
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
    </div>
  );
}