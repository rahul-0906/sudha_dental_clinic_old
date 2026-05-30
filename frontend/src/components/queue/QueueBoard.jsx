import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTodayQueue, updateVisitStatusThunk } from '../../store/slices/queueSlice'
import { setSelectedPatient } from '../../store/slices/patientSlice'
import { getPatientById } from '../../api/patients'
import { format, formatDistanceToNow } from 'date-fns'
import { RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  WAITING: { label: 'Waiting', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', emoji: '⏳' },
  CONSULTATION: { label: 'Consultation', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', emoji: '🩺' },
  CHECKOUT: { label: 'Checkout', color: '#A855F7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', emoji: '💊' },
  DONE: { label: 'Done', color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', emoji: '✅' },
}

function PatientCard({ visit, onSelect, compact, nurseView }) {
  const dispatch = useDispatch()
  const sc = STATUS_CONFIG[visit.status] || STATUS_CONFIG.WAITING
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    const update = () => {
      if (visit.createdAt) {
        setElapsed(formatDistanceToNow(new Date(visit.createdAt), { addSuffix: true }))
      }
    }
    update()
    const t = setInterval(update, 30000)
    return () => clearInterval(t)
  }, [visit.createdAt])

  const handleStatusChange = async (newStatus) => {
    try {
      await dispatch(updateVisitStatusThunk({ visitId: visit.id, status: newStatus })).unwrap()
      toast.success(`${visit.patient?.name} moved to ${STATUS_CONFIG[newStatus]?.label}`)
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const handleSelectPatient = async () => {
    if (visit.patient?.id) {
      try {
        const res = await getPatientById(visit.patient.id)
        dispatch(setSelectedPatient(res.data))
        onSelect?.()
      } catch {
        dispatch(setSelectedPatient(visit.patient))
      }
    }
  }

  return (
    <div style={{
      padding: compact ? '10px 12px' : '14px 16px',
      background: 'var(--surface)',
      border: `1px solid var(--border)`,
      borderLeft: `3px solid ${sc.color}`,
      borderRadius: 'var(--radius)',
      marginBottom: 8,
      cursor: 'pointer',
      transition: 'var(--transition)',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.borderColor = sc.border; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={handleSelectPatient}>
        {/* Avatar */}
        <div style={{
          width: compact ? 36 : 40, height: compact ? 36 : 40, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${sc.color}40, ${sc.color}20)`,
          border: `1px solid ${sc.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: compact ? 16 : 18, fontWeight: 700, color: sc.color,
        }}>
          {visit.patient?.name?.[0]?.toUpperCase() || '?'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {visit.patient?.name || 'Unknown'}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
              background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, flexShrink: 0,
            }}>
              {sc.emoji} {sc.label}
            </span>
          </div>
          {!compact && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {visit.patient?.phone} · {elapsed}
            </div>
          )}
          {compact && elapsed && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{elapsed}</div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {visit.status !== 'DONE' && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {visit.status === 'WAITING' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleStatusChange('CONSULTATION') }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600,
                background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: 'var(--primary)', cursor: 'pointer',
              }}
            >
              🩺 Start Consult
            </button>
          )}
          {visit.status === 'CONSULTATION' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleStatusChange('CHECKOUT') }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600,
                background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#A855F7', cursor: 'pointer',
              }}
            >
              💊 Move to Checkout
            </button>
          )}
          {visit.status === 'CHECKOUT' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleStatusChange('DONE') }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600,
                background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34D399', cursor: 'pointer',
              }}
            >
              ✅ Mark Done
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function QueueBoard({ compact, nurseView }) {
  const dispatch = useDispatch()
  const { queue, loading } = useSelector((state) => state.queue)

  useEffect(() => {
    dispatch(fetchTodayQueue())
    const interval = setInterval(() => dispatch(fetchTodayQueue()), 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [dispatch])

  const waiting = queue.filter(v => v.status === 'WAITING')
  const consultation = queue.filter(v => v.status === 'CONSULTATION')
  const checkout = queue.filter(v => v.status === 'CHECKOUT')
  const done = queue.filter(v => v.status === 'DONE')

  if (compact) {
    const activeQueue = queue.filter(v => v.status !== 'DONE')
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-muted)' }}>
            TODAY'S QUEUE ({activeQueue.length})
          </div>
          <button onClick={() => dispatch(fetchTodayQueue())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <RefreshCw size={14} />
          </button>
        </div>
        {loading && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 15 }}>Loading...</div>}
        {!loading && activeQueue.length === 0 && (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 15 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🏥</div>
            Queue is empty
          </div>
        )}
        {activeQueue.map(v => <PatientCard key={v.id} visit={v} compact={compact} nurseView={nurseView} />)}
        {done.length > 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8, padding: '6px 0', borderTop: '1px solid var(--border)' }}>
            ✅ {done.length} patient{done.length !== 1 ? 's' : ''} seen today
          </div>
        )}
      </div>
    )
  }

  // Full Kanban view
  const columns = [
    { key: 'WAITING', data: waiting, ...STATUS_CONFIG.WAITING },
    { key: 'CONSULTATION', data: consultation, ...STATUS_CONFIG.CONSULTATION },
    { key: 'CHECKOUT', data: checkout, ...STATUS_CONFIG.CHECKOUT },
    { key: 'DONE', data: done, ...STATUS_CONFIG.DONE },
  ]

  return (
    <div style={{ padding: 20, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
          Today's Queue
        </h3>
        <button onClick={() => dispatch(fetchTodayQueue())}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 }}>
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>
      <div style={{ display: 'flex', gap: 12, flex: 1, overflow: 'hidden' }}>
        {columns.map(col => (
          <div key={col.key} style={{
            flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            background: 'var(--bg-800)', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
          }}>
            <div style={{
              padding: '10px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, boxShadow: `0 0 6px ${col.color}` }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: col.color }}>{col.label}</span>
              <span style={{
                marginLeft: 'auto', background: col.bg, color: col.color, border: `1px solid ${col.border}`,
                fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
              }}>
                {col.data.length}
              </span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
              {col.data.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: 12 }}>
                  {col.emoji} Empty
                </div>
              )}
              {col.data.map(v => <PatientCard key={v.id} visit={v} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
