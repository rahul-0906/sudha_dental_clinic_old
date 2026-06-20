import { useState, useEffect, useRef } from 'react'
import { 
  Search, 
  User, 
  Calendar, 
  Phone, 
  MapPin, 
  Activity, 
  Image, 
  FileText, 
  X, 
  Upload, 
  Trash2, 
  ZoomIn, 
  Users, 
  UserPlus, 
  Mail,
  ArrowLeft,
  Droplet,
  Loader2
} from 'lucide-react'
import { searchPatients, getPatientById } from '../../api/patients'
import PatientRegistrationModal from './PatientRegistrationModal'
import { getPatientXrays, uploadXray, deleteXray, getXrayFileUrl } from '../../api/misc'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { setActiveView } from '../../store/slices/appSlice'

export default function PatientHistoryPage({ defaultPatientId }) {
  const dispatch = useDispatch()
  
  // Sidebar Directory States
  const [query, setQuery] = useState('')
  const [patients, setPatients] = useState([])
  const [loadingList, setLoadingList] = useState(false)
  const [selectedPat, setSelectedPat] = useState(null)
  const [showRegModal, setShowRegModal] = useState(false)
  
  // Selected Patient Clinical Details
  const [xrays, setXrays] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)

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
      const list = res.data || []
      setPatients(list)
      // Auto-select first patient if none selected yet and no defaultPatientId
      if (list.length > 0 && !selectedPat && !defaultPatientId) {
        setSelectedPat(list[0])
      }
    } catch (err) {
      toast.error('Failed to load patients list')
    } finally {
      setLoadingList(false)
    }
  }

  // Load patient clinical details (xrays)
  const loadPatientDetails = async (patientId) => {
    if (!patientId) return
    setLoadingDetails(true)
    try {
      const xraysRes = await getPatientXrays(patientId)
      setXrays(xraysRes.data || [])
    } catch (err) {
      toast.error('Failed to load patient X-ray details')
    } finally {
      setLoadingDetails(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (defaultPatientId) {
      // Load specific patient
      getPatientById(defaultPatientId)
        .then(res => {
          setSelectedPat(res.data)
        })
        .catch(() => {
          toast.error('Failed to load patient details')
        })
    } else {
      loadPatients('')
    }
  }, [defaultPatientId])

  // Refetch details when patient changes
  useEffect(() => {
    if (selectedPat) {
      loadPatientDetails(selectedPat.id)
    } else {
      setXrays([])
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



  return (
    <div className="flex h-full w-full overflow-hidden bg-[#F8FAFC]">
      
      {/* 1. LEFT SIDEBAR: Patients Directory */}
      <div className="w-[280px] border-r border-slate-200 flex flex-col overflow-hidden bg-white shrink-0">
        
        {/* Directory Header */}
        <div className="p-4 border-b border-slate-200 shrink-0">
          <h3 className="flex items-center gap-1.5 mb-3 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Users size={16} strokeWidth={1.5} className="text-teal-600" />
            <span>Patient Directory</span>
          </h3>
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowRegModal(true)}
              title="Register New Patient"
              className="flex items-center justify-center shrink-0 w-10 h-10 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer"
            >
              <UserPlus size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Directory List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loadingList ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Loading patient list...
            </div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Users size={24} strokeWidth={1.5} className="text-slate-305" />
              <span className="text-[11px]">No patients found</span>
            </div>
          ) : (
            patients.map((pat) => {
              const isSelected = selectedPat && selectedPat.id === pat.id
              return (
                <div
                  key={pat.id}
                  onClick={() => setSelectedPat(pat)}
                  className={`p-2.5 rounded-xl cursor-pointer mb-1 flex items-center gap-3 transition-colors border-l-4 ${
                    isSelected 
                      ? 'border-teal-600 bg-teal-50/50 text-teal-700' 
                      : 'border-transparent bg-transparent text-slate-700 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {pat.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold truncate ${isSelected ? 'text-teal-900' : 'text-slate-800'}`}>
                      {pat.name}
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] mt-0.5 ${isSelected ? 'text-teal-605' : 'text-slate-400'}`}>
                      <Phone size={10} strokeWidth={1.5} className="shrink-0" />
                      <span className="truncate">{pat.phone}</span>
                    </div>
                  </div>
                  {pat.gender && (
                    <div className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${isSelected ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'}`}>
                      {pat.gender[0]}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 2. RIGHT WORKSPACE: Demographics Card & Tabbed Canvas */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        
        {/* Navigation / Page Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <button 
            onClick={() => dispatch(setActiveView('dashboard'))} 
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Patient Records</span>
          </button>
          <div />
        </div>

        {!selectedPat ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center py-20 text-slate-400">
            <ClipboardList size={48} className="text-slate-300 mb-4 animate-bounce-slow" />
            <h4 className="text-sm font-bold text-slate-700">Select a Patient</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">Select a patient from the directory on the left to view timelines, charts, and histories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[35fr_65fr] gap-6 items-start w-full">
            
            {/* 2.1 LEFT COLUMN: Demographic Profile details & Stats */}
            <div className="flex flex-col gap-6">
              
              {/* Priya Nair Demographics Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col items-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-2xl font-black text-white shadow">
                    {selectedPat.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="absolute bottom-0.5 right-0.5 bg-emerald-500 border-2 border-white w-4.5 h-4.5 rounded-full flex items-center justify-center" title="Active Patient" />
                </div>

                <h3 className="text-base font-black text-slate-850 mt-4 text-center">{selectedPat.name}</h3>
                <span className="text-[10px] font-semibold text-slate-400 mt-0.5">PID: PT-2025-{String(selectedPat.id).padStart(4, '0')}</span>

                <div className="flex gap-2 mt-3">
                  <span className="bg-slate-50 border border-slate-200 text-slate-650 text-[10px] font-bold px-3 py-0.5 rounded-full">
                    Active
                  </span>
                </div>

                {/* Details Table */}
                <div className="w-full flex flex-col gap-2.5 text-xs mt-6 border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-400 flex items-center gap-1.5"><Phone size={14} className="text-slate-400" /> Phone</span>
                    <span className="font-bold text-slate-700 text-right">{selectedPat.phone}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-400 flex items-center gap-1.5"><Mail size={14} className="text-slate-400" /> Email</span>
                    <span className="font-bold text-slate-700 text-right truncate max-w-[150px]">{selectedPat.name?.toLowerCase().replace(' ', '')}@email.com</span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-400 flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" /> DOB / Age</span>
                    <span className="font-bold text-slate-700 text-right">{selectedPat.dob ? `${selectedPat.dob} (${getAge(selectedPat.dob)})` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-400 flex items-center gap-1.5"><User size={14} className="text-slate-400" /> Gender</span>
                    <span className="font-bold text-slate-700 text-right">{selectedPat.gender || 'Female'}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-400 flex items-center gap-1.5"><Droplet size={14} className="text-slate-450" /> Blood Group</span>
                    <span className="font-bold text-slate-700 text-right">B+</span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-400 flex items-center gap-1.5"><Activity size={14} className="text-slate-400" /> Allergies</span>
                    <span className="font-bold text-rose-600 text-right">Penicillin</span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-400 flex items-center gap-1.5"><MapPin size={14} className="text-slate-405" /> Address</span>
                    <span className="font-bold text-slate-700 text-right leading-tight max-w-[160px]">{selectedPat.address || '123 Main St, Sankarankovil, TN'}</span>
                  </div>
                </div>
              </div>



            </div>

            {/* 2.2 RIGHT COLUMN: X-Ray Archive */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm min-h-[500px] flex flex-col">
              
              <div className="border-b border-slate-100 pb-3 mb-4 shrink-0 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Image size={18} strokeWidth={1.5} className="text-teal-605" />
                  <span>X-Ray Archive</span>
                </h3>
              </div>

              {/* Notes & File picker Upload block */}
              <div className="flex flex-wrap gap-2 items-center border-b border-slate-100 pb-4 mb-2 shrink-0">
                <input
                  type="text"
                  placeholder="Add notes for this X-ray..."
                  value={xrayNotes}
                  onChange={(e) => setXrayNotes(e.target.value)}
                  className="flex-1 min-w-[200px] h-9 px-3 bg-slate-50 border border-slate-205 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={() => !uploadingXray && fileInputRef.current.click()}
                  className={`btn-primary flex items-center gap-1.5 text-xs h-9 ${uploadingXray ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={uploadingXray}
                >
                  {uploadingXray ? (
                    <Loader2 className="animate-spin" size={14} strokeWidth={1.5} />
                  ) : (
                    <Upload size={14} strokeWidth={1.5} />
                  )}
                  <span>{uploadingXray ? 'Uploading...' : 'Upload X-Ray'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleXrayUpload}
                  className="hidden"
                />
              </div>

              {/* X-Ray Grid Gallery */}
              <div className="flex-1 overflow-y-auto mt-4">
                {loadingDetails ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Loading X-rays...
                  </div>
                ) : xrays.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs italic">
                    No X-ray files archived.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {xrays.map((xray) => (
                      <div
                        key={xray.id}
                        className="relative rounded-xl overflow-hidden cursor-pointer border border-slate-200 aspect-[4/3] flex items-center justify-center bg-slate-50 group hover:shadow-md transition-all"
                        onClick={() => setLightbox(xray)}
                      >
                        <img
                          src={getXrayFileUrl(xray.fileName)}
                          alt={xray.notes || 'X-Ray'}
                          className="absolute inset-0 w-full h-full object-cover z-10"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                        <Image size={24} className="text-slate-300" />
                        
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-end justify-between p-2">
                          <ZoomIn size={16} className="text-white" />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteXray(xray.id, e) }}
                            className="bg-rose-600/90 text-white rounded p-1 hover:bg-rose-700 transition-all cursor-pointer"
                            title="Delete X-ray"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="absolute top-2 right-2 bg-black/60 rounded px-1.5 py-0.5 text-[9px] text-white z-20 font-bold">
                          {xray.uploadedAt ? format(new Date(xray.uploadedAt), 'dd MMM') : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 3. LIGHTBOX LIGHTBOX */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-[90vw] max-h-[80vh]">
            <img
              src={getXrayFileUrl(lightbox.fileName)}
              alt={lightbox.notes || 'X-Ray'}
              className="object-contain max-w-full max-h-full rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 bg-white/10 hover:bg-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer border-none"
            >
              <X size={18} />
            </button>
          </div>
          {lightbox.notes && (
            <div className="bg-black/60 border border-slate-800 text-white text-xs px-4 py-2 rounded-full flex items-center gap-1.5">
              <FileText size={14} />
              <span>{lightbox.notes}</span>
            </div>
          )}
          <div className="text-[10px] text-slate-500">
            Uploaded: {lightbox.uploadedAt ? format(new Date(lightbox.uploadedAt), 'dd MMM yyyy, hh:mm aa') : ''} · Click outside to close
          </div>
        </div>
      )}

      {showRegModal && (
        <PatientRegistrationModal 
          onClose={() => {
            setShowRegModal(false)
            loadPatients(query)
          }} 
        />
      )}

    </div>
  )
}
