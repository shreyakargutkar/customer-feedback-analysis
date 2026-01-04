import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

type KeywordRow = {
  id: string;
  keyword: string;
  polarity: string;
  benchmark_id: string | null;
  sub_benchmark_id: string | null;
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

  // 🔐 EMPLOYEE-ONLY PAGE PROTECTION (ONLY ADDITION)
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

      if (!profile || profile.role !== "employee") {
        router.replace("/add-comment");
      }
    }

    protectPage();
  }, [router]);

  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [subBenchmarks, setSubBenchmarks] = useState<SubBenchmark[]>([]);

  const [kw, setKw] = useState("");
  const [polarity, setPolarity] = useState("positive");
  const [selectedBenchmark, setSelectedBenchmark] = useState("");
  const [selectedSubBenchmark, setSelectedSubBenchmark] = useState("");

  const [loading, setLoading] = useState(false);

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
    loadKeywords();
    loadBenchmarks();
  }, []);

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

  const stats = {
    total: keywords.length,
    positive: keywords.filter((k) => k.polarity === "positive").length,
    negative: keywords.filter((k) => k.polarity === "negative").length,
  };

  const unmappedCount = keywords.filter((k) => !k.benchmark_id).length;

  const inputStyle: React.CSSProperties = {
    height: 48,
    padding: "12px 16px",
    borderRadius: 10,
    border: "2px solid rgba(255,255,255,0.08)",
    background: "rgba(15,23,42,0.4)",
    color: "#f9fafb",
    fontSize: 15,
    width: "100%",
  };

  const buttonStyle: React.CSSProperties = {
    height: 48,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#1e293b,#0f172a)",
        padding: 40,
        color: "white",
      }}
    >
      <h1>Keyword Management</h1>
      <p>Define and manage sentiment keywords</p>

      {unmappedCount > 0 && (
        <div
          style={{
            background: "rgba(234,179,8,0.15)",
            border: "1px solid rgba(234,179,8,0.4)",
            padding: "12px 16px",
            borderRadius: 10,
            color: "#fde68a",
            marginBottom: 20,
            fontWeight: 600,
          }}
        >
          ⚠️ {unmappedCount} keywords are NOT linked to benchmarks.  
          These keywords affect sentiment but will NOT show benchmark tags.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 160px 220px 220px 140px",
          gap: 12,
          marginTop: 24,
        }}
      >
        <input
          style={inputStyle}
          placeholder="Keyword"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
        />

        <select
          style={inputStyle}
          value={polarity}
          onChange={(e) => setPolarity(e.target.value)}
        >
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
        </select>

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

        <select
          style={inputStyle}
          value={selectedSubBenchmark}
          onChange={(e) => setSelectedSubBenchmark(e.target.value)}
          disabled={!subBenchmarks.length}
        >
          <option value="">Sub-benchmark (optional)</option>
          {subBenchmarks.map((sb) => (
            <option key={sb.id} value={sb.id}>
              {sb.name}
            </option>
          ))}
        </select>

        <button onClick={addKeyword} disabled={loading} style={buttonStyle}>
          {loading ? "Adding…" : "Add"}
        </button>
      </div>

      <div style={{ marginTop: 40 }}>
        <h3>All Keywords ({stats.total})</h3>
        {keywords.map((k) => (
          <div
            key={k.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 12,
              marginBottom: 8,
              background: "rgba(15,23,42,0.6)",
              borderRadius: 8,
            }}
          >
            <span>
              <b>{k.keyword}</b> ({k.polarity})
            </span>
            <button onClick={() => deleteKeyword(k.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
