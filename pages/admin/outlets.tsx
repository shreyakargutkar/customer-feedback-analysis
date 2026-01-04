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

  if (!isAuthorized) {
    return null;
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
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
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
              Outlet Management
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

        {/* STATS CARD */}
        <div
          style={{
            background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
            borderRadius: 12,
            padding: 20,
            marginBottom: 32,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 12,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Total Outlets
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#60a5fa",
                lineHeight: 1,
              }}
            >
              {outlets.length}
            </div>
          </div>
        </div>

        {/* ADD NEW OUTLET CARD */}
        <div
          style={{
            background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#f9fafb",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <svg
              width="20"
              height="20"
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
            Add New Outlet
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <label
                style={{
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
                placeholder="e.g., Downtown Branch, Airport Location"
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  border: focusedInput
                    ? "2px solid rgba(96, 165, 250, 0.6)"
                    : "2px solid rgba(255, 255, 255, 0.08)",
                  background: focusedInput
                    ? "rgba(15, 23, 42, 0.6)"
                    : "rgba(15, 23, 42, 0.4)",
                  color: "#f9fafb",
                  fontSize: 15,
                  fontFamily: "inherit",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                  boxShadow: focusedInput
                    ? "0 0 0 4px rgba(59, 130, 246, 0.1)"
                    : "none",
                }}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
                onKeyPress={(e) => e.key === "Enter" && addOutlet()}
              />
            </div>

            <button
              onClick={addOutlet}
              disabled={loading}
              style={{
                padding: "14px 28px",
                borderRadius: 10,
                border: "none",
                background: loading
                  ? "linear-gradient(135deg, #64748b 0%, #475569 100%)"
                  : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: loading
                  ? "none"
                  : "0 4px 12px rgba(59, 130, 246, 0.3)",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                alignSelf: "flex-end",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 16px rgba(59, 130, 246, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = loading
                  ? "none"
                  : "0 4px 12px rgba(59, 130, 246, 0.3)";
              }}
            >
              {loading ? "Adding..." : "Add Outlet"}
            </button>
          </div>
        </div>

        {/* OUTLETS LIST */}
        <div
          style={{
            background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
            borderRadius: 16,
            padding: 32,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#f9fafb",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
            All Outlets ({outlets.length})
          </div>

          {outlets.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 20px",
                color: "#64748b",
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ margin: "0 auto 16px" }}
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>
                No outlets yet
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 14 }}>
                Add your first outlet to get started
              </p>
            </div>
          ) : (
            <div>
              {outlets.map((outlet) => (
                <div
                  key={outlet.id}
                  style={{
                    background: "rgba(15, 23, 42, 0.5)",
                    borderRadius: 10,
                    padding: "18px 20px",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(15, 23, 42, 0.7)";
                    e.currentTarget.style.borderColor =
                      "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(15, 23, 42, 0.5)";
                    e.currentTarget.style.borderColor =
                      "rgba(255, 255, 255, 0.05)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background:
                          "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#60a5fa"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                    </div>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#f9fafb",
                      }}
                    >
                      {outlet.outlet_name}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteOutlet(outlet.id)}
                    disabled={loading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#fca5a5",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.background =
                          "rgba(239, 68, 68, 0.2)";
                        e.currentTarget.style.borderColor =
                          "rgba(239, 68, 68, 0.5)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(239, 68, 68, 0.1)";
                      e.currentTarget.style.borderColor =
                        "rgba(239, 68, 68, 0.3)";
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