// components/Nav.tsx
import { useRouter } from "next/router";
import React from "react";

export default function Nav() {
  const router = useRouter();

  function safeNavigate(href: string) {
    if (!href) return;
    const normalize = (p: string) => (p ? p.replace(/\/+$/, "") : "/");
    if (normalize(router.asPath) === normalize(href)) {
      return;
    }
    router.push(href);
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

      <span style={linkStyle} onClick={() => safeNavigate("/login")}>
        Login
      </span>
    </nav>
  );
}
