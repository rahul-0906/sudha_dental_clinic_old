import { useState, useEffect } from 'react'
import { Users, DollarSign, Pill, TrendingDown, TrendingUp, Printer, BarChart3, FileText, Calendar } from 'lucide-react'
import { getDailyReport } from '../../api/misc'
import { getTransactions } from '../../api/misc'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function DailyReport() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [report, setReport] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [reportRes, txRes] = await Promise.all([
        getDailyReport(date),
        getTransactions(date, date),
      ])
      setReport(reportRes.data)
      setTransactions(txRes.data || [])
    } catch { toast.error('Failed to load report') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [date])

  const cards = report ? [
    { label: 'Patients Seen', value: report.patientCount || 0, icon: Users, unit: '', color: '#14B8A6', bg: 'rgba(20,184,166,0.1)', border: 'rgba(20,184,166,0.2)' },
    { label: 'Total Collections', value: `₹${(report.totalIncome || 0).toLocaleString('en-IN')}`, icon: DollarSign, unit: '', color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
    { label: 'Medicines Dispensed', value: report.medicinesSold || 0, icon: Pill, unit: 'items', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
    { label: 'Total Expenses', value: `₹${(report.totalExpense || 0).toLocaleString('en-IN')}`, icon: TrendingDown, unit: '', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
    { label: 'Net Income', value: `₹${(report.closingBalance || 0).toLocaleString('en-IN')}`, icon: TrendingUp, unit: '', color: (report.closingBalance || 0) >= 0 ? '#10B981' : '#EF4444', bg: (report.closingBalance || 0) >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: (report.closingBalance || 0) >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' },
  ] : []

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            <BarChart3 size={20} style={{ color: 'var(--primary)' }} />
            <span>Daily Closing Report</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Sudha Dental Clinic, Sankarankovil · Dr. Mariyappan
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '7px 10px', fontSize: 13 }} />
          <button onClick={() => window.print()} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>Loading report...</div>
      ) : !report ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
          <FileText size={48} strokeWidth={1.5} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No data for {format(new Date(date), 'dd MMM yyyy')}</p>
        </div>
      ) : (
        <>
          {/* Date Banner */}
          <div style={{
            padding: '12px 20px', marginBottom: 20, borderRadius: 'var(--radius)',
            background: 'rgba(13,148,136,0.08)', border: '1px solid var(--border-bright)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: 'var(--primary-light)' }}>
              <Calendar size={16} />
              <span>Report for: {format(new Date(date), 'EEEE, dd MMMM yyyy')}</span>
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Generated: {format(new Date(), 'hh:mm aa')}
            </span>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
            {cards.map(({ label, value, icon: Icon, color, bg, border, unit }) => (
              <div key={label} style={{
                background: bg, border: `1px solid ${border}`, borderRadius: 'var(--radius)',
                padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{label.toUpperCase()}</span>
                  <Icon size={18} color={color} />
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color }}>
                  {value}
                  {unit && <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>{unit}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Transactions breakdown */}
          {transactions.length > 0 && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Today's Transactions ({transactions.length})
              </h3>
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-700)', borderBottom: '1px solid var(--border)' }}>
                      {['Time', 'Type', 'Category', 'Description', 'Amount'].map(h => (
                        <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '9px 14px', color: 'var(--text-muted)', fontSize: 12 }}>
                          {t.createdAt ? format(new Date(t.createdAt), 'hh:mm aa') : '-'}
                        </td>
                        <td style={{ padding: '9px 14px' }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 6,
                            background: t.type === 'INCOME' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: t.type === 'INCOME' ? '#34D399' : '#FC8181',
                          }}>{t.type}</span>
                        </td>
                        <td style={{ padding: '9px 14px', color: 'var(--text-secondary)', fontSize: 12 }}>{t.category}</td>
                        <td style={{ padding: '9px 14px', color: 'var(--text-primary)', fontSize: 12 }}>{t.description || '-'}</td>
                        <td style={{ padding: '9px 14px', fontWeight: 700, fontSize: 13, color: t.type === 'INCOME' ? '#34D399' : '#FC8181', textAlign: 'right' }}>
                          {t.type === 'INCOME' ? '+' : '-'}₹{parseFloat(t.amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--bg-700)', borderTop: '2px solid var(--border-bright)' }}>
                      <td colSpan={4} style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary)', fontSize: 13 }}>
                        NET BALANCE
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 800, fontSize: 16, color: (report.closingBalance || 0) >= 0 ? '#34D399' : '#FC8181', textAlign: 'right' }}>
                        ₹{(report.closingBalance || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          header, button { display: none !important; }
        }
      `}</style>
    </div>
  )
}
