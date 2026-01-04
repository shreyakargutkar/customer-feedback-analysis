import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function AddCommentPage() {
  const router = useRouter();
  const [outlets, setOutlets] = useState<any[]>([]);
  const [guest, setGuest] = useState("");
  const [outletId, setOutletId] = useState("");
  const [rating, setRating] = useState<number>(3);
  const [comment, setComment] = useState("");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error" | "">("");

  async function loadOutlets() {
    try {
      const res = await fetch("/api/outlets");
      const json = await res.json();
      const data = json.data || [];
      setOutlets(data);
      if (data.length > 0) setOutletId(data[0].id);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadOutlets();
  }, []);

  async function handleSubmit(e: any) {
    e.preventDefault();

    if (!guest || !comment || !outletId || !phone || !email) {
      setMsg("Please fill all required fields");
      setMsgType("error");
      return;
    }

    setLoading(true);
    setMsg("");
    setMsgType("");

    const payload = {
      guest_name: guest.trim(),
      outlet_id: outletId,
      rating,
      comment_text: comment.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim() || null,
    };

    const res = await fetch("/api/add-comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMsg("Error: " + (json.error || res.statusText));
      setMsgType("error");
      return;
    }

    setMsg("Comment saved successfully!");
    setMsgType("success");

    setGuest("");
    setComment("");
    setPhone("");
    setEmail("");
    setAddress("");
    setRating(3);

    setTimeout(() => router.push("/comments"), 1200);
  }

  const container: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#1e293b,#0f172a)",
    padding: "40px 20px",
    fontFamily: "Inter, system-ui",
  };

  const innerContainer: React.CSSProperties = { maxWidth: 800, margin: "0 auto" };
  const formCard: React.CSSProperties = {
    background: "linear-gradient(135deg,#334155,#1e293b)",
    borderRadius: 16,
    padding: 40,
  };

  const formGroup: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8 };
  const label: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#cbd5e1" };
  const required: React.CSSProperties = { color: "#ef4444" };

  const inputStyle: React.CSSProperties = {
    padding: "14px 16px",
    borderRadius: 10,
    border: "2px solid rgba(255,255,255,0.08)",
    background: "rgba(15,23,42,0.4)",
    color: "#f9fafb",
  };

  const textarea: React.CSSProperties = { ...inputStyle, minHeight: 140 };

  return (
    <div style={container}>
      <div style={innerContainer}>
        <div style={formCard}>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
            <div style={formGroup}>
              <label style={label}>Guest Name <span style={required}>*</span></label>
              <input required style={inputStyle} value={guest} onChange={(e) => setGuest(e.target.value)} />
            </div>

            <div style={formGroup}>
              <label style={label}>Phone <span style={required}>*</span></label>
              <input required style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div style={formGroup}>
              <label style={label}>Email <span style={required}>*</span></label>
              <input required style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div style={formGroup}>
              <label style={label}>Address</label>
              <input style={inputStyle} value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div style={formGroup}>
              <label style={label}>Outlet <span style={required}>*</span></label>
              <select required style={inputStyle} value={outletId} onChange={(e) => setOutletId(e.target.value)}>
                <option value="" disabled>Select outlet</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.outlet_name || o.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ⭐ STAR RATING */}
            <div style={formGroup}>
              <label style={label}>Rating <span style={required}>*</span></label>
              <div style={{ display: "flex", gap: 8 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setRating(star)}
                    style={{
                      fontSize: 28,
                      cursor: "pointer",
                      color: star <= rating ? "#fbbf24" : "#475569",
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div style={formGroup}>
              <label style={label}>Comment <span style={required}>*</span></label>
              <textarea required style={textarea} value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Comment"}
            </button>

            {msg && <div>{msg}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
