// pages/outlets/index.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

export default function OutletsPage() {
  const router = useRouter();
  const [outlets, setOutlets] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // UI state hooks for highlights
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

  async function loadOutlets() {
    try {
      const res = await fetch("/api/outlets");
      const json = await res.json();
      setOutlets(json.data || []);
    } catch (err) {
      console.error("loadOutlets error", err);
      setOutlets([]);
    }
  }

  useEffect(() => {
    if (isAuthorized) {
      loadOutlets();
    }
  }, [isAuthorized]);

  async function addOutlet() {
    if (!name.trim()) return alert("Enter a name");
    setLoading(true);
    try {
      const res = await fetch("/api/outlets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outlet_name: name.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert("Error adding outlet: " + (json.error || res.statusText));
      } else {
        setName("");
        await loadOutlets();
      }
    } catch (err: any) {
      alert("Unexpected error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteOutlet(id: string) {
    if (!confirm("Delete this outlet?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/outlets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert("Error deleting: " + (json.error || res.statusText));
      } else {
        await loadOutlets();
      }
    } catch (err: any) {
      alert("Unexpected error deleting outlet: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!isAuthorized) {
    return null;
  }

  const getInputStyle = (isFocused: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "12px 14px",
    boxSizing: "border-box",
    borderRadius: 8,
    border: isFocused
      ? "1px solid #A5C9FF"
      : "1px solid rgba(255, 255, 255, 0.12)",
    background: "rgba(8, 25, 46, 0.4)",
    color: "#F7FAFC",
    fontSize: 13,
    fontFamily: "inherit",
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    outline: "none",
    boxShadow: isFocused
      ? "0 0 0 3px rgba(165, 201, 255, 0.2)"
      : "inset 0 1px 2px rgba(0, 0, 0, 0.2)",
  });

  return (
    <div
      style={{
        minHeight: "calc(100vh - 54px)",
        background: "radial-gradient(circle at 50% 0%, #0C2340 0%, #08192E 100%)",
        padding: "80px 32px",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 60,
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
                fontSize: "32px",
                fontWeight: 500,
                margin: 0,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
              }}
            >
              Outlets Management
            </h1>
            <p
              style={{
                color: "rgba(255, 255, 255, 0.6)",
                marginTop: 6,
                fontSize: "14px",
                fontWeight: 400,
              }}
            >
              Configure and audit restaurant branch location identifiers.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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

        {/* METRICS TILE (Card-less, spacious) */}
        <div
          style={{
            marginBottom: 60,
            paddingBottom: 24,
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div style={{ fontSize: "36px", fontWeight: 300, color: "#F7FAFC", lineHeight: 1 }}>
            {outlets.length}
          </div>
          <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.48)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>Registered Outlets</div>
        </div>

        {/* ADD OUTLET FORM */}
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
            Register New Outlet
          </h2>

          <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 11,
                  fontWeight: 500,
                  color: "rgba(255, 255, 255, 0.48)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Outlet Identifier
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
                placeholder="Enter outlet name (e.g. Cafe Branch)"
                style={getInputStyle(focusedInput)}
                disabled={loading}
              />
            </div>
            <button
              onClick={addOutlet}
              disabled={loading || !name.trim()}
              onMouseEnter={() => setHoveredBtn("add")}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                height: 40,
                padding: "0 22px",
                borderRadius: 8,
                border: "none",
                background:
                  loading || !name.trim()
                    ? "rgba(255, 255, 255, 0.05)"
                    : hoveredBtn === "add"
                    ? "#CDE0FF"
                    : "#A5C9FF",
                color: loading || !name.trim() ? "rgba(255,255,255,0.3)" : "#08192E",
                fontSize: 13,
                fontWeight: 500,
                cursor: loading || !name.trim() ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              Add Outlet
            </button>
          </div>
        </div>

        {/* OUTLETS LIST */}
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
            Registered Locations
          </h2>

          {outlets.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
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
                style={{ margin: "0 auto 16px", opacity: 0.4 }}
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <p style={{ fontSize: 15, fontWeight: 500, color: "#F7FAFC", marginBottom: 6 }}>
                No outlets found
              </p>
              <p style={{ fontSize: 13, opacity: 0.8 }}>
                Use the form above to register one.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {outlets.map((outlet, idx) => (
                <div
                  key={outlet.id}
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
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "rgba(255, 255, 255, 0.4)",
                      }}
                    >
                      {(idx + 1).toString().padStart(2, "0")}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#F7FAFC",
                          marginBottom: 4,
                        }}
                      >
                        {outlet.outlet_name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(255, 255, 255, 0.4)",
                          fontFamily: "monospace",
                        }}
                      >
                        UUID: {outlet.id}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteOutlet(outlet.id)}
                    onMouseEnter={() => setHoveredDeleteId(outlet.id)}
                    onMouseLeave={() => setHoveredDeleteId(null)}
                    disabled={loading}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      background: hoveredDeleteId === outlet.id ? "rgba(255, 139, 139, 0.12)" : "transparent",
                      color: "#FF8B8B",
                      border: hoveredDeleteId === outlet.id ? "1px solid rgba(255, 139, 139, 0.4)" : "1px solid rgba(255, 139, 139, 0.2)",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "all 0.15s ease",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
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