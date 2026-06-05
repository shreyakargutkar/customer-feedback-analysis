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

  // UI States
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [btnHovered, setBtnHovered] = useState(false);

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
      rating: String(rating),
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

    setMsg("Feedback successfully registered.");
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
    minHeight: "calc(100vh - 54px)",
    background: "radial-gradient(circle at 50% 0%, #0C2340 0%, #08192E 100%)",
    padding: "80px 24px",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  };

  const innerContainer: React.CSSProperties = {
    maxWidth: 600,
    margin: "0 auto",
  };

  const formCard: React.CSSProperties = {
    background: "rgba(17, 42, 74, 0.3)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: 24,
    padding: "48px 36px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
  };

  const formGroup: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  };

  const label: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.48)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  };

  const required: React.CSSProperties = {
    color: "#FF8B8B",
    marginLeft: 2,
  };

  const getInputStyle = (fieldName: string): React.CSSProperties => {
    const isFocused = focusedField === fieldName;
    return {
      padding: "12px 14px",
      borderRadius: 8,
      border: isFocused
        ? "1px solid #A5C9FF"
        : "1px solid rgba(255, 255, 255, 0.12)",
      background: "rgba(8, 25, 46, 0.4)",
      color: "#F7FAFC",
      fontSize: 13,
      fontFamily: "inherit",
      outline: "none",
      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      boxShadow: isFocused
        ? "0 0 0 3px rgba(165, 201, 255, 0.2)"
        : "inset 0 1px 2px rgba(0, 0, 0, 0.2)",
    };
  };

  const getTextareaStyle = (fieldName: string): React.CSSProperties => ({
    ...getInputStyle(fieldName),
    minHeight: 110,
    resize: "vertical",
  });

  const getButtonStyle = (hovered: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "12px 24px",
    borderRadius: 8,
    border: "none",
    background: loading
      ? "rgba(255, 255, 255, 0.05)"
      : hovered
      ? "#CDE0FF"
      : "#A5C9FF",
    color: "#08192E",
    fontSize: 14,
    fontWeight: 500,
    cursor: loading ? "not-allowed" : "pointer",
    transition: "all 0.15s ease",
    fontFamily: "inherit",
    marginTop: 10,
  });

  const messageStyle: React.CSSProperties = {
    padding: "12px 16px",
    borderRadius: 8,
    fontSize: 13,
    textAlign: "center",
    fontWeight: 500,
    background: msgType === "error"
      ? "rgba(239, 68, 68, 0.08)"
      : "rgba(34, 197, 94, 0.08)",
    color: msgType === "error" ? "#FFA8A8" : "#4ade80",
    border: `1px solid ${msgType === "error" ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)"}`,
    marginTop: 8,
  };

  return (
    <div style={container}>
      <div style={innerContainer}>
        <div style={formCard}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 24, fontWeight: 500, color: "#F7FAFC", margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>
              Submit Guest Feedback
            </h2>
            <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
              Share your dining experience. Our intelligence engine will analyze sentiment and link aspect markers to restaurant benchmarks.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 24 }}>
            <div style={formGroup}>
              <label style={label}>
                Guest Name <span style={required}>*</span>
              </label>
              <input
                required
                style={getInputStyle("guest")}
                value={guest}
                onChange={(e) => setGuest(e.target.value)}
                onFocus={() => setFocusedField("guest")}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. Jane Doe"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={formGroup}>
                <label style={label}>
                  Phone Number <span style={required}>*</span>
                </label>
                <input
                  required
                  style={getInputStyle("phone")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="+1 (555) 019-2834"
                />
              </div>

              <div style={formGroup}>
                <label style={label}>
                  Email Address <span style={required}>*</span>
                </label>
                <input
                  required
                  type="email"
                  style={getInputStyle("email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="jane.doe@example.com"
                />
              </div>
            </div>

            <div style={formGroup}>
              <label style={label}>Address</label>
              <input
                style={getInputStyle("address")}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onFocus={() => setFocusedField("address")}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. 123 Main St, Springfield"
              />
            </div>

            <div style={formGroup}>
              <label style={label}>
                Outlet Location <span style={required}>*</span>
              </label>
              <select
                required
                style={getInputStyle("outlet")}
                value={outletId}
                onChange={(e) => setOutletId(e.target.value)}
                onFocus={() => setFocusedField("outlet")}
                onBlur={() => setFocusedField(null)}
              >
                <option value="" disabled>
                  Select outlet location...
                </option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.outlet_name || o.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ⭐ STAR RATING */}
            <div style={formGroup}>
              <label style={label}>
                Experience Rating <span style={required}>*</span>
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(null)}
                    style={{
                      fontSize: 28,
                      cursor: "pointer",
                      color: star <= (hoveredStar ?? rating) ? "#A5C9FF" : "rgba(255, 255, 255, 0.12)",
                      transform: hoveredStar === star ? "scale(1.15)" : "scale(1)",
                      transition: "all 0.15s ease",
                      display: "inline-block",
                    }}
                  >
                    ★
                  </span>
                ))}
                <span style={{ marginLeft: 12, fontSize: 13, fontWeight: 500, color: "rgba(255, 255, 255, 0.48)" }}>
                  {rating === 5 ? "Excellent" : rating === 4 ? "Good" : rating === 3 ? "Average" : rating === 2 ? "Below Average" : "Poor"}
                </span>
              </div>
            </div>

            <div style={formGroup}>
              <label style={label}>
                Comment Feedback <span style={required}>*</span>
              </label>
              <textarea
                required
                style={getTextareaStyle("comment")}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onFocus={() => setFocusedField("comment")}
                onBlur={() => setFocusedField(null)}
                placeholder="Tell us about the service quality, staff behavior, cleanliness, or ambience..."
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={getButtonStyle(btnHovered)}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </button>

            {msg && <div style={messageStyle}>{msg}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
