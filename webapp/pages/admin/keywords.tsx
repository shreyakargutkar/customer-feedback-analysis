// pages/keywords/index.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

type KeywordRow = {
  id: string;
  keyword: string;
  polarity: string;
  benchmark_id: string | null;
  sub_benchmark_id: string | null;
  benchmark_name?: string;
  sub_benchmark_name?: string;
};

type Benchmark = {
  id: string;
  name: string;
};

type SubBenchmark = {
  id: string;
  name: string;
};

export default function KeywordsPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [subBenchmarks, setSubBenchmarks] = useState<SubBenchmark[]>([]);
  const [kw, setKw] = useState("");
  const [polarity, setPolarity] = useState("positive");
  const [selectedBenchmark, setSelectedBenchmark] = useState("");
  const [selectedSubBenchmark, setSelectedSubBenchmark] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPolarity, setFilterPolarity] = useState("all");

  // Hover & focus states for styling
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [hoveredDeleteId, setHoveredDeleteId] = useState<string | null>(null);

  // 🔐 PAGE PROTECTION
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

      if (!profile || (profile.role !== "admin" && profile.role !== "employee")) {
        router.replace("/add-comment");
      } else {
        setIsAuthorized(true);
      }
    }
    protectPage();
  }, [router]);

  async function loadKeywords() {
    const { data } = await supabase
      .from("keywords")
      .select("*")
      .order("created_at", { ascending: false });
    setKeywords(data || []);
  }

  async function loadBenchmarks() {
    const res = await fetch("/api/benchmarks");
    const json = await res.json();
    setBenchmarks(json.data || []);
  }

  async function loadSubBenchmarks(benchmarkId: string) {
    if (!benchmarkId) {
      setSubBenchmarks([]);
      return;
    }
    const res = await fetch(`/api/sub-benchmarks?benchmark_id=${benchmarkId}`);
    const json = await res.json();
    setSubBenchmarks(json.data || []);
  }

  useEffect(() => {
    if (isAuthorized) {
      loadKeywords();
      loadBenchmarks();
    }
  }, [isAuthorized]);

  useEffect(() => {
    loadSubBenchmarks(selectedBenchmark);
    setSelectedSubBenchmark("");
  }, [selectedBenchmark]);

  async function addKeyword() {
    if (!kw.trim() || !selectedBenchmark) {
      alert("Keyword and Benchmark are required");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: kw.trim(),
        polarity,
        benchmark_id: selectedBenchmark,
        sub_benchmark_id: selectedSubBenchmark || null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setKw("");
      setSelectedBenchmark("");
      setSelectedSubBenchmark("");
      loadKeywords();
    } else {
      const j = await res.json();
      alert(j.error || "Failed to add keyword");
    }
  }

  async function deleteKeyword(id: string) {
    if (!confirm("Delete this keyword?")) return;
    await fetch(`/api/keywords?id=${id}`, { method: "DELETE" });
    loadKeywords();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!isAuthorized) return null;

  // Filter keywords
  const filteredKeywords = keywords.filter((k) => {
    const matchesSearch =
      searchQuery === "" ||
      k.keyword.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPolarity =
      filterPolarity === "all" || k.polarity === filterPolarity;
    return matchesSearch && matchesPolarity;
  });

  const stats = {
    total: keywords.length,
    positive: keywords.filter((k) => k.polarity === "positive").length,
    negative: keywords.filter((k) => k.polarity === "negative").length,
  };

  const unmappedCount = keywords.filter((k) => !k.benchmark_id).length;

  const getInputStyle = (fieldName: string): React.CSSProperties => {
    const isFocused = focusedField === fieldName;
    return {
      padding: "10px 12px",
      borderRadius: 8,
      border: isFocused ? "1px solid #A5C9FF" : "1px solid rgba(255, 255, 255, 0.12)",
      background: "rgba(8, 25, 46, 0.4)",
      color: "#F7FAFC",
      fontSize: 13,
      width: "100%",
      boxSizing: "border-box",
      outline: "none",
      boxShadow: isFocused ? "0 0 0 3px rgba(165, 201, 255, 0.2)" : "inset 0 1px 2px rgba(0,0,0,0.2)",
      transition: "all 0.15s ease",
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
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 60,
            flexWrap: "wrap",
            gap: 20,
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
                fontSize: "32px",
                fontWeight: 500,
                margin: 0,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
              }}
            >
              Keywords Management
            </h1>
            <p
              style={{
                color: "rgba(255, 255, 255, 0.6)",
                marginTop: 6,
                fontSize: "14px",
                fontWeight: 400,
              }}
            >
              Define and manage sentiment keywords mapped to service benchmarks.
            </p>
          </div>
          
          <div style={{ display: "flex", gap: 12 }}>
            <Link
              href="/dashboard"
              onMouseEnter={() => setHoveredBtn("dashboard")}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                background: hoveredBtn === "dashboard" ? "rgba(255, 255, 255, 0.05)" : "transparent",
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
              Dashboard
            </Link>
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
              Comments
            </Link>
            <button
              onClick={handleLogout}
              onMouseEnter={() => setHoveredBtn("logout")}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                background: hoveredBtn === "logout" ? "rgba(255, 139, 139, 0.08)" : "transparent",
                color: "#FF8B8B",
                border: "1px solid rgba(255, 139, 139, 0.2)",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* METRICS TILES (Card-less text-only widgets with high whitespace) */}
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
            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.48)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>Total Keywords</div>
          </div>
          <div>
            <div style={{ fontSize: "36px", fontWeight: 300, color: "#4ade80", lineHeight: 1 }}>{stats.positive}</div>
            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.48)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>Positive Indicators</div>
          </div>
          <div>
            <div style={{ fontSize: "36px", fontWeight: 300, color: "#fca5a5", lineHeight: 1 }}>{stats.negative}</div>
            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.48)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>Negative Indicators</div>
          </div>
        </div>

        {/* UNMAPPED WARNING */}
        {unmappedCount > 0 && (
          <div
            style={{
              background: "rgba(234, 179, 8, 0.08)",
              border: "1px solid rgba(234, 179, 8, 0.2)",
              padding: "14px 18px",
              borderRadius: 12,
              color: "#fde68a",
              marginBottom: 36,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div>
              <strong>{unmappedCount} keyword{unmappedCount > 1 ? "s" : ""}</strong> not linked to a service benchmark. Negations and patterns will still trigger sentiment changes, but category mapping tags won't populate.
            </div>
          </div>
        )}

        {/* ADD KEYWORD FORM */}
        <div
          style={{
            background: "rgba(17, 42, 74, 0.2)",
            borderRadius: 20,
            padding: 32,
            border: "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
            marginBottom: 40,
          }}
        >
          <h2
            style={{
              color: "#F7FAFC",
              fontSize: "16px",
              fontWeight: 500,
              marginBottom: 20,
              letterSpacing: "-0.01em",
            }}
          >
            Register Sentiment Keyword
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.8fr 1.2fr 1.8fr 1.8fr auto",
              gap: 16,
              alignItems: "end",
            }}
          >
            <div>
              <label style={labelStyle}>Keyword / Token</label>
              <input
                style={getInputStyle("kw")}
                onFocus={() => setFocusedField("kw")}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. excellent, slow"
                value={kw}
                onChange={(e) => setKw(e.target.value)}
              />
            </div>

            <div>
              <label style={labelStyle}>Polarity</label>
              <select
                style={getInputStyle("polarity")}
                onFocus={() => setFocusedField("polarity")}
                onBlur={() => setFocusedField(null)}
                value={polarity}
                onChange={(e) => setPolarity(e.target.value)}
              >
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Benchmark Target</label>
              <select
                style={getInputStyle("benchmark")}
                onFocus={() => setFocusedField("benchmark")}
                onBlur={() => setFocusedField(null)}
                value={selectedBenchmark}
                onChange={(e) => setSelectedBenchmark(e.target.value)}
              >
                <option value="">Select Category...</option>
                {benchmarks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Sub-benchmark</label>
              <select
                style={getInputStyle("subBenchmark")}
                onFocus={() => setFocusedField("subBenchmark")}
                onBlur={() => setFocusedField(null)}
                value={selectedSubBenchmark}
                onChange={(e) => setSelectedSubBenchmark(e.target.value)}
                disabled={!subBenchmarks.length}
              >
                <option value="">Optional sub-tag</option>
                {subBenchmarks.map((sb) => (
                  <option key={sb.id} value={sb.id}>
                    {sb.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={addKeyword}
              disabled={loading || !kw.trim() || !selectedBenchmark}
              onMouseEnter={() => setHoveredBtn("add")}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                height: 40,
                padding: "0 22px",
                borderRadius: 8,
                border: "none",
                background:
                  loading || !kw.trim() || !selectedBenchmark
                    ? "rgba(255, 255, 255, 0.05)"
                    : hoveredBtn === "add"
                    ? "#CDE0FF"
                    : "#A5C9FF",
                color: loading || !kw.trim() || !selectedBenchmark ? "rgba(255,255,255,0.3)" : "#08192E",
                fontSize: 13,
                fontWeight: 500,
                cursor: loading || !kw.trim() || !selectedBenchmark ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              Add Keyword
            </button>
          </div>
        </div>

        {/* FILTERS & SEARCH */}
        <div
          style={{
            background: "rgba(17, 42, 74, 0.2)",
            borderRadius: 20,
            padding: "24px 32px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Search Keywords</label>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setFocusedField("search")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type keyword name to filter list..."
                style={getInputStyle("search")}
              />
            </div>
            <div>
              <label style={labelStyle}>Filter Polarity</label>
              <select
                value={filterPolarity}
                onFocus={() => setFocusedField("filterPolarity")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setFilterPolarity(e.target.value)}
                style={getInputStyle("filterPolarity")}
              >
                <option value="all">All Keywords</option>
                <option value="positive">Positive Indicators Only</option>
                <option value="negative">Negative Indicators Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* KEYWORDS LIST CONTAINER */}
        <div
          style={{
            background: "rgba(17, 42, 74, 0.2)",
            borderRadius: 24,
            padding: 32,
            border: "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
          }}
        >
          <h2
            style={{
              color: "#F7FAFC",
              fontSize: "16px",
              fontWeight: 500,
              marginBottom: 24,
              letterSpacing: "-0.01em",
            }}
          >
            Registered Keywords ({filteredKeywords.length})
          </h2>

          {filteredKeywords.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.4)" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12, opacity: 0.5 }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <p style={{ fontSize: 15, margin: 0, fontWeight: 500, color: "#F7FAFC" }}>No matching keywords registered.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredKeywords.map((k) => (
                <div
                  key={k.id}
                  style={{
                    background: "rgba(8, 25, 46, 0.2)",
                    borderRadius: 12,
                    padding: "16px 24px",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#F7FAFC",
                        minWidth: 160,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {k.keyword}
                    </div>
                    <PolarityBadge polarity={k.polarity} />
                    {k.benchmark_id ? (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#A5C9FF",
                          padding: "4px 10px",
                          background: "rgba(165, 201, 255, 0.08)",
                          borderRadius: 6,
                          border: "1px solid rgba(165, 201, 255, 0.15)",
                          fontWeight: 500,
                        }}
                      >
                        Mapped Category
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#fde047",
                          padding: "4px 10px",
                          background: "rgba(253, 224, 71, 0.08)",
                          borderRadius: 6,
                          border: "1px solid rgba(253, 224, 71, 0.15)",
                          fontWeight: 500,
                        }}
                      >
                        No Benchmark
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => deleteKeyword(k.id)}
                    onMouseEnter={() => setHoveredDeleteId(k.id)}
                    onMouseLeave={() => setHoveredDeleteId(null)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      background: hoveredDeleteId === k.id ? "rgba(255, 139, 139, 0.12)" : "transparent",
                      color: "#FF8B8B",
                      border: hoveredDeleteId === k.id ? "1px solid rgba(255, 139, 139, 0.4)" : "1px solid rgba(255, 139, 139, 0.2)",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 8,
  fontSize: 11,
  fontWeight: 500,
  color: "rgba(255, 255, 255, 0.48)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

function PolarityBadge({ polarity }: { polarity: string }) {
  const isPositive = polarity === "positive";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: 6,
        background: isPositive ? "rgba(74, 222, 128, 0.08)" : "rgba(248, 113, 113, 0.08)",
        color: isPositive ? "#4ade80" : "#fca5a5",
        fontSize: "10px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        border: isPositive ? "1px solid rgba(74, 222, 128, 0.15)" : "1px solid rgba(248, 113, 113, 0.15)",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: isPositive ? "#22c55e" : "#ef4444",
          marginRight: 6,
          display: "inline-block",
        }}
      />
      {polarity}
    </div>
  );
}