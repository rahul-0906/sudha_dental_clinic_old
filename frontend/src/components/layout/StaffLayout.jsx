import { useSelector } from 'react-redux'
import StaffPanel from './StaffPanel'
import DoctorPanel from './DoctorPanel'

export default function StaffLayout() {
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Staff Panel — Left 25% */}
      <div style={{
        width: '25%', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: 'var(--bg-800)',
      }}>
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        }}>
          <span style={{ fontSize: 16 }}>👩‍⚕️</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary-light)' }}>STAFF STATION</span>
          <span style={{
            marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)',
            background: 'rgba(13,148,136,0.1)', padding: '2px 8px', borderRadius: 10,
            border: '1px solid var(--border)',
          }}>
            Registration · Queue · Checkout
          </span>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <StaffPanel />
        </div>
      </div>

      {/* Teal divider glow */}
      <div style={{
        width: 1, background: 'linear-gradient(to bottom, transparent, var(--primary), transparent)',
        opacity: 0.4, flexShrink: 0,
      }} />

      {/* Doctor Panel — Right 68% */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: 'var(--bg-900)',
      }}>
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        }}>
          <span style={{ fontSize: 16 }}>🩺</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>DOCTOR WORKSPACE</span>
          <span style={{
            marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)',
            background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 10,
            border: '1px solid var(--border)',
          }}>
            Consultation · History · X-rays
          </span>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <DoctorPanel />
        </div>
      </div>
    </div>
  )
}
