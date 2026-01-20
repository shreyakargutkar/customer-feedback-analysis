import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data } = await supabase.auth.getUser()
    
    if (data?.user) {
      setIsLoggedIn(true)
      setUserEmail(data.user.email || '')
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      
      if (profile) {
        setUserRole(profile.role)
      }
    }
  }

  const handleLogin = async (e: any) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMsg('Login failed: ' + error.message)
        setLoading(false)
        return
      }

      const { data: userData } = await supabase.auth.getUser()

      if (!userData?.user) {
        setMsg('Login failed: user not found')
        setLoading(false)
        return
      }

      const { data: profile, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single()

      if (roleError || !profile) {
        setMsg('Access denied')
        setLoading(false)
        return
      }

      setMsg('Login successful! Redirecting...')
      setIsLoggedIn(true)
      setUserEmail(userData.user.email || '')
      setUserRole(profile.role)

      setTimeout(() => {
        if (profile.role === 'employee') {
          router.push('/dashboard')
        } else {
          router.push('/add-comment')
        }
      }, 800)
    } catch (err: any) {
      setMsg('Unexpected error: ' + (err?.message || err))
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setUserEmail('')
    setUserRole('')
    setEmail('')
    setPassword('')
    setMsg('Logged out successfully')
    setLoading(false)
  }

  const goToDashboard = () => {
    if (userRole === 'employee') {
      router.push('/dashboard')
    } else {
      router.push('/add-comment')
    }
  }

  const container: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  }

  const backgroundGlow: React.CSSProperties = {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  }

  const card: React.CSSProperties = {
    background: 'rgba(30, 41, 59, 0.7)',
    backdropFilter: 'blur(20px)',
    borderRadius: 24,
    padding: '56px 48px',
    maxWidth: 460,
    width: '100%',
    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    position: 'relative',
    zIndex: 1,
  }

  const logoContainer: React.CSSProperties = {
    width: 72,
    height: 72,
    margin: '0 auto 28px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 12px 32px rgba(59, 130, 246, 0.35), inset 0 -2px 8px rgba(0, 0, 0, 0.2)',
    position: 'relative',
  }

  const logoGlow: React.CSSProperties = {
    position: 'absolute',
    inset: '-4px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    opacity: 0.3,
    filter: 'blur(12px)',
    zIndex: -1,
  }

  const title: React.CSSProperties = {
    margin: '0 0 10px 0',
    fontSize: 34,
    fontWeight: 700,
    color: '#f9fafb',
    letterSpacing: '-0.03em',
    textAlign: 'center',
  }

  const subtitle: React.CSSProperties = {
    margin: '0 0 40px 0',
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: 400,
    lineHeight: 1.6,
  }

  const inputWrapper: React.CSSProperties = {
    marginBottom: 24,
    position: 'relative',
  }

  const label: React.CSSProperties = {
    display: 'block',
    marginBottom: 10,
    fontSize: 13,
    fontWeight: 600,
    color: '#cbd5e1',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  }

  const getInputStyle = (isFocused: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '16px 18px',
    boxSizing: 'border-box',
    borderRadius: 12,
    border: isFocused
      ? '2px solid rgba(96, 165, 250, 0.6)'
      : '2px solid rgba(255, 255, 255, 0.08)',
    background: isFocused
      ? 'rgba(15, 23, 42, 0.6)'
      : 'rgba(15, 23, 42, 0.4)',
    color: '#f9fafb',
    fontSize: 15,
    fontFamily: 'inherit',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    boxShadow: isFocused
      ? '0 0 0 4px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1)'
      : 'none',
  })

  const button: React.CSSProperties = {
    width: '100%',
    padding: '16px 24px',
    marginTop: 12,
    borderRadius: 12,
    border: 'none',
    background: loading
      ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
      : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: loading ? 'none' : '0 8px 20px rgba(59, 130, 246, 0.35)',
    fontFamily: 'inherit',
    letterSpacing: '0.02em',
  }

  const logoutButton: React.CSSProperties = {
    ...button,
    background: loading
      ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    boxShadow: loading ? 'none' : '0 8px 20px rgba(239, 68, 68, 0.35)',
    marginTop: 16,
  }

  const dashboardButton: React.CSSProperties = {
    ...button,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: 'none',
    marginTop: 12,
  }

  const message: React.CSSProperties = {
    marginTop: 24,
    padding: msg ? '14px 18px' : '0',
    borderRadius: 10,
    fontSize: 14,
    textAlign: 'center',
    background: msg.includes('failed') || msg.includes('error')
      ? 'rgba(239, 68, 68, 0.12)'
      : msg.includes('success')
      ? 'rgba(34, 197, 94, 0.12)'
      : 'rgba(59, 130, 246, 0.12)',
    color: msg.includes('failed') || msg.includes('error')
      ? '#fca5a5'
      : msg.includes('success')
      ? '#86efac'
      : '#93c5fd',
    border: `1px solid ${
      msg.includes('failed') || msg.includes('error')
        ? 'rgba(239, 68, 68, 0.25)'
        : msg.includes('success')
        ? 'rgba(34, 197, 94, 0.25)'
        : 'rgba(59, 130, 246, 0.25)'
    }`,
    fontWeight: 500,
    backdropFilter: 'blur(8px)',
  }

  const userInfo: React.CSSProperties = {
    background: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 24,
  }

  const infoRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  }

  const infoLabel: React.CSSProperties = {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  }

  const infoValue: React.CSSProperties = {
    fontSize: 14,
    color: '#f9fafb',
    fontWeight: 500,
  }

  const badge: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    background: userRole === 'employee' 
      ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
      : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  return (
    <div style={container}>
      <div style={backgroundGlow}></div>
      <div style={card}>
        <div style={logoContainer}>
          <div style={logoGlow}></div>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isLoggedIn ? (
              <>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </>
            ) : (
              <>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </>
            )}
          </svg>
        </div>

        <h2 style={title}>{isLoggedIn ? 'Account' : 'Welcome'}</h2>
        <p style={subtitle}>
          {isLoggedIn 
            ? 'You are currently signed in' 
            : 'Enter your credentials to access your dashboard'}
        </p>

        {isLoggedIn ? (
          <>
            <div style={userInfo}>
              <div style={infoRow}>
                <span style={infoLabel}>Email</span>
                <span style={infoValue}>{userEmail}</span>
              </div>
              <div style={{ ...infoRow, marginBottom: 0 }}>
                <span style={infoLabel}>Role</span>
                <span style={badge}>{userRole}</span>
              </div>
            </div>

            <button 
              onClick={goToDashboard} 
              style={dashboardButton}
              disabled={loading}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                Go to Dashboard
              </div>
            </button>

            <button 
              onClick={handleLogout} 
              style={logoutButton}
              disabled={loading}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                {loading ? 'Logging out...' : 'Logout'}
              </div>
            </button>
          </>
        ) : (
          <form onSubmit={handleLogin}>
            <div style={inputWrapper}>
              <label style={label}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={getInputStyle(emailFocused)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                required
                disabled={loading}
              />
            </div>

            <div style={inputWrapper}>
              <label style={label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={getInputStyle(passwordFocused)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" style={button} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {msg && <div style={message}>{msg}</div>}
      </div>
    </div>
  )
}