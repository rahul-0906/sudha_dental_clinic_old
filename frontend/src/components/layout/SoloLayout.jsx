import { useState } from 'react'
import { useSelector } from 'react-redux'
import PatientSearch from '../patient/PatientSearch'
import PatientRegistrationModal from '../patient/PatientRegistrationModal'
import QueueBoard from '../queue/QueueBoard'
import CheckoutPanel from '../checkout/CheckoutPanel'
import ConsultationForm from '../consultation/ConsultationForm'
import VisitHistory from '../patient/VisitHistory'
import XrayManager from '../xray/XrayManager'
import { ToothLogo } from './AppShell'
import { Phone, Calendar } from 'lucide-react'

export default function SoloLayout() {
  const [showRegModal, setShowRegModal] = useState(false)
  const selectedPatient = useSelector((state) => state.patient.selectedPatient)
  const queue = useSelector((state) => state.queue.queue)

  const checkoutPatients = queue.filter(v => v.status === 'CHECKOUT')

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left: Patient Search + Queue */}
      <div style={{
        width: 260, borderRight: '1px solid var(--border)', display: 'flex',
        flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-800)', flexShrink: 0,
      }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <PatientSearch />
          <button
            onClick={() => setShowRegModal(true)}
            className="btn-secondary"
            style={{ width: '100%', marginTop: 10, fontSize: 16, padding: '10px 12px', fontWeight: 600 }}
          >
            + Register New Patient
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <QueueBoard compact />
        </div>
      </div>

      {/* Right: Unified Workspace */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {!selectedPatient ? (
          <div style={{ textAlign: 'center', paddingTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ToothLogo size={48} />
            <h2 style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8 }}>
              Select a Patient to Begin
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Search for a patient or select one from the queue
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Patient Header */}
            <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, color: 'white', flexShrink: 0,
              }}>
                {selectedPatient.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedPatient.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={12} />
                    <span>{selectedPatient.phone}</span>
                  </span>
                  {selectedPatient.dob && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} />
                      <span>{selectedPatient.dob}</span>
                    </span>
                  )}
                  {selectedPatient.gender && <span>· {selectedPatient.gender}</span>}
                </div>
              </div>
            </div>

            {/* Checkout if pending */}
            {checkoutPatients.some(v => v.patient?.id === selectedPatient.id) && (
              <CheckoutPanel visit={checkoutPatients.find(v => v.patient?.id === selectedPatient.id)} />
            )}

            {/* Consultation Form */}
            <ConsultationForm />

            {/* X-ray Manager */}
            <XrayManager patientId={selectedPatient.id} />

            {/* Visit History */}
            <VisitHistory patientId={selectedPatient.id} />
          </div>
        )}
      </div>

      {showRegModal && <PatientRegistrationModal onClose={() => setShowRegModal(false)} />}
    </div>
  )
}
