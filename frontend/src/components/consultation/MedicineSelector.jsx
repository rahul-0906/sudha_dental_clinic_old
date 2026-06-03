import { useState, useRef, useCallback } from 'react'
import { X, Search, Package, AlertTriangle } from 'lucide-react'
import { searchMedications } from '../../api/medications'

export default function MedicineSelector({ selectedMeds, onAdd, onRemove, onQuantityChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)

  const handleSearch = useCallback((value) => {
    setQuery(value)
    if (!value.trim()) { setResults([]); setOpen(false); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchMedications(value)
        setResults(res.data || [])
        setOpen(true)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)
  }, [])

  const handleSelect = (med) => {
    if (!selectedMeds.find(m => m.id === med.id)) {
      onAdd({ ...med, quantity: 1 })
    }
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>
        <Package size={14} />
        <span>Add Medications</span>
      </label>

      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder="Search medicine name..."
          className="input-field"
          style={{ paddingLeft: 32, width: '100%', boxSizing: 'border-box' }}
        />

        {/* Dropdown */}
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            background: 'var(--surface)', border: '1px solid var(--border-bright)',
            borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', zIndex: 200,
            maxHeight: 240, overflowY: 'auto',
          }}>
            {loading && <div style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12 }}>Searching...</div>}
            {!loading && results.length === 0 && (
              <div style={{ padding: '14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                No medicines found for "{query}"
              </div>
            )}
            {!loading && results.map(med => {
              const isAdded = selectedMeds.find(m => m.id === med.id)
              const lowStock = med.currentStock <= med.reorderLevel
              return (
                <div key={med.id}
                  onClick={() => !isAdded && handleSelect(med)}
                  style={{
                    padding: '9px 14px', borderBottom: '1px solid var(--border)',
                    cursor: isAdded ? 'default' : 'pointer',
                    opacity: isAdded ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={(e) => { if (!isAdded) e.currentTarget.style.background = 'var(--surface-hover)' }}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                    background: med.category === 'DENTAL' ? 'rgba(13,148,136,0.1)' : 'rgba(59,130,246,0.1)',
                    color: med.category === 'DENTAL' ? 'var(--primary-light)' : '#93C5FD',
                    border: `1px solid ${med.category === 'DENTAL' ? 'var(--border-bright)' : 'rgba(59,130,246,0.3)'}`,
                    flexShrink: 0,
                  }}>
                    {med.category}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {med.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: lowStock ? 'var(--warning)' : 'var(--text-muted)' }}>
                      {lowStock && <AlertTriangle size={10} style={{ color: 'var(--warning)' }} />}
                      <span>Stock: {med.currentStock} {med.unit}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-light)', flexShrink: 0 }}>
                    ₹{med.unitSellingPrice}
                  </div>
                  {isAdded && <span style={{ fontSize: 11, color: 'var(--success)' }}>✓</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setOpen(false)} />}

      {/* Selected medicines list */}
      {selectedMeds.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {selectedMeds.map((med) => {
            const overStock = med.quantity > med.currentStock
            return (
              <div key={med.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                background: overStock ? 'rgba(239,68,68,0.08)' : 'var(--bg-700)',
                border: `1px solid ${overStock ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', fontSize: 13,
              }}>
                <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {med.name}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>({med.unit})</span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number"
                    value={med.quantity}
                    min={1}
                    max={med.currentStock}
                    onChange={(e) => onQuantityChange(med.id, parseInt(e.target.value) || 1)}
                    style={{
                      width: 54, textAlign: 'center', padding: '3px 6px',
                      background: 'var(--bg-600)', border: `1px solid ${overStock ? 'var(--danger)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 12,
                    }}
                  />
                </div>
                <span style={{ color: 'var(--primary-light)', fontWeight: 600, fontSize: 12, minWidth: 50, textAlign: 'right' }}>
                  ₹{(med.unitSellingPrice * med.quantity).toFixed(0)}
                </span>
                {overStock && <AlertTriangle size={14} style={{ color: 'var(--danger)' }} title="Exceeds stock!" />}
                <button onClick={() => onRemove(med.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }}>
                  <X size={14} />
                </button>
              </div>
            )
          })}
          <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--primary-light)', fontWeight: 700, paddingRight: 4 }}>
            Medicine Total: ₹{selectedMeds.reduce((acc, m) => acc + m.unitSellingPrice * m.quantity, 0).toFixed(0)}
          </div>
        </div>
      )}
    </div>
  )
}
