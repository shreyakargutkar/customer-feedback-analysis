// components/Nav.tsx
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Nav() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

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

  const linkStyle: React.CSSProperties = {
    color: "white",
    cursor: "pointer",
    padding: "6px 10px",
    fontWeight: 500,
  };

  return (
    <nav
      style={{
        display: "flex",
        gap: 8,
        background: "#0b1220",
        padding: "10px 14px",
        alignItems: "center",
      }}
    >
      <span style={linkStyle} onClick={() => safeNavigate("/")}>
        Home
      </span>

      <span style={linkStyle} onClick={() => safeNavigate("/dashboard")}>
        Dashboard
      </span>

      <span style={linkStyle} onClick={() => safeNavigate("/add-comment")}>
        Add Comment
      </span>

      <span style={linkStyle} onClick={() => safeNavigate("/comments")}>
        Comments
      </span>

      <span style={linkStyle} onClick={() => safeNavigate("/admin/outlets")}>
        Outlets
      </span>

      <span style={linkStyle} onClick={() => safeNavigate("/admin/keywords")}>
        Keywords
      </span>

      {/* RIGHT SIDE AUTH BUTTON */}
      {loggedIn ? (
        <span
          style={{ ...linkStyle, marginLeft: "auto", color: "#f87171" }}
          onClick={handleLogout}
        >
          Logout
        </span>
      ) : (
        <span
          style={{ ...linkStyle, marginLeft: "auto", color: "#60a5fa" }}
          onClick={() => safeNavigate("/login")}
        >
          Login
        </span>
      )}
    </nav>
  );
}
