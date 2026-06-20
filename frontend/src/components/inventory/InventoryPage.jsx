import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Plus, Search, Edit2, Package, AlertTriangle, Pill, X, ArrowLeft, Loader2 } from 'lucide-react'
import { getAllMedications, createMedication, updateMedication, getLowStockAlerts } from '../../api/medications'
import { ToothLogo } from '../layout/AppShell'
import { setActiveView } from '../../store/slices/appSlice'
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 p-6 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 select-none">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {med ? <Edit2 size={20} strokeWidth={1.5} className="text-teal-650" /> : <Plus size={20} strokeWidth={1.5} className="text-teal-650" />}
            <span>{med ? 'Edit Medicine' : 'Add Medicine'}</span>
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-404 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Medicine Name */}
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Medicine Name *
              </label>
              <input 
                className="input-field w-full" 
                placeholder="e.g. Amoxicillin 500mg" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Category *
              </label>
              <select 
                className="input-field w-full cursor-pointer" 
                value={form.category} 
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="MEDICINE">Medicine</option>
                <option value="DENTAL">Dental Consumable</option>
              </select>
            </div>

            {/* Unit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Unit *
              </label>
              <input 
                className="input-field w-full" 
                placeholder="e.g. Tablet, ml, Cartridge" 
                value={form.unit} 
                onChange={(e) => setForm({ ...form, unit: e.target.value })} 
              />
            </div>

            {/* Current Stock */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Current Stock *
              </label>
              <input 
                type="number" 
                className="input-field w-full" 
                value={form.currentStock} 
                onChange={(e) => setForm({ ...form, currentStock: parseInt(e.target.value) || 0 })} 
              />
            </div>

            {/* Reorder Level */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Reorder Level *
              </label>
              <input 
                type="number" 
                className="input-field w-full" 
                value={form.reorderLevel} 
                onChange={(e) => setForm({ ...form, reorderLevel: parseInt(e.target.value) || 0 })} 
              />
            </div>

            {/* Cost Price */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Cost Price (₹) *
              </label>
              <input 
                type="number" 
                step="0.01" 
                className="input-field w-full" 
                value={form.unitCostPrice} 
                onChange={(e) => setForm({ ...form, unitCostPrice: e.target.value })} 
              />
            </div>

            {/* Selling Price */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Selling Price (₹) *
              </label>
              <input 
                type="number" 
                step="0.01" 
                className="input-field w-full" 
                value={form.unitSellingPrice} 
                onChange={(e) => setForm({ ...form, unitSellingPrice: e.target.value })} 
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-6 border-t border-slate-100 pt-4 select-none">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className={`btn-primary flex-2 flex items-center justify-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {saving && <Loader2 className="animate-spin" size={16} strokeWidth={1.5} />}
              <span>{saving ? 'Saving...' : med ? 'Update Medicine' : 'Add Medicine'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const dispatch = useDispatch()
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
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0 select-none">
        <div>
          <button 
            onClick={() => dispatch(setActiveView('dashboard'))} 
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-755 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-bold text-slate-800">Inventory Management</span>
          </button>
          <p className="text-[10px] text-slate-400 mt-1 font-medium ml-5">
            {meds.length} medicines · {lowStockCount} low stock alerts
          </p>
        </div>
        <button 
          onClick={() => { setModalMed(null); setShowModal(true) }} 
          className="flex items-center gap-1.5 px-4 h-10 text-xs rounded-xl bg-teal-650 hover:bg-teal-700 text-white font-bold transition-all shadow-sm cursor-pointer"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Low Stock Banner */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-2.5 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl shadow-sm text-xs text-amber-805 select-none">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <span><strong>{lowStockCount}</strong> items are running low on stock and need reordering.</span>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex items-center gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm select-none">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input 
            className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all" 
            placeholder="Search medicines..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div className="flex items-center gap-1.5">
          {['ALL', 'DENTAL', 'MEDICINE', 'LOW'].map(f => {
            const isSelected = filter === f
            return (
              <button 
                key={f} 
                onClick={() => setFilter(f)} 
                className={`
                  flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer border
                  ${isSelected 
                    ? 'bg-teal-50 text-teal-700 border-teal-200 shadow-sm' 
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                  }
                `}
              >
                {f === 'LOW' && <AlertTriangle size={14} />}
                {f === 'DENTAL' && <ToothLogo size={14} />}
                {f === 'MEDICINE' && <Pill size={14} />}
                <span>{f === 'LOW' ? 'Low Stock' : f === 'ALL' ? 'All' : f === 'DENTAL' ? 'Dental' : 'Medicine'}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
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
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-slate-100 last:border-none">
                  <td className="px-6 py-4"><div className="w-40 h-4 bg-slate-150 rounded" /></td>
                  <td className="px-6 py-4"><div className="w-16 h-4 bg-slate-150 rounded" /></td>
                  <td className="px-6 py-4"><div className="w-12 h-4 bg-slate-150 rounded" /></td>
                  <td className="px-6 py-4"><div className="w-10 h-4 bg-slate-150 rounded" /></td>
                  <td className="px-6 py-4"><div className="w-10 h-4 bg-slate-150 rounded" /></td>
                  <td className="px-6 py-4"><div className="w-12 h-4 bg-slate-150 rounded" /></td>
                  <td className="px-6 py-4"><div className="w-12 h-4 bg-slate-150 rounded" /></td>
                  <td className="px-6 py-4 text-center"><div className="w-16 h-6 bg-slate-150 rounded mx-auto" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500 text-sm">
                  <Package size={32} className="mx-auto mb-3 opacity-30 text-slate-400" />
                  No medicines found
                </td>
              </tr>
            ) : (
              filtered.map(med => {
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
                    <td className="px-6 py-4 text-sm font-semibold text-teal-650 whitespace-nowrap">₹{med.unitSellingPrice}</td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <button 
                        onClick={() => { setModalMed(med); setShowModal(true) }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-650 bg-white border border-slate-200 rounded-lg hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50/50 transition-colors cursor-pointer"
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                )
              }))}
            </tbody>
          </table>
        </div>

      {showModal && <MedModal med={modalMed} onClose={() => setShowModal(false)} onSave={load} />}
    </div>
  )
}
