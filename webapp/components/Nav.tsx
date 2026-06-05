// components/Nav.tsx
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Nav() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  function safeNavigate(href: string) {
    if (!href) return;
    const normalize = (p: string) => (p ? p.replace(/\/+$/, "") : "/");
    if (normalize(router.asPath) === normalize(href)) {
      return;
    }
    router.push(href);
  }

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      setLoggedIn(!!data?.user);
    }

    checkAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setLoggedIn(false);
    router.replace("/add-comment");
  }

  const getLinkStyle = (path: string): React.CSSProperties => {
    const normalize = (p: string) => (p ? p.replace(/\/+$/, "") : "/");
    const active = normalize(router.pathname) === normalize(path);
    const isHovered = hoveredLink === path;

    return {
      color: active ? "#A5C9FF" : isHovered ? "#F7FAFC" : "rgba(255, 255, 255, 0.6)",
      cursor: "pointer",
      padding: "6px 12px",
      fontWeight: 500,
      fontSize: "13px",
      letterSpacing: "0.01em",
      transition: "color 0.2s ease",
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      position: "relative",
    };
  };

  return (
    <nav
      style={{
        display: "flex",
        background: "rgba(8, 25, 46, 0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        padding: "10px 32px",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 999,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* BRAND LOGO */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
        }}
        onClick={() => safeNavigate("/")}
      >
        <span
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "#F7FAFC",
            letterSpacing: "-0.02em",
          }}
        >
          Feedback<span style={{ color: "#A5C9FF", fontWeight: 400 }}>Intel</span>
        </span>
      </div>

      {/* LINKS LIST */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <span
          style={getLinkStyle("/")}
          onClick={() => safeNavigate("/")}
          onMouseEnter={() => setHoveredLink("/")}
          onMouseLeave={() => setHoveredLink(null)}
        >
          Home
        </span>

        <span
          style={getLinkStyle("/dashboard")}
          onClick={() => safeNavigate("/dashboard")}
          onMouseEnter={() => setHoveredLink("/dashboard")}
          onMouseLeave={() => setHoveredLink(null)}
        >
          Dashboard
        </span>

        <span
          style={getLinkStyle("/add-comment")}
          onClick={() => safeNavigate("/add-comment")}
          onMouseEnter={() => setHoveredLink("/add-comment")}
          onMouseLeave={() => setHoveredLink(null)}
        >
          Submit Feedback
        </span>

        <span
          style={getLinkStyle("/comments")}
          onClick={() => safeNavigate("/comments")}
          onMouseEnter={() => setHoveredLink("/comments")}
          onMouseLeave={() => setHoveredLink(null)}
        >
          Comments
        </span>

        <span
          style={getLinkStyle("/admin/outlets")}
          onClick={() => safeNavigate("/admin/outlets")}
          onMouseEnter={() => setHoveredLink("/admin/outlets")}
          onMouseLeave={() => setHoveredLink(null)}
        >
          Outlets
        </span>

        <span
          style={getLinkStyle("/admin/keywords")}
          onClick={() => safeNavigate("/admin/keywords")}
          onMouseEnter={() => setHoveredLink("/admin/keywords")}
          onMouseLeave={() => setHoveredLink(null)}
        >
          Keywords
        </span>
      </div>

      {/* RIGHT SIDE AUTH */}
      <div>
        {loggedIn ? (
          <span
            style={{
              color: "#FF8B8B",
              border: "1px solid rgba(255, 139, 139, 0.2)",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: "transparent",
            }}
            onClick={handleLogout}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 139, 139, 0.08)";
              e.currentTarget.style.borderColor = "rgba(255, 139, 139, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(255, 139, 139, 0.2)";
            }}
          >
            Logout
          </span>
        ) : (
          <span
            style={{
              color: "#F7FAFC",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: "transparent",
            }}
            onClick={() => safeNavigate("/login")}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#A5C9FF";
              e.currentTarget.style.color = "#A5C9FF";
              e.currentTarget.style.background = "rgba(165, 201, 255, 0.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.color = "#F7FAFC";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Login
          </span>
        )}
      </div>
    </nav>
  );
}
