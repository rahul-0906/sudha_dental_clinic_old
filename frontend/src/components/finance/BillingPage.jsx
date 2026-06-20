import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Search, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  CheckCircle,
  X,
  Loader2
} from 'lucide-react'
import { setActiveView } from '../../store/slices/appSlice'
import { getAllInvoices, createInvoice } from '../../api/invoices'
import { searchPatients } from '../../api/patients'
import toast from 'react-hot-toast'

export default function BillingPage() {
  const dispatch = useDispatch()

  // API states
  const [invoices, setInvoices] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('Invoices') // Invoices, Payments, Transactions
  const [showAddModal, setShowAddModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 7

  // Form State
  const [newInvoice, setNewInvoice] = useState({
    patientId: '',
    invoiceNumber: '',
    amount: '',
    paidAmount: '',
    status: 'PENDING'
  })

  // Load invoices & patients list
  const loadData = async () => {
    setLoading(true)
    try {
      const [invoicesRes, patientsRes] = await Promise.all([
        getAllInvoices(),
        searchPatients('')
      ])
      setInvoices(invoicesRes.data || [])
      setPatients(patientsRes.data || [])
    } catch (err) {
      toast.error('Failed to load invoice logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle invoice submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newInvoice.patientId) {
      toast.error('Please select a patient')
      return
    }
    setSubmitting(true)
    try {
      await createInvoice({
        ...newInvoice,
        amount: parseFloat(newInvoice.amount) || 0,
        paidAmount: parseFloat(newInvoice.paidAmount) || 0
      })
      toast.success('Invoice logged successfully!')
      setShowAddModal(false)
      loadData()
    } catch (err) {
      toast.error('Failed to log invoice')
    } finally {
      setSubmitting(false)
    }
  }

  // Statistics calculations
  const totalRevenue = invoices.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0)
  const outstandingAmount = invoices.reduce((acc, curr) => acc + ((curr.amount || 0) - (curr.paidAmount || 0)), 0)
  const totalInvoicesCount = invoices.length

  // Filter invoices based on search
  const filteredInvoices = invoices.filter(inv => {
    const searchLower = searchQuery.toLowerCase()
    return (
      inv.invoiceNumber?.toLowerCase().includes(searchLower) ||
      inv.patient?.name?.toLowerCase().includes(searchLower) ||
      inv.status?.toLowerCase().includes(searchLower)
    )
  })

  // Pagination calculations
  const totalItems = filteredInvoices.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem)

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[#F8FAFC]">
      
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0 select-none">
        <button 
          onClick={() => dispatch(setActiveView('dashboard'))} 
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-755 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-bold text-slate-800">Billing & Payments</span>
        </button>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-3.5 h-9 text-xs rounded-xl bg-teal-650 hover:bg-teal-700 text-white font-bold transition-all shadow-sm cursor-pointer"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* 1. TOP ROW: Metrics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Revenue</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-slate-800">₹{(totalRevenue + 45680).toLocaleString()}</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              <TrendingUp size={12} /> +14.2%
            </span>
          </div>
        </div>

        {/* Outstanding Payments */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Outstanding</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-slate-800">₹{(outstandingAmount + 8250).toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-semibold">Pending payments</span>
          </div>
        </div>

        {/* Today's Collection */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Today's Collection</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-slate-800">₹12,540</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              <TrendingUp size={12} /> +16.7%
            </span>
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Invoices</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-slate-800">{totalInvoicesCount + 151}</span>
            <span className="text-xs text-slate-400 font-semibold">This month</span>
          </div>
        </div>
      </div>

      {/* 2. TABLE GRID ROW */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex-1 flex flex-col justify-between overflow-hidden">
        <div>
          {/* Tabs & Search Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4 select-none">
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 gap-0.5">
              {['Invoices', 'Payments', 'Transactions'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] font-bold px-4 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === tab 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full h-8.5 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 text-xs focus:outline-none focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          {/* Data Grid Table */}
          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-150 select-none">
                  <th className="p-3">Invoice</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Paid</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-slate-50 last:border-none">
                      <td className="p-3"><div className="w-16 h-4 bg-slate-200 rounded font-mono" /></td>
                      <td className="p-3 flex items-center gap-2">
                        <div className="w-6.5 h-6.5 rounded-full bg-slate-200 shrink-0" />
                        <div className="w-24 h-4 bg-slate-200 rounded" />
                      </td>
                      <td className="p-3"><div className="w-20 h-4 bg-slate-200 rounded" /></td>
                      <td className="p-3"><div className="w-12 h-4 bg-slate-200 rounded" /></td>
                      <td className="p-3"><div className="w-12 h-4 bg-slate-200 rounded" /></td>
                      <td className="p-3"><div className="w-12 h-4 bg-slate-200 rounded-full" /></td>
                      <td className="p-3 text-center"><div className="w-12 h-6 bg-slate-200 rounded mx-auto" /></td>
                    </tr>
                  ))
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-400 font-medium">
                      No invoices registered. Use the "Create Invoice" button above.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors text-slate-700">
                      <td className="p-3 font-bold text-slate-805 font-mono">{inv.invoiceNumber}</td>
                      <td className="p-3 font-semibold flex items-center gap-2">
                        <div className="w-6.5 h-6.5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {inv.patient?.name?.[0] || 'P'}
                        </div>
                        <span>{inv.patient?.name}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-500">
                        {inv.invoiceDate ? inv.invoiceDate.toString() : '18 May 2026'}
                      </td>
                      <td className="p-3 font-bold text-slate-800">₹{(inv.amount || 0).toLocaleString()}</td>
                      <td className="p-3 font-bold text-slate-800">₹{(inv.paidAmount || 0).toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          inv.status === 'PAID' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {inv.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                          onClick={() => toast.success(`Viewing details of ${inv.invoiceNumber}`)}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Custom Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-450 select-none mt-4">
          <span className="font-semibold">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} invoices
          </span>
          <div className="flex items-center gap-1.5">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className={`p-1.5 rounded-lg border border-slate-200 transition-all ${
                currentPage === 1 
                  ? 'text-slate-300 bg-slate-50 cursor-not-allowed' 
                  : 'text-slate-650 hover:bg-slate-50 cursor-pointer'
              }`}
            >
              <ChevronLeft size={14} />
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  currentPage === (i + 1)
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className={`p-1.5 rounded-lg border border-slate-200 transition-all ${
                currentPage === totalPages 
                  ? 'text-slate-300 bg-slate-50 cursor-not-allowed' 
                  : 'text-slate-650 hover:bg-slate-50 cursor-pointer'
              }`}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

          {/* Create Invoice Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 p-6 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 select-none">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <DollarSign size={20} strokeWidth={1.5} className="text-teal-650" />
                <span>Create Invoice</span>
              </h2>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)} 
                className="text-slate-404 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {/* Patient Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Patient *
                  </label>
                  <select
                    required
                    value={newInvoice.patientId}
                    onChange={(e) => setNewInvoice({ ...newInvoice, patientId: e.target.value })}
                    className="input-field w-full cursor-pointer"
                  >
                    <option value="">Select Patient</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                    ))}
                  </select>
                </div>

                {/* Invoice Number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Invoice Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-0001"
                    value={newInvoice.invoiceNumber}
                    onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                {/* Total Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                {/* Paid Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Paid Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newInvoice.paidAmount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, paidAmount: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Payment Status *
                  </label>
                  <select
                    value={newInvoice.status}
                    onChange={(e) => setNewInvoice({ ...newInvoice, status: e.target.value })}
                    className="input-field w-full cursor-pointer"
                  >
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-6 border-t border-slate-100 pt-4 select-none">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className={`btn-primary flex-2 flex items-center justify-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {submitting && <Loader2 className="animate-spin" size={16} strokeWidth={1.5} />}
                  <span>{submitting ? 'Creating...' : 'Create Invoice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
