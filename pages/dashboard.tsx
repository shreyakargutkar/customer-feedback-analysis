// pages/dashboard.tsx

export default function Dashboard() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>
      <p>You are logged in! 🎉</p>

      <p>Next steps:</p>
      <ul>
        <li>Go to /admin/outlets to manage outlets</li>
        <li>Go to /admin/keywords to manage keywords</li>
      </ul>
    </div>
  );
}
