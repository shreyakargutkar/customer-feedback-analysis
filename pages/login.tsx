// pages/login.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setMsg('Logging in...');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMsg('Login failed: ' + error.message);
        return;
      }

      setMsg('Login success!');
      // small delay so user sees success message
      setTimeout(() => router.push('/dashboard'), 500);
    } catch (err: any) {
      setMsg('Unexpected error: ' + (err?.message || err));
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 20 }}>
      <h2 style={{ marginBottom: 12 }}>Admin Login</h2>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 10 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
            required
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
            required
          />
        </div>

        <div>
          <button type="submit" style={{ padding: '8px 12px' }}>
            Login
          </button>
        </div>
      </form>


      <p style={{ marginTop: 12 }}>{msg}</p>
    </div>
  );
}

