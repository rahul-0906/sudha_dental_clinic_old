import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Phone, 
  Calendar, 
  User, 
  PlusCircle, 
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowLeft
} from 'lucide-react'
import PatientRegistrationModal from './PatientRegistrationModal'
import PatientHistoryPage from './PatientHistoryPage'
import { setActiveView } from '../../store/slices/appSlice'
import { searchPatients } from '../../api/patients'
import toast from 'react-hot-toast'

export default function PatientsPage() {
  const dispatch = useDispatch()
  const [patients, setPatients] = useState([])
  const [searchVal, setSearchVal] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRegModal, setShowRegModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All') // All, Active, Inactive
  const [selectedPatientId, setSelectedPatientId] = useState(null) // for viewing history details
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 7

  const loadPatients = async (query = '') => {
    setLoading(true)
    try {
      const res = await searchPatients(query)
      setPatients(res.data || [])
    } catch (err) {
      toast.error('Failed to fetch patients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadPatients(searchVal)
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [searchVal])


  // Filter patients by status
  const filteredPatients = patients.filter(pat => {
    if (statusFilter === 'All') return true
    if (statusFilter === 'Active') {
      // For mock purposes, assume patients with ID 1, 2, 3, 5 are active
      return pat.id % 2 !== 0 || pat.id === 2
    }
    if (statusFilter === 'Inactive') {
      return pat.id % 2 === 0 && pat.id !== 2
    }
    return true
  })

  // Pagination calculations
  const totalItems = filteredPatients.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredPatients.slice(indexOfFirstItem, indexOfLastItem)

  if (selectedPatientId) {
    // If a patient is selected, render a back button and the history details
    return (
      <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
        <header className="h-[72px] shrink-0 bg-white border-b border-slate-200/80 px-6 flex items-center gap-4 z-40">
          <button 
            onClick={() => setSelectedPatientId(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Back to Patients Directory</span>
          </button>
        </header>
        <div className="flex-1 overflow-hidden">
          {/* We pass a custom container layout or let it render directly */}
          <PatientHistoryPage defaultPatientId={selectedPatientId} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[#F8FAFC]">
      
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
        <div>
          <button 
            onClick={() => dispatch(setActiveView('dashboard'))} 
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-755 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-bold text-slate-800">Patients Directory</span>
          </button>
          <p className="text-[10px] text-slate-400 mt-1 font-medium ml-5">
            Manage patient profiles and their information
          </p>
        </div>

        <button 
          onClick={() => setShowRegModal(true)}
          className="flex items-center gap-1.5 px-4 h-10 text-xs rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-sm cursor-pointer"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>Add Patient</span>
        </button>
      </div>

      {/* Search and Filters Row */}
      <div className="flex items-center gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search patients..."
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 text-slate-600 focus:outline-none cursor-pointer"
          >
            <option value="All">All Patients</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Grid Table Container */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex-1 flex flex-col justify-between overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-150 select-none">
                <th className="p-4">Patient</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Age / Gender</th>
                <th className="p-4">Last Visit</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400 font-medium">
                    Loading patients directory...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400 font-medium">
                    No patients found matching the criteria.
                  </td>
                </tr>
              ) : (
                currentItems.map((pat) => {
                  const isActive = pat.id % 2 !== 0 || pat.id === 2
                  // Calculate age
                  let ageStr = 'N/A'
                  if (pat.dob) {
                    const birthYear = new Date(pat.dob).getFullYear()
                    const currentYear = new Date().getFullYear()
                    ageStr = (currentYear - birthYear) + ' Yrs'
                  }

                  return (
                    <tr key={pat.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/30 transition-colors text-slate-700">
                      <td className="p-4 font-semibold flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {pat.name[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{pat.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">PT-2026-00{pat.id}</span>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-600">{pat.phone}</td>
                      <td className="p-4 font-medium text-slate-600">
                        {ageStr} / {pat.gender || 'Unknown'}
                      </td>
                      <td className="p-4 font-medium text-slate-500">
                        {pat.createdAt ? pat.createdAt.split('T')[0] : '10 May 2026'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => setSelectedPatientId(pat.id)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="View Clinical History"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Custom Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-450 select-none">
          <span className="font-semibold">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} patients
          </span>
          <div className="flex items-center gap-1.5">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className={`p-1.5 rounded-lg border border-slate-200 transition-all ${
                currentPage === 1 
                  ? 'text-slate-300 bg-slate-50 cursor-not-allowed' 
                  : 'text-slate-650 hover:bg-slate-50 cursor-pointer'
              }`}
            >
              <ChevronLeft size={14} />
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  currentPage === (i + 1)
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className={`p-1.5 rounded-lg border border-slate-200 transition-all ${
                currentPage === totalPages 
                  ? 'text-slate-300 bg-slate-50 cursor-not-allowed' 
                  : 'text-slate-650 hover:bg-slate-50 cursor-pointer'
              }`}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {showRegModal && (
        <PatientRegistrationModal 
          onClose={() => {
            setShowRegModal(false)
            loadPatients(searchVal)
          }} 
        />
      )}
    </div>
  )
}
