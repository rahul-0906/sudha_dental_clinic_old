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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass" style={{ width: '100%', maxWidth: 420, borderRadius: 'var(--radius-xl)', padding: 28, boxShadow: '0 25px 60px rgba(0,0,0,0.5)', animation: 'slideIn 0.3s ease' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
          <FileText size={18} style={{ color: 'var(--primary)' }} />
          <span>Record Expense</span>
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ boxSizing: 'border-box' }}>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className="input-field" placeholder="Description (e.g., Purchased gloves boxes)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ boxSizing: 'border-box' }} />
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700 }}>₹</span>
            <input type="number" step="0.01" min="0.01" className="input-field" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ paddingLeft: 28, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 2 }}>
              {saving ? 'Saving...' : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Save size={16} />
                  <span>Record Expense</span>
                </span>
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
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-700)', borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Type', 'Category', 'Description', 'Amount'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No transactions for this period
                </td></tr>
              )}
              {transactions.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', transition: 'var(--transition)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12 }}>
                    {t.transactionDate ? format(new Date(t.transactionDate), 'dd MMM yyyy') : '-'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                      background: t.type === 'INCOME' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${t.type === 'INCOME' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      color: t.type === 'INCOME' ? '#34D399' : '#FC8181',
                    }}>{t.type}</span>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: 13 }}>{t.category || '-'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontSize: 13 }}>{t.description || '-'}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: 14, color: t.type === 'INCOME' ? '#34D399' : '#FC8181', textAlign: 'right' }}>
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
