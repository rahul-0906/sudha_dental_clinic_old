import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Package, AlertTriangle, Pill } from 'lucide-react'
import { getAllMedications, createMedication, updateMedication, getLowStockAlerts } from '../../api/medications'
import { ToothLogo } from '../layout/AppShell'
import toast from 'react-hot-toast'

const EMPTY_FORM = { name: '', category: 'MEDICINE', unit: 'Tablet', currentStock: 0, reorderLevel: 10, unitCostPrice: '', unitSellingPrice: '' }

function MedModal({ med, onClose, onSave }) {
  const [form, setForm] = useState(med || EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Medicine name required'); return }
    setSaving(true)
    try {
      if (med) {
        await updateMedication(med.id, form)
        toast.success('Medicine updated!')
      } else {
        await createMedication(form)
        toast.success('Medicine added!')
      }
      onSave()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass" style={{ width: '100%', maxWidth: 480, borderRadius: 'var(--radius-xl)', padding: 28, boxShadow: '0 25px 60px rgba(0,0,0,0.5)', animation: 'slideIn 0.3s ease' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
          {med ? <Edit2 size={18} style={{ color: 'var(--primary)' }} /> : <Plus size={18} style={{ color: 'var(--primary)' }} />}
          <span>{med ? 'Edit Medicine' : 'Add Medicine'}</span>
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input-field" placeholder="Medicine name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ flex: 1, boxSizing: 'border-box' }}>
              <option value="MEDICINE">Medicine</option>
              <option value="DENTAL">Dental Consumable</option>
            </select>
            <input className="input-field" placeholder="Unit (Tablet, ml...)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} style={{ flex: 1, boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Current Stock</label>
              <input type="number" className="input-field" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: parseInt(e.target.value) || 0 })} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Reorder Level</label>
              <input type="number" className="input-field" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: parseInt(e.target.value) || 0 })} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Cost Price (₹)</label>
              <input type="number" step="0.01" className="input-field" value={form.unitCostPrice} onChange={(e) => setForm({ ...form, unitCostPrice: e.target.value })} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Selling Price (₹)</label>
              <input type="number" step="0.01" className="input-field" value={form.unitSellingPrice} onChange={(e) => setForm({ ...form, unitSellingPrice: e.target.value })} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 2 }}>
              {saving ? 'Saving...' : med ? 'Update Medicine' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const [meds, setMeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [modalMed, setModalMed] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [lowStockCount, setLowStockCount] = useState(0)

  const load = async () => {
    setLoading(true)
    try {
      const [allRes, lowRes] = await Promise.all([getAllMedications(), getLowStockAlerts()])
      setMeds(allRes.data || [])
      setLowStockCount(lowRes.data?.length || 0)
    } catch { toast.error('Failed to load inventory') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = meds.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'ALL' ? true
      : filter === 'DENTAL' ? m.category === 'DENTAL'
      : filter === 'MEDICINE' ? m.category === 'MEDICINE'
      : m.currentStock <= m.reorderLevel
    return matchSearch && matchFilter
  })

  const getStockColor = (med) => {
    if (med.currentStock <= 0) return 'var(--danger)'
    if (med.currentStock <= med.reorderLevel) return 'var(--warning)'
    return 'var(--success)'
  }

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            <Package size={20} style={{ color: 'var(--primary)' }} />
            <span>Inventory</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            {meds.length} medicines · {lowStockCount} low stock alerts
          </p>
        </div>
        <button onClick={() => { setModalMed(null); setShowModal(true) }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} />
          Add Medicine
        </button>
      </div>

      {/* Low Stock Banner */}
      {lowStockCount > 0 && (
        <div style={{
          padding: '10px 16px', borderRadius: 'var(--radius)', marginBottom: 16,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#FCD34D',
        }}>
          <AlertTriangle size={16} color="#F59E0B" />
          <span><strong>{lowStockCount}</strong> items are running low on stock and need reordering.</span>
        </div>
      )}

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="input-field" placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 34, width: '100%', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['ALL', 'DENTAL', 'MEDICINE', 'LOW'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: filter === f ? 'rgba(13,148,136,0.2)' : 'rgba(255,255,255,0.04)',
              border: filter === f ? '1px solid var(--border-bright)' : '1px solid var(--border)',
              color: filter === f ? 'var(--primary-light)' : 'var(--text-muted)',
            }}>
              {f === 'LOW' && <AlertTriangle size={12} />}
              {f === 'DENTAL' && <ToothLogo size={12} />}
              {f === 'MEDICINE' && <Pill size={12} />}
              <span>{f === 'LOW' ? 'Low' : f === 'ALL' ? 'All' : f === 'DENTAL' ? 'Dental' : 'Medicine'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading inventory...</div>
      ) : (
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-700)', borderBottom: '1px solid var(--border)' }}>
                {['Medicine', 'Category', 'Unit', 'Stock', 'Reorder', 'Cost ₹', 'Selling ₹', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  <Package size={32} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
                  No medicines found
                </td></tr>
              )}
              {filtered.map(med => {
                const low = med.currentStock <= med.reorderLevel
                return (
                  <tr key={med.id} style={{ borderBottom: '1px solid var(--border)', transition: 'var(--transition)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{med.name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                        background: med.category === 'DENTAL' ? 'rgba(13,148,136,0.1)' : 'rgba(59,130,246,0.1)',
                        color: med.category === 'DENTAL' ? 'var(--primary-light)' : '#93C5FD',
                        border: `1px solid ${med.category === 'DENTAL' ? 'var(--border-bright)' : 'rgba(59,130,246,0.3)'}`,
                      }}>{med.category}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 13 }}>{med.unit}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: getStockColor(med), fontSize: 13 }}>{med.currentStock}</span>
                        <div style={{ flex: 1, height: 4, background: 'var(--bg-700)', borderRadius: 2, minWidth: 50 }}>
                          <div style={{
                            height: '100%', borderRadius: 2,
                            width: `${Math.min(100, (med.currentStock / Math.max(med.reorderLevel * 3, 1)) * 100)}%`,
                            background: getStockColor(med), transition: 'width 0.3s',
                          }} />
                        </div>
                        {low && <AlertTriangle size={12} color="var(--warning)" />}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 13 }}>{med.reorderLevel}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 13 }}>₹{med.unitCostPrice}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--primary-light)', fontWeight: 600, fontSize: 13 }}>₹{med.unitSellingPrice}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => { setModalMed(med); setShowModal(true) }}
                        style={{ background: 'none', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary-light)'; e.currentTarget.style.borderColor = 'var(--primary)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                        <Edit2 size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <MedModal med={modalMed} onClose={() => setShowModal(false)} onSave={load} />}
    </div>
  )
}
