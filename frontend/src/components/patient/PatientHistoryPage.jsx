import { useState, useEffect, useRef } from 'react'
import { Search, User, Calendar, Phone, MapPin, Activity, Image, FileText, X, ChevronDown, ChevronUp, Upload, Trash2, ZoomIn, FileSpreadsheet, ClipboardList, Users, Pill } from 'lucide-react'
import { searchPatients, getVisitHistory } from '../../api/patients'
import { getPatientXrays, uploadXray, deleteXray, getXrayFileUrl } from '../../api/misc'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function PatientHistoryPage() {
  const [query, setQuery] = useState('')
  const [patients, setPatients] = useState([])
  const [loadingList, setLoadingList] = useState(false)
  const [selectedPat, setSelectedPat] = useState(null)
  
  // Selected patient details
  const [visits, setVisits] = useState([])
  const [xrays, setXrays] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [expandedVisit, setExpandedVisit] = useState(null)
  
  // Xray Upload
  const [uploadingXray, setUploadingXray] = useState(false)
  const [xrayNotes, setXrayNotes] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const fileInputRef = useRef()

  // Load patients list
  const loadPatients = async (searchVal) => {
    setLoadingList(true)
    try {
      const res = await searchPatients(searchVal)
      setPatients(res.data || [])
      // Auto-select first patient if none selected yet and patients exist
      if (res.data && res.data.length > 0 && !selectedPat) {
        setSelectedPat(res.data[0])
      }
    } catch (err) {
      toast.error('Failed to load patients list')
    } finally {
      setLoadingList(false)
    }
  }

  // Load patient clinical details (visits & xrays)
  const loadPatientDetails = async (patientId) => {
    if (!patientId) return
    setLoadingDetails(true)
    try {
      const [visitsRes, xraysRes] = await Promise.all([
        getVisitHistory(patientId),
        getPatientXrays(patientId)
      ])
      const fetchedVisits = visitsRes.data || []
      setVisits(fetchedVisits)
      setXrays(xraysRes.data || [])
      // Expand latest visit by default
      if (fetchedVisits.length > 0) {
        setExpandedVisit(fetchedVisits[0].id)
      } else {
        setExpandedVisit(null)
      }
    } catch (err) {
      toast.error('Failed to load patient history details')
    } finally {
      setLoadingDetails(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadPatients('')
  }, [])

  // Refetch details when patient changes
  useEffect(() => {
    if (selectedPat) {
      loadPatientDetails(selectedPat.id)
    } else {
      setVisits([])
      setXrays([])
      setExpandedVisit(null)
    }
  }, [selectedPat])

  // Handle Search Input (debounced)
  const debounceTimer = useRef()
  const handleSearchChange = (val) => {
    setQuery(val)
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      loadPatients(val)
    }, 300)
  }

  // X-ray File upload handler
  const handleXrayUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, etc.)')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File exceeds 20MB limit')
      return
    }

    setUploadingXray(true)
    try {
      const formData = new FormData()
      formData.append('patientId', selectedPat.id)
      if (xrayNotes) formData.append('notes', xrayNotes)
      formData.append('file', file)

      await uploadXray(formData)
      toast.success('X-ray uploaded successfully!')
      setXrayNotes('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      
      // Reload X-rays list
      const xraysRes = await getPatientXrays(selectedPat.id)
      setXrays(xraysRes.data || [])
    } catch (err) {
      toast.error('Failed to upload X-ray image')
    } finally {
      setUploadingXray(false)
    }
  }

  // Delete X-ray
  const handleDeleteXray = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this X-ray image?')) return
    try {
      await deleteXray(id)
      toast.success('X-ray deleted')
      setXrays(xrays.filter(x => x.id !== id))
    } catch (err) {
      toast.error('Failed to delete X-ray')
    }
  }

  // Helper: Calculate age from DOB
  const getAge = (dobString) => {
    if (!dobString) return ''
    try {
      const today = new Date()
      const birth = new Date(dobString)
      let age = today.getFullYear() - birth.getFullYear()
      const m = today.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return `${age} Yrs`
    } catch {
      return ''
    }
  }

  // Compute stats metrics
  const totalMedsPrescribed = visits.reduce((acc, visit) => acc + (visit.prescriptions?.length || 0), 0)

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* 1. LEFT PANEL: Patients Directory */}
      <div style={{
        width: 320,
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-800)',
        flexShrink: 0
      }}>
        {/* Search Header */}
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
            <Users size={16} />
            <span>Patient Directory</span>
          </h3>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none'
            }} />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by name or phone..."
              className="input-field"
              style={{ paddingLeft: 38, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Directory List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {loadingList ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
              Loading patient list...
            </div>
          ) : patients.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, color: 'var(--text-muted)', gap: 8 }}>
              <Users size={28} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
              <span>No patients found</span>
            </div>
          ) : (
            patients.map((pat) => {
              const isSelected = selectedPat && selectedPat.id === pat.id
              return (
                <div
                  key={pat.id}
                  onClick={() => setSelectedPat(pat)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: isSelected ? 'rgba(13,148,136,0.15)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--border-bright)' : 'transparent'}`,
                    transition: 'var(--transition)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--surface-hover)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0
                  }}>
                    {pat.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {pat.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      <Phone size={11} />
                      <span>{pat.phone}</span>
                    </div>
                  </div>
                  {pat.gender && (
                    <div style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-muted)' }}>
                      {pat.gender[0]}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 2. RIGHT PANEL: Details & History */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--bg-900)' }}>
        {!selectedPat ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ClipboardList size={64} color="var(--border-bright)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, color: 'var(--text-secondary)', fontWeight: 600, margin: '0 0 8px' }}>
              Select a Patient
            </h3>
            <p style={{ margin: 0, fontSize: 14, maxWidth: 300 }}>
              Select a patient from the directory on the left to view demographics, X-rays, and complete visit history.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Demographics Card */}
            <div className="card" style={{ padding: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 800, color: 'white',
                boxShadow: '0 4px 16px rgba(13,148,136,0.3)', flexShrink: 0
              }}>
                {selectedPat.name?.[0]?.toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedPat.name}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <Phone size={14} color="var(--primary-light)" />
                    <strong>Phone:</strong> {selectedPat.phone}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <Calendar size={14} color="var(--primary-light)" />
                    <strong>DOB / Age:</strong> {selectedPat.dob ? `${selectedPat.dob} (${getAge(selectedPat.dob)})` : 'N/A'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <User size={14} color="var(--primary-light)" />
                    <strong>Gender:</strong> {selectedPat.gender || 'N/A'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <MapPin size={14} color="var(--primary-light)" />
                    <strong>Address:</strong> {selectedPat.address || 'N/A'}
                  </div>
                </div>
                {selectedPat.createdAt && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    Registered on: {format(new Date(selectedPat.createdAt), 'dd MMM yyyy, hh:mm aa')}
                  </div>
                )}
              </div>
            </div>

            {/* Clinical Summary Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
              {/* Metric 1 */}
              <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: 'rgba(59,130,246,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA', flexShrink: 0
                }}>
                  <Activity size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{visits.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Visits</div>
                </div>
              </div>
              {/* Metric 2 */}
              <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: 'rgba(16,185,129,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399', flexShrink: 0
                }}>
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{totalMedsPrescribed}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Medicines Prescribed</div>
                </div>
              </div>
              {/* Metric 3 */}
              <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: 'rgba(20,184,166,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)', flexShrink: 0
                }}>
                  <Image size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{xrays.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>RVG X-Rays</div>
                </div>
              </div>
            </div>

            {/* X-Rays Gallery Module */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Image size={16} /> RVG X-Ray Archive ({xrays.length})
                </h3>
              </div>

              {/* Form & Upload */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                <input
                  type="text"
                  placeholder="Enter notes for new X-ray..."
                  value={xrayNotes}
                  onChange={(e) => setXrayNotes(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, minWidth: 200, fontSize: 13 }}
                />
                <button
                  onClick={() => !uploadingXray && fileInputRef.current.click()}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, height: 38, padding: '0 16px', cursor: uploadingXray ? 'wait' : 'pointer' }}
                >
                  <Upload size={14} />
                  {uploadingXray ? 'Uploading...' : 'Upload X-Ray'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleXrayUpload}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Grid Gallery */}
              {xrays.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  No clinical X-ray images archived for this patient.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                  {xrays.map((xray) => (
                    <div
                      key={xray.id}
                      style={{
                        position: 'relative',
                        borderRadius: 'var(--radius)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid var(--border)',
                        aspectRatio: '4/3',
                        background: 'var(--bg-800)'
                      }}
                      onClick={() => setLightbox(xray)}
                    >
                      <img
                        src={getXrayFileUrl(xray.fileName)}
                        alt={xray.notes || 'X-Ray'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)',
                        opacity: 0, transition: 'opacity 0.2s',
                        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                        padding: 6
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                      >
                        <ZoomIn size={16} color="white" />
                        <button
                          onClick={(e) => handleDeleteXray(xray.id, e)}
                          style={{ background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: 4, cursor: 'pointer', color: 'white', display: 'flex', padding: 3 }}
                          title="Delete X-ray"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '2px 6px', fontSize: 9, color: 'var(--text-muted)' }}>
                        {xray.uploadedAt ? format(new Date(xray.uploadedAt), 'dd MMM') : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visit Timeline */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ClipboardList size={16} /> Clinical Visit Timeline ({visits.length})
              </h3>

              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Loading clinical data history...
                </div>
              ) : visits.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, color: 'var(--text-muted)', gap: 8 }}>
                  <ClipboardList size={32} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                  <span>No past consultation visits recorded for this patient.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {visits.map((visit, index) => {
                    const isExpanded = expandedVisit === visit.id
                    const isLatest = index === 0

                    return (
                      <div
                        key={visit.id}
                        style={{
                          borderLeft: `2px solid ${isLatest ? 'var(--primary)' : 'var(--border)'}`,
                          paddingLeft: 20,
                          marginLeft: 10,
                          paddingBottom: 24,
                          position: 'relative'
                        }}
                      >
                        {/* Dot */}
                        <div style={{
                          position: 'absolute', left: -7, top: 4,
                          width: 12, height: 12, borderRadius: '50%',
                          background: isLatest ? 'var(--primary-light)' : 'var(--bg-600)',
                          border: `2px solid ${isLatest ? 'var(--primary)' : 'var(--border)'}`,
                          boxShadow: isLatest ? '0 0 8px var(--primary-light)' : 'none'
                        }} />

                        {/* Visit Card Wrapper */}
                        <div style={{
                          background: 'var(--surface)',
                          border: isExpanded ? '1px solid var(--border-bright)' : '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          overflow: 'hidden',
                          boxShadow: isExpanded ? 'var(--shadow-glow)' : 'none',
                          transition: 'var(--transition)'
                        }}>
                          {/* Card Header (clickable) */}
                          <div
                            onClick={() => setExpandedVisit(isExpanded ? null : visit.id)}
                            style={{
                              padding: '12px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              userSelect: 'none'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {visit.visitDate ? format(new Date(visit.visitDate), 'dd MMM yyyy') : 'Unknown Date'}
                              </span>
                              {isLatest && (
                                <span style={{
                                  background: 'rgba(20,184,166,0.15)', border: '1px solid var(--border-bright)',
                                  color: 'var(--primary-light)', fontSize: 9, fontWeight: 700,
                                  padding: '2px 6px', borderRadius: 4
                                }}>
                                  LATEST VISIT
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              {visit.diagnosis && (
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'inline-block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <strong>Dx:</strong> {visit.diagnosis}
                                </span>
                              )}
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                background: visit.status === 'DONE' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                color: visit.status === 'DONE' ? '#34D399' : '#FCD34D',
                                border: `1px solid ${visit.status === 'DONE' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`
                              }}>
                                {visit.status}
                              </span>
                              {visit.consultationFee && (
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-light)' }}>
                                  ₹{visit.consultationFee}
                                </span>
                              )}
                              {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                            </div>
                          </div>

                          {/* Card Content (expanded) */}
                          {isExpanded && (
                            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 12 }}>
                              {/* Diagnosis & Symptoms Row */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                {visit.symptoms && (
                                  <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.5px' }}>SYMPTOMS</div>
                                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                      {visit.symptoms}
                                    </p>
                                  </div>
                                )}
                                {visit.diagnosis && (
                                  <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.5px' }}>DIAGNOSIS</div>
                                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                      {visit.diagnosis}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Consultation Notes */}
                              {visit.consultationNotes && (
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.5px' }}>CLINICAL NOTES</div>
                                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, background: 'var(--bg-800)', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                    {visit.consultationNotes}
                                  </p>
                                </div>
                              )}

                              {/* Prescriptions */}
                              {visit.prescriptions && visit.prescriptions.length > 0 && (
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.5px' }}>DISPENSED MEDICATIONS</div>
                                  <div style={{ display: 'grid', gap: 6 }}>
                                    {visit.prescriptions.map((presc) => (
                                      <div key={presc.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '6px 12px', background: 'var(--bg-700)', borderRadius: 'var(--radius-sm)',
                                        fontSize: 12, border: '1px solid var(--border)'
                                      }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                          <Pill size={13} style={{ color: 'var(--primary-light)' }} />
                                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{presc.medicationName}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                          <span style={{ color: 'var(--text-secondary)' }}>
                                            Qty: <strong>{presc.quantityDispensed}</strong> {presc.unit}
                                          </span>
                                          {presc.unitPrice && (
                                            <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>
                                              ₹{presc.unitPrice * presc.quantityDispensed}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Next Visit Link */}
                              {visit.nextVisitDate && (
                                <div style={{
                                  marginTop: 4, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                                  background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
                                  fontSize: 12, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 8
                                }}>
                                  <Calendar size={13} />
                                  <span>Next Appointment Scheduled: <strong>{format(new Date(visit.nextVisitDate), 'dd MMM yyyy')}</strong></span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* 3. LIGHTBOX MODAL */}
      {lightbox && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 20
          }}
          onClick={() => setLightbox(null)}
        >
          <div style={{ position: 'relative' }}>
            <img
              src={getXrayFileUrl(lightbox.fileName)}
              alt={lightbox.notes}
              style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 'var(--radius)' }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightbox(null)}
              style={{
                position: 'absolute', top: -40, right: 0, background: 'rgba(255,255,255,0.1)',
                border: 'none', borderRadius: '50%', color: 'white', width: 32, height: 32,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
          {lightbox.notes && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, background: 'rgba(0,0,0,0.5)', padding: '6px 14px', borderRadius: 20 }}>
              <FileText size={13} />
              <span>{lightbox.notes}</span>
            </div>
          )}
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Uploaded: {lightbox.uploadedAt ? format(new Date(lightbox.uploadedAt), 'dd MMM yyyy, hh:mm aa') : ''} · Click outside to close
          </div>
        </div>
      )}

      <style>{`
        .input-field {
          height: 38px;
          background: var(--bg-900);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          padding: 0 12px;
          outline: none;
          transition: var(--transition);
        }
        .input-field:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px var(--primary-glow);
        }
      `}</style>
    </div>
  )
}
