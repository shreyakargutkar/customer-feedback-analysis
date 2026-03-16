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

      // Allow admin and employee
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
    padding: "12px 16px",
    boxSizing: "border-box",
    borderRadius: 10,
    border: isFocused
      ? "2px solid rgba(96, 165, 250, 0.6)"
      : "2px solid rgba(255, 255, 255, 0.1)",
    background: isFocused
      ? "rgba(15, 23, 42, 0.6)"
      : "rgba(15, 23, 42, 0.4)",
    color: "#f9fafb",
    fontSize: 15,
    fontFamily: "inherit",
    transition: "all 0.3s ease",
    outline: "none",
    boxShadow: isFocused
      ? "0 0 0 4px rgba(59, 130, 246, 0.1)"
      : "none",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        padding: "40px 20px",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
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
              Outlets Management
            </h1>
            <p
              style={{
                color: "#9ca3af",
                marginTop: 8,
                fontSize: 16,
                fontWeight: 400,
              }}
            >
              Manage your restaurant outlets and locations
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
              >
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

        {/* STATS CARD */}
        <div
          style={{
            background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
            borderRadius: 16,
            padding: 24,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            marginBottom: 32,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 20px rgba(59, 130, 246, 0.35)",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                color: "#9ca3af",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
              }}
            >
              Total Outlets
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#60a5fa",
                lineHeight: 1,
              }}
            >
              {outlets.length}
            </div>
          </div>
        </div>

        {/* ADD OUTLET FORM */}
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
              letterSpacing: "-0.01em",
            }}
          >
            Add New Outlet
          </h2>

          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
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
                Outlet Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
                placeholder="Enter outlet name (e.g., Downtown Branch)"
                style={getInputStyle(focusedInput)}
                disabled={loading}
              />
            </div>
            <button
              onClick={addOutlet}
              disabled={loading || !name.trim()}
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                border: "none",
                background:
                  loading || !name.trim()
                    ? "rgba(100, 116, 139, 0.5)"
                    : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 600,
                cursor: loading || !name.trim() ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                boxShadow:
                  loading || !name.trim()
                    ? "none"
                    : "0 8px 20px rgba(59, 130, 246, 0.35)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
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
              {loading ? "Adding..." : "Add Outlet"}
            </button>
          </div>
        </div>

        {/* OUTLETS LIST */}
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
              letterSpacing: "-0.01em",
            }}
          >
            All Outlets
          </h2>

          {outlets.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#9ca3af",
              }}
            >
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ margin: "0 auto 20px", opacity: 0.4 }}
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
                No outlets yet
              </p>
              <p style={{ fontSize: 14, opacity: 0.7 }}>
                Add your first outlet using the form above
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {outlets.map((outlet, idx) => (
                <div
                  key={outlet.id}
                  style={{
                    background: "rgba(15, 23, 42, 0.4)",
                    borderRadius: 12,
                    padding: "20px 24px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(15, 23, 42, 0.6)";
                    e.currentTarget.style.borderColor =
                      "rgba(255, 255, 255, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(15, 23, 42, 0.4)";
                    e.currentTarget.style.borderColor =
                      "rgba(255, 255, 255, 0.08)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#ffffff",
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: "#f9fafb",
                          marginBottom: 4,
                        }}
                      >
                        {outlet.outlet_name}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#9ca3af",
                          fontFamily: "monospace",
                        }}
                      >
                        ID: {outlet.id}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteOutlet(outlet.id)}
                    disabled={loading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      background: "rgba(239, 68, 68, 0.15)",
                      color: "#f87171",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
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