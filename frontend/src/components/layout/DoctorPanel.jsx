import { useSelector } from 'react-redux'
import ConsultationForm from '../consultation/ConsultationForm'
import VisitHistory from '../patient/VisitHistory'
import XrayManager from '../xray/XrayManager'

export default function DoctorPanel() {
  const selectedPatient = useSelector((state) => state.patient.selectedPatient)
  const queue = useSelector((state) => state.queue.queue)

  if (!selectedPatient) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
        <div style={{ fontSize: 56 }}>🦷</div>
        <h3 style={{ color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>
          No Patient Selected
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', maxWidth: 240 }}>
          Staff will assign a patient to consultation. Their details will appear here.
        </p>
      </div>
    )
  }

  const activeVisit = queue.find(
    v => v.patient?.id === selectedPatient.id && (v.status === 'CONSULTATION' || v.status === 'WAITING')
  )

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Patient Header */}
      <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 800, color: 'white', flexShrink: 0,
          boxShadow: '0 0 16px rgba(13,148,136,0.3)',
        }}>
          {selectedPatient.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
            {selectedPatient.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            📱 {selectedPatient.phone}
            {selectedPatient.gender && ` · ${selectedPatient.gender}`}
            {selectedPatient.dob && ` · DOB: ${selectedPatient.dob}`}
          </div>
        </div>
        {activeVisit && (
          <div style={{
            padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
            color: '#93C5FD',
          }}>
            IN CONSULTATION
          </div>
        )}
      </div>

      {/* Consultation Form */}
      <ConsultationForm visitId={activeVisit?.id} />

      {/* X-ray Manager */}
      <XrayManager patientId={selectedPatient.id} visitId={activeVisit?.id} />

      {/* Visit History */}
      <VisitHistory patientId={selectedPatient.id} />
    </div>
  )
}
