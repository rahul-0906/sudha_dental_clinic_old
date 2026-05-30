import { useState } from 'react'
import { useSelector } from 'react-redux'
import PatientSearch from '../patient/PatientSearch'
import PatientRegistrationModal from '../patient/PatientRegistrationModal'
import QueueBoard from '../queue/QueueBoard'
import CheckoutPanel from '../checkout/CheckoutPanel'

export default function NursePanel() {
  const [showRegModal, setShowRegModal] = useState(false)
  const [activeTab, setActiveTab] = useState('queue')
  const queue = useSelector((state) => state.queue.queue)
  const checkoutPatients = queue.filter(v => v.status === 'CHECKOUT')

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Patient Search */}
      <PatientSearch />

      <button
        onClick={() => setShowRegModal(true)}
        className="btn-secondary"
        style={{ width: '100%', fontSize: 16, padding: '10px 12px', fontWeight: 600 }}
      >
        + Register New Patient
      </button>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        {['queue', 'checkout'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 600,
              background: activeTab === tab ? 'var(--primary-glow-bright)' : 'rgba(0,0,0,0.03)',
              border: activeTab === tab ? '1px solid var(--border-bright)' : '1px solid var(--border)',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {tab === 'queue' ? `🏥 Queue (${queue.filter(v => v.status !== 'DONE').length})` : `💊 Checkout (${checkoutPatients.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'queue' ? (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <QueueBoard compact nurseView />
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto' }}>
          {checkoutPatients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              No patients pending checkout
            </div>
          ) : (
            checkoutPatients.map(visit => (
              <CheckoutPanel key={visit.id} visit={visit} />
            ))
          )}
        </div>
      )}

      {showRegModal && <PatientRegistrationModal onClose={() => setShowRegModal(false)} />}
    </div>
  )
}
