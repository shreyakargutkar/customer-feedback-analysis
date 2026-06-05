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
        if (profile.role === 'employee' || profile.role === 'admin') {
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
    if (userRole === 'employee' || userRole === 'admin') {
      router.push('/dashboard')
    } else {
      router.push('/add-comment')
    }
  }

  const [btnHovered, setBtnHovered] = useState(false)
  const [logoutBtnHovered, setLogoutBtnHovered] = useState(false)
  const [dashBtnHovered, setDashBtnHovered] = useState(false)

  const container: React.CSSProperties = {
    minHeight: 'calc(100vh - 54px)',
    background: 'radial-gradient(circle at 50% 0%, #0C2340 0%, #08192E 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  }

  const card: React.CSSProperties = {
    background: 'rgba(17, 42, 74, 0.3)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 24,
    padding: '48px 36px',
    maxWidth: 400,
    width: '100%',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    position: 'relative',
    zIndex: 1,
  }

  const logoContainer: React.CSSProperties = {
    width: 48,
    height: 48,
    margin: '0 auto 24px',
    background: 'rgba(165, 201, 255, 0.08)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(165, 201, 255, 0.15)',
  }

  const title: React.CSSProperties = {
    margin: '0 0 6px 0',
    fontSize: 24,
    fontWeight: 500,
    color: '#F7FAFC',
    letterSpacing: '-0.02em',
    textAlign: 'center',
  }

  const subtitle: React.CSSProperties = {
    margin: '0 0 32px 0',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontWeight: 400,
    lineHeight: 1.5,
  }

  const inputWrapper: React.CSSProperties = {
    marginBottom: 20,
    position: 'relative',
  }

  const label: React.CSSProperties = {
    display: 'block',
    marginBottom: 8,
    fontSize: 11,
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.48)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  }

  const getInputStyle = (isFocused: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '12px 14px',
    boxSizing: 'border-box',
    borderRadius: 8,
    border: isFocused
      ? '1px solid #A5C9FF'
      : '1px solid rgba(255, 255, 255, 0.12)',
    background: 'rgba(8, 25, 46, 0.4)',
    color: '#F7FAFC',
    fontSize: 13,
    fontFamily: 'inherit',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    outline: 'none',
    boxShadow: isFocused
      ? '0 0 0 3px rgba(165, 201, 255, 0.2)'
      : 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
  })

  const getButtonStyle = (hovered: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '11px 20px',
    marginTop: 10,
    borderRadius: 8,
    border: 'none',
    background: loading
      ? 'rgba(255, 255, 255, 0.05)'
      : hovered
      ? '#CDE0FF'
      : '#A5C9FF',
    color: '#08192E',
    fontSize: 13,
    fontWeight: 500,
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  })

  const getLogoutButtonStyle = (hovered: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '11px 20px',
    borderRadius: 8,
    border: '1px solid rgba(255, 139, 139, 0.2)',
    background: loading
      ? 'rgba(255, 255, 255, 0.05)'
      : hovered
      ? 'rgba(255, 139, 139, 0.12)'
      : 'rgba(255, 139, 139, 0.06)',
    color: '#FF8B8B',
    fontSize: 13,
    fontWeight: 500,
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
    marginTop: 16,
  })

  const getDashboardButtonStyle = (hovered: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '11px 20px',
    borderRadius: 8,
    border: hovered ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.12)',
    background: hovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
    color: '#F7FAFC',
    fontSize: 13,
    fontWeight: 500,
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
    marginTop: 12,
  })

  const message: React.CSSProperties = {
    marginTop: 20,
    padding: msg ? '12px 16px' : '0',
    borderRadius: 8,
    fontSize: 13,
    textAlign: 'center',
    background: msg.includes('failed') || msg.includes('error')
      ? 'rgba(239, 68, 68, 0.08)'
      : msg.includes('success')
      ? 'rgba(34, 197, 94, 0.08)'
      : 'rgba(165, 201, 255, 0.08)',
    color: msg.includes('failed') || msg.includes('error')
      ? '#FFA8A8'
      : msg.includes('success')
      ? '#A3E635'
      : '#A5C9FF',
    border: `1px solid ${
      msg.includes('failed') || msg.includes('error')
        ? 'rgba(239, 68, 68, 0.15)'
        : msg.includes('success')
        ? 'rgba(34, 197, 94, 0.15)'
        : 'rgba(165, 201, 255, 0.15)'
    }`,
    fontWeight: 500,
  }

  const userInfo: React.CSSProperties = {
    background: 'rgba(17, 42, 74, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: '16px',
    marginBottom: 20,
  }

  const infoRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  }

  const infoLabel: React.CSSProperties = {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.48)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  }

  const infoValue: React.CSSProperties = {
    fontSize: 13,
    color: '#F7FAFC',
    fontWeight: 500,
  }

  const badge: React.CSSProperties = {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 600,
    background: userRole === 'employee' 
      ? 'rgba(165, 201, 255, 0.08)'
      : 'rgba(74, 222, 128, 0.08)',
    color: userRole === 'employee' ? '#A5C9FF' : '#4ade80',
    border: `1px solid ${userRole === 'employee' ? 'rgba(165, 201, 255, 0.15)' : 'rgba(74, 222, 128, 0.15)'}`,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  return (
    <div style={container}>
      <div style={card}>
        <div style={logoContainer}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A5C9FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

        <h2 style={title}>{isLoggedIn ? 'Account' : 'Welcome Back'}</h2>
        <p style={subtitle}>
          {isLoggedIn 
            ? 'You are currently signed in' 
            : 'Access your customer intelligence hub'}
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
              style={getDashboardButtonStyle(dashBtnHovered)}
              disabled={loading}
              onMouseEnter={() => setDashBtnHovered(true)}
              onMouseLeave={() => setDashBtnHovered(false)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              style={getLogoutButtonStyle(logoutBtnHovered)}
              disabled={loading}
              onMouseEnter={() => setLogoutBtnHovered(true)}
              onMouseLeave={() => setLogoutBtnHovered(false)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

            <button 
              type="submit" 
              style={getButtonStyle(btnHovered)} 
              disabled={loading}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {msg && <div style={message}>{msg}</div>}
      </div>
    </div>
  )
}