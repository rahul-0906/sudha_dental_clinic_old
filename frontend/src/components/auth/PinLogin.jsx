import { useState, useRef, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { setAuthenticated } from '../../store/slices/appSlice'
import { verifyPin } from '../../api/misc'
import { Lock } from 'lucide-react'

const ToothLogo = ({ size = 80, glow = false }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" stroke="var(--primary)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"
    style={glow ? { filter: 'drop-shadow(0 0 20px rgba(20,184,166,0.6))' } : {}}>
    <path d="M40 8C28 8 18 16 18 26C18 32 20 38 22 44C24 50 25 60 27 66C28 70 30 72 32 72C34 72 36 68 38 62C39 58 40 54 40 54C40 54 41 58 42 62C44 68 46 72 48 72C50 72 52 70 53 66C55 60 56 50 58 44C60 38 62 32 62 26C62 16 52 8 40 8Z" />
  </svg>
)

export default function PinLogin() {
  const dispatch = useDispatch()
  const [pin, setPin] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const inputRefs = [useRef(), useRef(), useRef(), useRef()]

  useEffect(() => {
    inputRefs[0].current?.focus()
  }, [])

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newPin = [...pin]
    newPin[index] = value.slice(-1)
    setPin(newPin)
    setError('')

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus()
    }

    if (newPin.every(d => d !== '') && index === 3) {
      handleSubmit(newPin.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handleSubmit = async (pinCode) => {
    const code = pinCode || pin.join('')
    if (code.length !== 4) {
      setError('Please enter all 4 digits')
      return
    }

    setLoading(true)
    try {
      const res = await verifyPin(code)
      if (res.data.valid) {
        const today = new Date().toISOString().split('T')[0]
        localStorage.setItem('clinicPinDate', today)
        localStorage.setItem('clinicPinValid', 'true')
        localStorage.setItem('clinicPin', code)
        toast.success('Welcome to Sudha Dental Clinic!')
        dispatch(setAuthenticated(true))
      } else {
        setError('Incorrect PIN. Please try again.')
        setShake(true)
        setPin(['', '', '', ''])
        setTimeout(() => {
          setShake(false)
          inputRefs[0].current?.focus()
        }, 600)
      }
    } catch {
      setError('Could not connect to clinic server. Please check the connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(13,148,136,0.15) 0%, var(--bg-900) 60%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient circles */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%)',
        top: -100, left: -100, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(13,148,136,0.06) 0%, transparent 70%)',
        bottom: -50, right: -50, pointerEvents: 'none',
      }} />

      <div className="glass" style={{
        padding: '48px 40px',
        borderRadius: 'var(--radius-xl)',
        width: '100%',
        maxWidth: 400,
        textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5), var(--shadow-glow)',
        animation: 'slideIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 20, display: 'inline-block', animation: 'pulse 3s infinite' }}>
          <ToothLogo size={72} glow />
        </div>

        {/* Clinic Info */}
        <h1 style={{
          fontSize: 22, fontWeight: 800, color: 'var(--text-primary)',
          margin: '0 0 4px 0', letterSpacing: '-0.5px',
        }}>
          Sudha Dental Clinic
        </h1>
        <p style={{ color: 'var(--primary-light)', fontSize: 13, margin: '0 0 4px 0', fontWeight: 500 }}>
          Sankarankovil
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 32px 0' }}>
          Dr. Mariyappan
        </p>

        {/* PIN Label */}
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, fontWeight: 500 }}>
          <Lock size={16} />
          <span>Enter Daily PIN to Continue</span>
        </p>

        {/* PIN Input Boxes */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          marginBottom: 28,
          animation: shake ? 'shake 0.5s ease' : 'none',
        }}>
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={{
                width: 64,
                height: 64,
                fontSize: 28,
                fontWeight: 700,
                textAlign: 'center',
                background: digit ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.04)',
                border: `2px solid ${digit ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'var(--transition)',
                caretColor: 'transparent',
                cursor: 'pointer',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-light)'}
              onBlur={(e) => e.target.style.borderColor = digit ? 'var(--primary)' : 'var(--border)'}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            color: 'var(--danger)', fontSize: 13, marginBottom: 16,
            padding: '8px 12px', background: 'rgba(239,68,68,0.1)',
            borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)',
          }}>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={() => handleSubmit()}
          disabled={loading || pin.some(d => d === '')}
          className="btn-primary"
          style={{ width: '100%', fontSize: 15, padding: '14px', position: 'relative' }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{
                width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', display: 'inline-block',
              }} />
              Verifying...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Lock size={16} />
              <span>Unlock Clinic</span>
            </span>
          )}
        </button>

        <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 24 }}>
          This PIN resets daily. Contact Dr. Mariyappan for access.
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 50%, 90% { transform: translateX(-8px); }
          30%, 70% { transform: translateX(8px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
