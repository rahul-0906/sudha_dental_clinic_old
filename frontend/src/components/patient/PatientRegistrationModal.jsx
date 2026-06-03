import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { X, Check, UserPlus } from 'lucide-react'
import { registerPatient } from '../../api/patients'
import { setSelectedPatient } from '../../store/slices/patientSlice'
import { addToQueue } from '../../api/visits'
import { fetchTodayQueue } from '../../store/slices/queueSlice'
import toast from 'react-hot-toast'

export default function PatientRegistrationModal({ onClose }) {
  const dispatch = useDispatch()
  const [form, setForm] = useState({
    name: '', phone: '', dob: '', gender: '', address: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [addQueue, setAddQueue] = useState(true)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.phone.match(/^\d{10}$/)) e.phone = 'Enter a valid 10-digit phone number'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const res = await registerPatient(form)
      const patient = res.data
      dispatch(setSelectedPatient(patient))

      if (addQueue) {
        try {
          await addToQueue(patient.id)
          dispatch(fetchTodayQueue())
          toast.success(`${patient.name} registered & added to queue!`)
        } catch {
          toast.success(`${patient.name} registered successfully!`)
        }
      } else {
        toast.success(`${patient.name} registered!`)
      }

      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      if (msg.includes('phone') || msg.includes('duplicate')) {
        setErrors({ phone: 'This phone number is already registered' })
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass" style={{
        width: '100%', maxWidth: 480, borderRadius: 'var(--radius-xl)',
        padding: 28, boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        animation: 'slideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserPlus size={18} style={{ color: 'var(--primary)' }} />
            <span>Register New Patient</span>
          </h2>
          <button onClick={onClose} style={{
            marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', display: 'flex',
          }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
              Full Name *
            </label>
            <input className="input-field" type="text" placeholder="Patient's full name"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box' }} />
            {errors.name && <p style={{ color: 'var(--danger)', fontSize: 12, margin: '4px 0 0' }}>{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
              Phone Number * (10 digits)
            </label>
            <input className="input-field" type="tel" placeholder="9876543210"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
              maxLength={10} style={{ width: '100%', boxSizing: 'border-box' }} />
            {errors.phone && <p style={{ color: 'var(--danger)', fontSize: 12, margin: '4px 0 0' }}>{errors.phone}</p>}
          </div>

          {/* DOB + Gender */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
                Date of Birth
              </label>
              <input className="input-field" type="date"
                value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
                Gender
              </label>
              <select className="input-field"
                value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box' }}>
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
              Address
            </label>
            <textarea className="input-field" placeholder="Patient address..."
              value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>

          {/* Add to Queue toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={addQueue} onChange={(e) => setAddQueue(e.target.checked)}
              style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Add to today's queue immediately
            </span>
          </label>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {loading ? 'Registering...' : (
                <>
                  <Check size={16} />
                  <span>{addQueue ? 'Register & Add to Queue' : 'Register Patient'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
