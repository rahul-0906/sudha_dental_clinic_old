import { useState } from 'react'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { fetchTodayQueue } from '../../store/slices/queueSlice'
import { checkoutVisit } from '../../api/visits'
import { CreditCard, Package, Calendar, Check, Award } from 'lucide-react'

export default function CheckoutPanel({ visit }) {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!visit) return null

  const prescriptions = visit.prescriptions || []
  const medicineTotal = prescriptions.reduce((acc, p) => acc + ((p.unitPrice || 0) * (p.quantityDispensed || 0)), 0)
  const consultFee = parseFloat(visit.consultationFee || 0)
  const grandTotal = consultFee + medicineTotal

  const handleCollect = async () => {
    setLoading(true)
    try {
      await checkoutVisit({
        visitId: visit.id,
        consultationFee: consultFee,
        prescriptions: prescriptions.map(p => ({
          medicationId: p.medication?.id || p.medicationId,
          quantity: p.quantityDispensed,
        })),
        nextVisitDate: visit.nextVisitDate,
      })
      setDone(true)
      dispatch(fetchTodayQueue())
      toast.success(`Payment of ₹${grandTotal} collected!`)
      setTimeout(() => setDone(false), 3000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="card" style={{
        padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(16,185,129,0.3)',
        background: 'rgba(16,185,129,0.05)',
        animation: 'pulse 0.5s ease',
        gap: 12
      }}>
        <Award size={48} strokeWidth={1.5} style={{ color: 'var(--success)' }} />
        <div>
          <h3 style={{ margin: '0 0 8px', color: 'var(--success)' }}>Payment Collected!</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
            ₹{grandTotal.toFixed(0)} received from {visit.patient?.name}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 16, border: '1px solid rgba(168,85,247,0.2)' }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#C084FC', display: 'flex', alignItems: 'center', gap: 6 }}>
        <CreditCard size={16} />
        <span>Checkout — {visit.patient?.name}</span>
      </h3>

      {/* Prescription list */}
      {prescriptions.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>MEDICATIONS TO DISPENSE</div>
          {prescriptions.map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
              background: 'var(--bg-700)', borderRadius: 'var(--radius-sm)', marginBottom: 5,
              fontSize: 13,
            }}>
              <Package size={14} style={{ color: 'var(--primary-light)' }} />
              <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 500 }}>
                {p.medication?.name || p.medicationName}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                × {p.quantityDispensed}
              </span>
              <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>
                ₹{((p.unitPrice || 0) * p.quantityDispensed).toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Fee breakdown */}
      <div style={{
        background: 'var(--bg-700)', borderRadius: 'var(--radius-sm)',
        padding: '12px 14px', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
          <span>Consultation Fee</span>
          <span>₹{consultFee.toFixed(0)}</span>
        </div>
        {medicineTotal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span>Medicines</span>
            <span>₹{medicineTotal.toFixed(0)}</span>
          </div>
        )}
        <div style={{
          display: 'flex', justifyContent: 'space-between', paddingTop: 8,
          borderTop: '1px solid var(--border)', fontSize: 18, fontWeight: 800,
          color: 'var(--primary-light)',
        }}>
          <span>TOTAL</span>
          <span>₹{grandTotal.toFixed(0)}</span>
        </div>
      </div>

      {visit.nextVisitDate && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: '#FCD34D', marginBottom: 12, padding: '6px 10px',
          background: 'rgba(245,158,11,0.08)', borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(245,158,11,0.2)',
        }}>
          <Calendar size={13} />
          <span>Next appointment: {visit.nextVisitDate}</span>
        </div>
      )}

      <button
        onClick={handleCollect}
        disabled={loading}
        style={{
          width: '100%', padding: '12px', borderRadius: 'var(--radius)',
          background: loading ? 'rgba(168,85,247,0.2)' : 'linear-gradient(135deg, #A855F7, #7C3AED)',
          border: 'none', color: 'white', fontWeight: 700, fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 15px rgba(168,85,247,0.3)',
          transition: 'var(--transition)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6
        }}
      >
        {loading ? (
          <span>Processing...</span>
        ) : (
          <>
            <Check size={16} />
            <span>Collect ₹{grandTotal.toFixed(0)} & Complete</span>
          </>
        )}
      </button>
    </div>
  )
}
