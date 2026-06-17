import { useState, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Search, X, User, Phone } from 'lucide-react'
import { searchPatients } from '../../api/patients'
import { setSelectedPatient } from '../../store/slices/patientSlice'
import { addToQueue, updateVisitStatus } from '../../api/visits'
import { fetchTodayQueue } from '../../store/slices/queueSlice'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function PatientSearch() {
  const dispatch = useDispatch()
  const isStaffMode = useSelector((state) => state.app.isStaffAvailable)
  const queue = useSelector((state) => state.queue.queue)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)

  const handleSearch = useCallback((value) => {
    setQuery(value)
    if (!value.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchPatients(value)
        setResults(res.data || [])
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [])

  const handleSelect = async (patient) => {
    if (!isStaffMode) {
      // Solo Mode (Doctor view): bypass queue and instantly start consultation
      try {
        const existingVisit = queue.find(v => v.patient?.id === patient.id && v.status !== 'DONE')
        if (existingVisit) {
          if (existingVisit.status === 'WAITING') {
            await updateVisitStatus(existingVisit.id, 'CONSULTATION')
            toast.success(`Consultation started for ${patient.name}`)
          } else {
            toast.success(`${patient.name} selected`)
          }
        } else {
          const res = await addToQueue(patient.id)
          const newVisit = res.data
          await updateVisitStatus(newVisit.id, 'CONSULTATION')
          toast.success(`Bypassed queue and started consultation for ${patient.name}`)
        }
        dispatch(fetchTodayQueue())
      } catch (err) {
        console.error('Failed to automatically start consultation', err)
        toast.error('Failed to start consultation')
      }
    } else {
      toast.success(`${patient.name} selected`)
    }

    dispatch(setSelectedPatient(patient))
    setQuery(patient.name)
    setOpen(false)
  }

  const handleAddToQueue = async (patient, e) => {
    e.stopPropagation()
    try {
      await addToQueue(patient.id)
      dispatch(fetchTodayQueue())
      dispatch(setSelectedPatient(patient))
      setQuery(patient.name)
      setOpen(false)
      toast.success(`${patient.name} added to queue!`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Already in today\'s queue'
      toast.error(msg)
    }
  }

  const clear = () => {
    setQuery('')
    setResults([])
    setOpen(false)
    dispatch(setSelectedPatient(null))
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', pointerEvents: 'none',
        }} />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder="Search patient by name or phone..."
          className="w-full h-10 bg-white border border-slate-200 rounded-lg pl-10 pr-10 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-shadow"
        />
        {query && (
          <button onClick={clear} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
            display: 'flex', padding: 2,
          }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--surface)', border: '1px solid var(--border-bright)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
          zIndex: 200, maxHeight: 320, overflowY: 'auto',
          animation: 'slideIn 0.15s ease',
        }}>
          {loading && (
            <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>
              <span style={{
                display: 'inline-block', width: 14, height: 14,
                border: '2px solid var(--border)', borderTopColor: 'var(--primary)',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 8,
              }} />
              Searching...
            </div>
          )}

          {!loading && results.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', color: 'var(--text-muted)', fontSize: 14, gap: 6 }}>
              <User size={24} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
              <span>No patients found for "{query}"</span>
            </div>
          )}

          {!loading && results.map((patient) => (
            <div
              key={patient.id}
              onClick={() => handleSelect(patient)}
              style={{
                padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: 'white',
              }}>
                {patient.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {patient.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  <Phone size={11} />
                  <span>{patient.phone}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isStaffMode) {
                    handleSelect(patient)
                  } else {
                    handleAddToQueue(patient, e)
                  }
                }}
                className="btn-primary"
                style={{ fontSize: 13, padding: '6px 12px', flexShrink: 0 }}
              >
                {isStaffMode ? '+ Queue' : 'Consult'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Click away to close */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 199 }}
          onClick={() => setOpen(false)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
