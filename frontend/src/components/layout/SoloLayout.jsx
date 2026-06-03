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
    <div className="flex w-full h-full overflow-hidden">
      {/* Left: Patient Search + Queue */}
      <div className="w-[320px] shrink-0 border-r border-slate-200 bg-slate-50/50 flex flex-col h-full overflow-y-auto">
        <div className="p-4 border-b border-slate-200 shrink-0">
          <PatientSearch />
          <button
            onClick={() => setShowRegModal(true)}
            className="btn-secondary w-full mt-2.5 text-base py-2 px-3 font-semibold"
          >
            + Register New Patient
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <QueueBoard compact />
        </div>
      </div>

      {/* Right: Unified Workspace */}
      <div className="flex-1 bg-white flex flex-col h-full overflow-y-auto w-full">
        {!selectedPatient ? (
          <div className="flex flex-col items-center justify-center h-full w-full text-center p-6">
            <div className="text-teal-600 mb-4">
              <ToothLogo size={48} />
            </div>
            <h2 className="text-slate-700 font-semibold text-xl mb-2">
              Select a Patient to Begin
            </h2>
            <p className="text-slate-500 text-sm">
              Search for a patient or select one from the queue
            </p>
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-6">
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
