import { useSelector } from 'react-redux'
import ConsultationForm from '../consultation/ConsultationForm'
import VisitHistory from '../patient/VisitHistory'
import XrayManager from '../xray/XrayManager'
import { ToothLogo } from './AppShell'
import { Phone } from 'lucide-react'

export default function DoctorPanel() {
  const selectedPatient = useSelector((state) => state.patient.selectedPatient)
  const queue = useSelector((state) => state.queue.queue)

  if (!selectedPatient) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-center p-6 bg-white">
        <div className="text-teal-600 mb-4">
          <ToothLogo size={56} />
        </div>
        <h3 className="text-slate-700 font-semibold text-lg mb-2">
          No Patient Selected
        </h3>
        <p className="text-slate-500 text-sm max-w-[280px]">
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Phone size={12} />
              <span>{selectedPatient.phone}</span>
            </span>
            {selectedPatient.gender && <span>· {selectedPatient.gender}</span>}
            {selectedPatient.dob && <span>· DOB: {selectedPatient.dob}</span>}
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
