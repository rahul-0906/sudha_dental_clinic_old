import { useState, useRef } from 'react'
import { Upload, X, ZoomIn, Image, FileText } from 'lucide-react'
import { uploadXray, getPatientXrays, getXrayFileUrl, deleteXray } from '../../api/misc'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useEffect } from 'react'

export default function XrayManager({ patientId, visitId }) {
  const [xrays, setXrays] = useState([])
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [notes, setNotes] = useState('')
  const [linkVisit, setLinkVisit] = useState(true)
  const fileRef = useRef()

  const loadXrays = async () => {
    if (!patientId) return
    try {
      const res = await getPatientXrays(patientId)
      setXrays(res.data || [])
    } catch { }
  }

  useEffect(() => { loadXrays() }, [patientId])

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, etc.)')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 20MB.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('patientId', patientId)
      if (linkVisit && visitId) formData.append('visitId', visitId)
      if (notes) formData.append('notes', notes)
      formData.append('file', file)

      await uploadXray(formData)
      toast.success('X-ray uploaded successfully!')
      setNotes('')
      fileRef.current.value = ''
      await loadXrays()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this X-ray? This cannot be undone.')) return
    try {
      await deleteXray(id)
      toast.success('X-ray deleted')
      setXrays(xrays.filter(x => x.id !== id))
    } catch {
      toast.error('Failed to delete X-ray')
    }
  }

  if (!patientId) return null

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
        <Image size={16} />
        <span>RVG X-Rays ({xrays.length})</span>
      </h3>

      {/* Upload Zone */}
      <div style={{ marginBottom: 14 }}>
        <div
          onClick={() => !uploading && fileRef.current.click()}
          style={{
            border: '2px dashed var(--border-bright)', borderRadius: 'var(--radius)',
            padding: '16px', textAlign: 'center', cursor: uploading ? 'wait' : 'pointer',
            background: 'rgba(13,148,136,0.04)', transition: 'var(--transition)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(13,148,136,0.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.background = 'rgba(13,148,136,0.04)' }}
        >
          <Upload size={22} color="var(--primary-light)" style={{ marginBottom: 6 }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {uploading ? 'Uploading...' : 'Click or drop X-ray image here'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            JPG, PNG · Max 20MB
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <input
            type="text"
            className="input-field"
            placeholder="Notes for this X-ray (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ flex: 1, boxSizing: 'border-box', fontSize: 12 }}
          />
          {visitId && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
              <input type="checkbox" checked={linkVisit} onChange={(e) => setLinkVisit(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }} />
              Link to visit
            </label>
          )}
        </div>
      </div>

      {/* X-ray Gallery */}
      {xrays.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 12 }}>
          No X-rays uploaded yet
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
          {xrays.map((xray) => (
            <div
              key={xray.id}
              style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)', aspectRatio: '4/3' }}
              onClick={() => setLightbox(xray)}
            >
              <img
                src={getXrayFileUrl(xray.fileName)}
                alt={xray.notes || 'X-ray'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <div style={{
                position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
                opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: 4,
              }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
              >
                <ZoomIn size={14} color="white" />
                <button onClick={(e) => handleDelete(xray.id, e)} style={{ background: 'rgba(239,68,68,0.8)', border: 'none', borderRadius: 4, cursor: 'pointer', color: 'white', display: 'flex', padding: 2 }}>
                  <X size={12} />
                </button>
              </div>
              <div style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '1px 5px', fontSize: 9, color: 'var(--text-muted)' }}>
                {xray.uploadedAt ? format(new Date(xray.uploadedAt), 'dd/MM') : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 20,
          }}
          onClick={() => setLightbox(null)}
        >
          <img
            src={getXrayFileUrl(lightbox.fileName)}
            alt={lightbox.notes}
            style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 'var(--radius)' }}
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.notes && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
              <FileText size={14} />
              <span>{lightbox.notes}</span>
            </div>
          )}
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {lightbox.uploadedAt ? format(new Date(lightbox.uploadedAt), 'dd MMM yyyy, hh:mm aa') : ''} · Click outside to close
          </div>
        </div>
      )}
    </div>
  )
}
