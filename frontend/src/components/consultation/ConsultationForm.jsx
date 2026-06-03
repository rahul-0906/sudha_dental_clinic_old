import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import MedicineSelector from './MedicineSelector'
import { updateVisitStatus } from '../../api/visits'
import { fetchTodayQueue } from '../../store/slices/queueSlice'
import api from '../../api/axios'
import { Stethoscope, Save, CreditCard, Clock } from 'lucide-react'

export default function ConsultationForm({ visitId }) {
  const dispatch = useDispatch()
  const queue = useSelector((state) => state.queue.queue)
  const selectedPatient = useSelector((state) => state.patient.selectedPatient)

  // Find the active consultation visit
  const activeVisit = visitId
    ? queue.find(v => v.id === visitId)
    : queue.find(v => v.patient?.id === selectedPatient?.id && v.status === 'CONSULTATION')

  const [form, setForm] = useState({
    symptoms: activeVisit?.symptoms || '',
    consultationNotes: activeVisit?.consultationNotes || '',
    diagnosis: activeVisit?.diagnosis || '',
    consultationFee: activeVisit?.consultationFee || '',
    nextVisitDate: activeVisit?.nextVisitDate || '',
  })
  const [selectedMeds, setSelectedMeds] = useState([])
  const [saving, setSaving] = useState(false)

  if (!selectedPatient) return null

  const canConsult = activeVisit && activeVisit.status === 'CONSULTATION'
  const isWaiting = activeVisit && activeVisit.status === 'WAITING'

  const handleSave = async (moveToCheckout = false) => {
    if (!activeVisit) {
      toast.error('No active consultation visit found')
      return
    }
    setSaving(true)
    try {
      // Save consultation data
      await api.patch(`/visits/${activeVisit.id}/consultation`, {
        symptoms: form.symptoms,
        consultationNotes: form.consultationNotes,
        diagnosis: form.diagnosis,
        consultationFee: form.consultationFee ? parseFloat(form.consultationFee) : null,
        nextVisitDate: form.nextVisitDate || null,
        prescriptions: selectedMeds.map(m => ({ medicationId: m.id, quantity: m.quantity })),
      })

      if (moveToCheckout) {
        await updateVisitStatus(activeVisit.id, 'CHECKOUT')
        toast.success('Saved & moved to Checkout!')
      } else {
        toast.success('Consultation notes saved!')
      }
      dispatch(fetchTodayQueue())
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save consultation'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleStartConsult = async () => {
    if (!activeVisit) return
    try {
      await updateVisitStatus(activeVisit.id, 'CONSULTATION')
      dispatch(fetchTodayQueue())
      toast.success('Consultation started!')
    } catch {
      toast.error('Failed to start consultation')
    }
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Stethoscope size={16} />
          <span>Consultation</span>
        </h3>
        {activeVisit && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
            background: canConsult ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.1)',
            border: canConsult ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(245,158,11,0.3)',
            color: canConsult ? '#93C5FD' : '#FCD34D',
          }}>
            {canConsult ? (
              <>
                <Stethoscope size={12} />
                <span>IN CONSULTATION</span>
              </>
            ) : (
              <>
                <Clock size={12} />
                <span>WAITING</span>
              </>
            )}
          </div>
        )}
      </div>

      {!activeVisit && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          Patient must be in queue to start a consultation.
        </div>
      )}

      {isWaiting && (
        <button onClick={handleStartConsult} className="btn-primary" style={{ width: '100%', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Stethoscope size={16} />
          <span>Start Consultation</span>
        </button>
      )}

      {canConsult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Symptoms */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
              Presenting Symptoms
            </label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Patient's chief complaint and symptoms..."
              value={form.symptoms}
              onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          {/* Consultation Notes */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
              Consultation Notes
            </label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Examination findings, treatment performed..."
              value={form.consultationNotes}
              onChange={(e) => setForm({ ...form, consultationNotes: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          {/* Diagnosis */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
              Diagnosis
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g., Dental caries #36, Gingivitis..."
              value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Fee + Next Visit */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
                Consultation Fee (₹)
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="0"
                min={0}
                value={form.consultationFee}
                onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
                Next Visit Date
              </label>
              <input
                type="date"
                className="input-field"
                value={form.nextVisitDate}
                onChange={(e) => setForm({ ...form, nextVisitDate: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Medicine Selector */}
          <MedicineSelector
            selectedMeds={selectedMeds}
            onAdd={(med) => setSelectedMeds([...selectedMeds, med])}
            onRemove={(id) => setSelectedMeds(selectedMeds.filter(m => m.id !== id))}
            onQuantityChange={(id, qty) => setSelectedMeds(selectedMeds.map(m => m.id === id ? { ...m, quantity: qty } : m))}
          />

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              {saving ? 'Saving...' : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Save size={16} />
                  <span>Save Draft</span>
                </span>
              )}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="btn-primary"
              style={{ flex: 2 }}
            >
              {saving ? 'Saving...' : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <CreditCard size={16} />
                  <span>Save & Move to Checkout</span>
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
