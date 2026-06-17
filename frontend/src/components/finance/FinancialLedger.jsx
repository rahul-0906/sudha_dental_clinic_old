import { useState, useEffect } from 'react'
import { Plus, TrendingUp, TrendingDown, DollarSign, FileText, Save } from 'lucide-react'
import { getTransactions, addExpense } from '../../api/misc'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const EXPENSE_CATEGORIES = ['Supplies', 'Salary', 'Utility', 'Equipment', 'Maintenance', 'Rent', 'Other']

function ExpenseModal({ onClose, onSave }) {
  const [form, setForm] = useState({ category: 'Supplies', description: '', amount: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('Enter a valid amount'); return }
    setSaving(true)
    try {
      await addExpense({ ...form, amount: parseFloat(form.amount), type: 'EXPENSE' })
      toast.success('Expense recorded!')
      onSave()
      onClose()
    } catch { toast.error('Failed to save expense') }
    finally { setSaving(false) }
  }

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 p-6 transition-all">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
          <FileText size={20} strokeWidth={1.5} className="text-teal-600" />
          <span>Record Expense</span>
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</label>
            <select className="input-field w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</label>
            <input className="input-field w-full" placeholder="Description (e.g., Purchased gloves boxes)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input type="number" step="0.01" min="0.01" className="input-field w-full pl-7" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-2 flex items-center justify-center gap-2">
              {saving ? 'Saving...' : (
                <>
                  <Save size={16} strokeWidth={1.5} />
                  <span>Record Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FinancialLedger() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showExpenseModal, setShowExpenseModal] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getTransactions(startDate, endDate)
      setTransactions(res.data || [])
    } catch { toast.error('Failed to load transactions') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [startDate, endDate])

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((a, t) => a + parseFloat(t.amount || 0), 0)
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((a, t) => a + parseFloat(t.amount || 0), 0)
  const net = totalIncome - totalExpense

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            <DollarSign size={20} style={{ color: 'var(--primary)' }} />
            <span>Financial Ledger</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{transactions.length} transactions</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '7px 10px', fontSize: 13 }} />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>to</span>
          <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '7px 10px', fontSize: 13 }} />
          <button onClick={() => setShowExpenseModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Income', value: totalIncome, icon: TrendingUp, color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
          { label: 'Total Expenses', value: totalExpense, icon: TrendingDown, color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
          { label: 'Net Balance', value: net, icon: DollarSign, color: net >= 0 ? '#10B981' : '#EF4444', bg: net >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: net >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 'var(--radius)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>₹{Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading transactions...</div>
      ) : (
        <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Date', 'Type', 'Category', 'Description', 'Amount'].map(h => (
                  <th key={h} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No transactions for this period
                  </td>
                </tr>
              )}
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-none">
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {t.transactionDate ? format(new Date(t.transactionDate), 'dd MMM yyyy') : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <span className={t.type === 'INCOME' ? 'text-teal-600 font-medium' : 'text-red-600 font-medium'}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{t.category || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-900 whitespace-nowrap max-w-xs truncate" title={t.description}>
                    {t.description || '-'}
                  </td>
                  <td className={`px-6 py-4 text-sm font-semibold whitespace-nowrap text-right ${
                    t.type === 'INCOME' ? 'text-teal-600' : 'text-red-600'
                  }`}>
                    {t.type === 'INCOME' ? '+' : '-'}₹{parseFloat(t.amount).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showExpenseModal && <ExpenseModal onClose={() => setShowExpenseModal(false)} onSave={load} />}
    </div>
  )
}
