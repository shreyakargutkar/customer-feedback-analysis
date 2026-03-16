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

  const inputStyle: React.CSSProperties = {
    padding: "12px 16px",
    borderRadius: 10,
    border: "2px solid rgba(255,255,255,0.1)",
    background: "rgba(15,23,42,0.4)",
    color: "#f9fafb",
    fontSize: 15,
    width: "100%",
    outline: "none",
    transition: "all 0.3s ease",
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
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
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
              Keywords Management
            </h1>
            <p
              style={{
                color: "#9ca3af",
                marginTop: 8,
                fontSize: 16,
                fontWeight: 400,
              }}
            >
              Define and manage sentiment keywords
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
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Dashboard
            </Link>
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
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Comments
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
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <StatCard label="Total Keywords" value={stats.total} color="#60a5fa" />
          <StatCard label="Positive" value={stats.positive} color="#22c55e" />
          <StatCard label="Negative" value={stats.negative} color="#ef4444" />
        </div>

        {/* UNMAPPED WARNING */}
        {unmappedCount > 0 && (
          <div
            style={{
              background: "rgba(234, 179, 8, 0.15)",
              border: "1px solid rgba(234, 179, 8, 0.4)",
              padding: "16px 20px",
              borderRadius: 12,
              color: "#fde68a",
              marginBottom: 32,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
            <div>
              <strong>{unmappedCount} keywords</strong> are NOT linked to benchmarks.
              These keywords affect sentiment but will NOT show benchmark tags.
            </div>
          </div>
        )}

        {/* ADD KEYWORD FORM */}
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
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            Add New Keyword
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1.5fr 1.5fr auto",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <label style={labelStyle}>Keyword</label>
              <input
                style={inputStyle}
                placeholder="e.g., excellent, poor"
                value={kw}
                onChange={(e) => setKw(e.target.value)}
              />
            </div>

            <div>
              <label style={labelStyle}>Polarity</label>
              <select style={inputStyle} value={polarity} onChange={(e) => setPolarity(e.target.value)}>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Benchmark</label>
              <select
                style={inputStyle}
                value={selectedBenchmark}
                onChange={(e) => setSelectedBenchmark(e.target.value)}
              >
                <option value="">Select Benchmark</option>
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
                style={inputStyle}
                value={selectedSubBenchmark}
                onChange={(e) => setSelectedSubBenchmark(e.target.value)}
                disabled={!subBenchmarks.length}
              >
                <option value="">Optional</option>
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
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                border: "none",
                background:
                  loading || !kw.trim() || !selectedBenchmark
                    ? "rgba(100, 116, 139, 0.5)"
                    : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 600,
                cursor: loading || !kw.trim() || !selectedBenchmark ? "not-allowed" : "pointer",
                boxShadow:
                  loading || !kw.trim() || !selectedBenchmark
                    ? "none"
                    : "0 8px 20px rgba(59, 130, 246, 0.35)",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
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
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
            <div>
              <label style={labelStyle}>Search Keywords</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by keyword..."
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Filter by Polarity</label>
              <select
                value={filterPolarity}
                onChange={(e) => setFilterPolarity(e.target.value)}
                style={inputStyle}
              >
                <option value="all">All Polarities</option>
                <option value="positive">Positive Only</option>
                <option value="negative">Negative Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* KEYWORDS LIST */}
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
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            All Keywords ({filteredKeywords.length})
          </h2>

          {filteredKeywords.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
              <p style={{ fontSize: 16 }}>No keywords found</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredKeywords.map((k) => (
                <div
                  key={k.id}
                  style={{
                    background: "rgba(15, 23, 42, 0.4)",
                    borderRadius: 12,
                    padding: "16px 20px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 600,
                        color: "#f9fafb",
                        minWidth: 150,
                      }}
                    >
                      {k.keyword}
                    </div>
                    <PolarityBadge polarity={k.polarity} />
                    {k.benchmark_id ? (
                      <div
                        style={{
                          fontSize: 13,
                          color: "#9ca3af",
                          padding: "4px 10px",
                          background: "rgba(59, 130, 246, 0.15)",
                          borderRadius: 6,
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                        }}
                      >
                        Mapped to benchmark
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: 13,
                          color: "#fbbf24",
                          padding: "4px 10px",
                          background: "rgba(251, 191, 36, 0.15)",
                          borderRadius: 6,
                          border: "1px solid rgba(251, 191, 36, 0.3)",
                        }}
                      >
                        No benchmark
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => deleteKeyword(k.id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      background: "rgba(239, 68, 68, 0.15)",
                      color: "#f87171",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
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
  fontSize: 13,
  fontWeight: 600,
  color: "#cbd5e1",
  letterSpacing: "0.02em",
  textTransform: "uppercase",
};

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
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
      <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function PolarityBadge({ polarity }: { polarity: string }) {
  const isPositive = polarity === "positive";
  return (
    <div
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: 6,
        background: isPositive ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
        color: isPositive ? "#22c55e" : "#ef4444",
        fontSize: 12,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {polarity}
    </div>
  );
}