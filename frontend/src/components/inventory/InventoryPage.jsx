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
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 p-6 transition-all">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
          {med ? <Edit2 size={20} strokeWidth={1.5} className="text-teal-600" /> : <Plus size={20} strokeWidth={1.5} className="text-teal-600" />}
          <span>{med ? 'Edit Medicine' : 'Add Medicine'}</span>
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Medicine Name *</label>
            <input className="input-field w-full" placeholder="e.g. Amoxicillin 500mg" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</label>
              <select className="input-field w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="MEDICINE">Medicine</option>
                <option value="DENTAL">Dental Consumable</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</label>
              <input className="input-field w-full" placeholder="Tablet, ml..." value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Stock</label>
              <input type="number" className="input-field w-full" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reorder Level</label>
              <input type="number" className="input-field w-full" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost Price (₹)</label>
              <input type="number" step="0.01" className="input-field w-full" value={form.unitCostPrice} onChange={(e) => setForm({ ...form, unitCostPrice: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Selling Price (₹)</label>
              <input type="number" step="0.01" className="input-field w-full" value={form.unitSellingPrice} onChange={(e) => setForm({ ...form, unitSellingPrice: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-2">
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
        <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Medicine', 'Category', 'Unit', 'Stock', 'Reorder', 'Cost ₹', 'Selling ₹', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 text-sm">
                    <Package size={32} className="mx-auto mb-3 opacity-30 text-slate-400" />
                    No medicines found
                  </td>
                </tr>
              )}
              {filtered.map(med => {
                const low = med.currentStock <= med.reorderLevel
                return (
                  <tr key={med.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-none">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 whitespace-nowrap">{med.name}</td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        med.category === 'DENTAL' 
                          ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {med.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{med.unit}</td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <span className={low
                        ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"
                        : "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200"
                      }>
                        {med.currentStock} {med.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{med.reorderLevel}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">₹{med.unitCostPrice}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-teal-600 whitespace-nowrap">₹{med.unitSellingPrice}</td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <button 
                        onClick={() => { setModalMed(med); setShowModal(true) }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50/50 transition-colors cursor-pointer"
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
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
