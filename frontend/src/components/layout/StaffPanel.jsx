import { useState } from 'react'
import { useSelector } from 'react-redux'
import PatientSearch from '../patient/PatientSearch'
import PatientRegistrationModal from '../patient/PatientRegistrationModal'
import QueueBoard from '../queue/QueueBoard'
import CheckoutPanel from '../checkout/CheckoutPanel'
import { UserPlus, ListOrdered, CreditCard, CheckCircle } from 'lucide-react'

export default function StaffPanel() {
  const [showRegModal, setShowRegModal] = useState(false)
  const [activeTab, setActiveTab] = useState('queue')
  const queue = useSelector((state) => state.queue.queue)
  const checkoutPatients = queue.filter(v => v.status === 'CHECKOUT')

  return (
    <div className="p-5 flex flex-col h-full overflow-hidden">
      <div className="flex flex-col gap-4 shrink-0">
        <div className="flex flex-col gap-3">
          {/* Structural Header */}
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Queue Management</h2>

          {/* Search & Register Patient 2-Column Row */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 min-w-0">
              <PatientSearch />
            </div>
            <button
              type="button"
              onClick={() => setShowRegModal(true)}
              className="flex items-center justify-center shrink-0 w-10 h-10 bg-white text-teal-600 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 hover:text-teal-700 transition-colors cursor-pointer"
              title="Register New Patient"
            >
              <UserPlus size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center w-full bg-slate-200/50 p-1 rounded-lg gap-1">
          {['queue', 'checkout'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab 
                ? 'flex-1 h-8 flex items-center justify-center gap-2 bg-white text-teal-700 shadow-sm rounded-md text-sm font-semibold whitespace-nowrap transition-all cursor-pointer'
                : 'flex-1 h-8 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-md text-sm font-semibold whitespace-nowrap transition-all cursor-pointer'
              }
            >
              {tab === 'queue' ? (
                <>
                  <ListOrdered size={14} />
                  <span>Queue ({queue.filter(v => v.status !== 'DONE').length})</span>
                </>
              ) : (
                <>
                  <CreditCard size={14} />
                  <span>Checkout ({checkoutPatients.length})</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Section Divider */}
      <div className="w-full h-px bg-slate-200 my-4" />

      {activeTab === 'queue' ? (
        <div className="flex-1 overflow-y-auto">
          <QueueBoard compact staffView />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {checkoutPatients.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13, gap: 8 }}>
              <CheckCircle size={32} strokeWidth={1.5} style={{ color: 'var(--success)' }} />
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
