import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, ClipboardList, Pill, Calendar, PlusCircle } from 'lucide-react'
import { getVisitHistory } from '../../api/patients'
import { format } from 'date-fns'

const statusColors = {
  DONE: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: '#34D399' },
  CHECKOUT: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', color: '#C084FC' },
  CONSULTATION: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', color: '#93C5FD' },
  WAITING: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: '#FCD34D' },
}

function VisitCard({ visit, index }) {
  const [expanded, setExpanded] = useState(index === 0)
  const sc = statusColors[visit.status] || statusColors.DONE

  return (
    <div style={{
      borderLeft: `3px solid ${index === 0 ? 'var(--primary)' : 'var(--border)'}`,
      paddingLeft: 16, marginLeft: 8, marginBottom: 16, position: 'relative',
    }}>
      {/* Timeline dot */}
      <div style={{
        position: 'absolute', left: -8, top: 0,
        width: 13, height: 13, borderRadius: '50%',
        background: index === 0 ? 'var(--primary)' : 'var(--bg-600)',
        border: `2px solid ${index === 0 ? 'var(--primary-light)' : 'var(--border)'}`,
      }} />

      {/* Card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', overflow: 'hidden',
        transition: 'var(--transition)',
        boxShadow: index === 0 ? 'var(--shadow-glow)' : 'none',
      }}>
        {/* Header row */}
        <div
          style={{
            padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', userSelect: 'none',
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {visit.visitDate ? format(new Date(visit.visitDate), 'dd MMM yyyy') : 'Unknown date'}
              {index === 0 && (
                <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--primary-light)', fontWeight: 500 }}>
                  LATEST
                </span>
              )}
            </div>
            {visit.diagnosis && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Dx: {visit.diagnosis}
              </div>
            )}
          </div>
          <div style={{
            padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700,
            background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color,
          }}>
            {visit.status}
          </div>
          {visit.consultationFee && (
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-light)' }}>
              ₹{visit.consultationFee}
            </div>
          )}
          {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>

        {/* Expanded details */}
        {expanded && (
          <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
            {visit.symptoms && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3 }}>SYMPTOMS</div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{visit.symptoms}</p>
              </div>
            )}
            {visit.consultationNotes && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3 }}>CONSULTATION NOTES</div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{visit.consultationNotes}</p>
              </div>
            )}
            {visit.prescriptions && visit.prescriptions.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>MEDICATIONS PRESCRIBED</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {visit.prescriptions.map((p, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '5px 10px', background: 'var(--bg-700)', borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                    }}>
                      <Pill size={13} style={{ color: 'var(--primary-light)' }} />
                      <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 500 }}>
                        {p.medicationName || p.medication?.name}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Qty: {p.quantityDispensed} {p.unit}
                      </span>
                      {p.unitPrice && (
                        <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
                          ₹{(p.unitPrice * p.quantityDispensed).toFixed(0)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {visit.nextVisitDate && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginTop: 12, padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                fontSize: 12, color: '#FCD34D',
              }}>
                <Calendar size={13} />
                <span>Next visit: {format(new Date(visit.nextVisitDate), 'dd MMM yyyy')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function VisitHistory({ patientId }) {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!patientId) return
    setLoading(true)
    getVisitHistory(patientId)
      .then(res => setVisits(res.data || []))
      .catch(() => setVisits([]))
      .finally(() => setLoading(false))
  }, [patientId])

  if (!patientId) return null

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
        <ClipboardList size={16} />
        <span>Visit History ({visits.length} visit{visits.length !== 1 ? 's' : ''})</span>
      </h3>

      {loading && (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>
          Loading history...
        </div>
      )}

      {!loading && visits.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 30, gap: 8 }}>
          <PlusCircle size={28} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No previous visits recorded</p>
        </div>
      )}

      {!loading && visits.map((visit, i) => (
        <VisitCard key={visit.id} visit={visit} index={i} />
      ))}
    </div>
  )
}
