import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Search, 
  ArrowLeft,
  Clock,
  User,
  Plus,
  UserPlus,
  X,
  Loader2
} from 'lucide-react'
import { setActiveView } from '../../store/slices/appSlice'
import { getAppointments, createAppointment, updateAppointmentStatus } from '../../api/appointments'
import { searchPatients } from '../../api/patients'
import toast from 'react-hot-toast'

export default function AppointmentsPage() {
  const dispatch = useDispatch()

  // API states
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Filter States
  const [selectedDoctor, setSelectedDoctor] = useState('All Doctors')
  const [selectedStatus, setSelectedStatus] = useState('All Statuses')
  const [selectedLocation, setSelectedLocation] = useState('All Locations')
  const [activeTab, setActiveTab] = useState('Day')

  // Selected date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Modal State for scheduling new appointments
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAppt, setNewAppt] = useState({
    patientId: '',
    doctor: 'Dr. Mariyappan',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '10:00 AM',
    treatment: 'Dental Consultation',
    status: 'UPCOMING',
    location: 'Sankarankovil'
  })

  // Load appointments
  const loadAppointments = async () => {
    setLoading(true)
    try {
      const res = await getAppointments()
      setAppointments(res.data || [])
    } catch (err) {
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  // Load patients list for scheduling dropdown
  const loadPatients = async () => {
    try {
      const res = await searchPatients('')
      setPatients(res.data || [])
    } catch (err) {
      console.error('Failed to load patients', err)
    }
  }

  useEffect(() => {
    loadAppointments()
    loadPatients()
  }, [])

  // Handle scheduling submission
  const handleScheduleSubmit = async (e) => {
    e.preventDefault()
    if (!newAppt.patientId) {
      toast.error('Please select a patient')
      return
    }
    setSubmitting(true)
    try {
      await createAppointment(newAppt)
      toast.success('Appointment scheduled successfully!')
      setShowAddModal(false)
      loadAppointments()
    } catch (err) {
      toast.error('Failed to schedule appointment')
    } finally {
      setSubmitting(false)
    }
  }

  // Time conversion helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

  // Generate calendar days for the current selectedMonth
  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const calendarDays = []
  // Previous month padding days
  const prevMonthDays = getDaysInMonth(year, month - 1)
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) })
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = new Date().toDateString() === new Date(year, month, i).toDateString()
    calendarDays.push({ day: i, isCurrentMonth: true, isToday, date: new Date(year, month, i) })
  }

  // Filter appointments for the selected timeline view date
  const selectedDateStr = selectedDate.toISOString().split('T')[0]
  
  const filteredAppointments = appointments.filter(a => {
    if (!a.appointmentDate) return false
    
    // Check Date
    const isSameDate = a.appointmentDate.toString().startsWith(selectedDateStr)
    if (!isSameDate) return false

    // Doctor Filter
    if (selectedDoctor !== 'All Doctors' && a.doctor !== selectedDoctor) return false

    // Status Filter
    if (selectedStatus !== 'All Statuses' && a.status !== selectedStatus.toUpperCase().replace(' ', '_')) return false

    // Location Filter
    if (selectedLocation !== 'All Locations' && a.location !== selectedLocation) return false

    return true
  })

  // Upcoming appointments list (upcoming states)
  const upcomingAppointments = appointments.filter(a => a.status === 'UPCOMING' || a.status === 'IN_PROGRESS')

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#F8FAFC]">
      
      {/* 1. LEFT COLUMN: Calendar & Filters */}
      <div className="w-[280px] border-r border-slate-200 bg-white flex flex-col overflow-hidden shrink-0 p-4 gap-5 select-none">
        
        {/* Calendar Widget */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-slate-800">
              {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setSelectedDate(new Date(year, month - 1, 1))}
                className="p-1 hover:bg-slate-50 border border-slate-100 rounded-md cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                onClick={() => setSelectedDate(new Date(year, month + 1, 1))}
                className="p-1 hover:bg-slate-50 border border-slate-100 rounded-md cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-2">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          <div className="grid grid-cols-7 text-center gap-y-1.5 text-xs">
            {calendarDays.map((d, i) => {
              const isSelected = selectedDate.toDateString() === d.date.toDateString()
              return (
                <div key={i} className="flex justify-center">
                  <button 
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-650 text-white shadow-sm' 
                        : d.isCurrentMonth 
                          ? 'text-slate-700 hover:bg-slate-50' 
                          : 'text-slate-300'
                    }`}
                    onClick={() => setSelectedDate(d.date)}
                  >
                    {d.day}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="w-full h-px bg-slate-100" />

        {/* Filters Panel */}
        <div className="flex flex-col gap-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filters</h4>
          
          {/* Doctor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500">Doctor</label>
            <select 
              value={selectedDoctor} 
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="h-9 w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-2.5 text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option>All Doctors</option>
              <option>Dr. Mariyappan</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500">Status</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-2.5 text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option>All Statuses</option>
              <option>Completed</option>
              <option>In Progress</option>
              <option>Upcoming</option>
            </select>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500">Location</label>
            <select 
              value={selectedLocation} 
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="h-9 w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-2.5 text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option>All Locations</option>
              <option>Sankarankovil</option>
              <option>Room A</option>
              <option>Room B</option>
            </select>
          </div>

          <button 
            onClick={() => { setSelectedDoctor('All Doctors'); setSelectedStatus('All Statuses'); setSelectedLocation('All Locations') }}
            className="text-left text-xs font-semibold text-teal-650 hover:text-teal-700 mt-1 cursor-pointer"
          >
            Clear Filters
          </button>
        </div>

      </div>

      {/* 2. CENTER COLUMN: Timeline schedule */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 border-r border-slate-200">
        
        {/* Scheduler Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0 select-none">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => dispatch(setActiveView('dashboard'))} 
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-755 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span className="text-sm font-bold text-slate-800">Appointments</span>
            </button>
            
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 gap-0.5 ml-2">
              {['Day', 'Week', 'Month'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] font-bold px-3 py-1 rounded-md transition-all cursor-pointer ${
                    activeTab === tab 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3.5 h-9 text-xs rounded-xl bg-teal-650 hover:bg-teal-700 text-white font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>New Appointment</span>
          </button>
        </div>

        <div>
          <h2 className="text-base font-extrabold text-slate-800 select-none">
            {selectedDate.toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
        </div>

        {/* Timeline list */}
        <div className="flex flex-col gap-4 border border-slate-100 rounded-2xl p-4 bg-white shadow-sm flex-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 items-start border-b border-slate-50 last:border-none pb-4 last:pb-0">
                <div className="w-20 font-semibold text-xs mt-1 flex items-center gap-1.5 select-none shrink-0">
                  <Clock size={12} className="text-slate-200" />
                  <div className="w-12 h-3.5 bg-slate-200 rounded" />
                </div>
                <div className="flex-1 border border-slate-100 rounded-xl p-3 flex justify-between items-center bg-slate-50/30">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="w-28 h-3.5 bg-slate-200 rounded" />
                    <div className="w-16 h-2.5 bg-slate-150 rounded" />
                  </div>
                  <div className="w-16 h-5 bg-slate-200 rounded-full" />
                </div>
              </div>
            ))
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-medium">
              No appointments scheduled for this date.
            </div>
          ) : (
            filteredAppointments.map((appt) => (
              <div key={appt.id} className="flex gap-4 items-start border-b border-slate-50 last:border-none pb-4 last:pb-0">
                <div className="w-20 font-semibold text-xs text-slate-400 mt-1 flex items-center gap-1.5 select-none">
                  <Clock size={12} />
                  <span>{appt.appointmentTime || '09:00 AM'}</span>
                </div>
                
                <div className={`flex-1 border rounded-xl p-3 flex justify-between items-center ${
                  appt.status === 'COMPLETED' 
                    ? 'bg-emerald-50/50 text-emerald-800 border-emerald-100' 
                    : appt.status === 'IN_PROGRESS' 
                      ? 'bg-purple-50/50 text-purple-800 border-purple-150' 
                      : 'bg-blue-50/50 text-blue-800 border-blue-100'
                }`}>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{appt.patient?.name}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{appt.treatment || 'Consultation'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold opacity-85 select-none">
                      {appt.appointmentTime}
                    </span>
                    <select
                      value={appt.status}
                      onChange={async (e) => {
                        try {
                          await updateAppointmentStatus(appt.id, e.target.value)
                          toast.success('Status updated!')
                          loadAppointments()
                        } catch (err) {
                          toast.error('Failed to update status')
                        }
                      }}
                      className="h-6 bg-white border border-slate-200 rounded text-[9px] px-1 font-bold focus:outline-none cursor-pointer text-slate-700"
                    >
                      <option value="UPCOMING">UPCOMING</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* 3. RIGHT COLUMN: Upcoming Appointments */}
      <div className="w-[280px] bg-white flex flex-col justify-between shrink-0 p-4 select-none">
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-1">
            Upcoming ({upcomingAppointments.length})
          </h3>
          
          <div className="flex flex-col gap-3">
            {upcomingAppointments.slice(0, 5).map((up) => (
              <div key={up.id} className="flex items-center justify-between p-3 border border-slate-50 bg-slate-50/20 hover:border-slate-150 transition-colors rounded-xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-[30px] h-[30px] rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-650 shrink-0">
                    {up.patient?.name?.[0] || 'P'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{up.patient?.name}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {up.appointmentDate} • {up.appointmentTime}
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-450 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setSelectedDate(new Date())}
          className="w-full text-center text-xs font-semibold text-teal-650 hover:text-teal-700 pt-3 border-t border-slate-100 cursor-pointer"
        >
          Reset to Today
        </button>
      </div>      {/* Add Appointment Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 p-6 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon size={20} strokeWidth={1.5} className="text-teal-650" />
                <span>Schedule Appointment</span>
              </h2>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)} 
                className="text-slate-404 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {/* Patient Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Patient *
                  </label>
                  <select
                    required
                    value={newAppt.patientId}
                    onChange={(e) => setNewAppt({ ...newAppt, patientId: e.target.value })}
                    className="input-field w-full cursor-pointer"
                  >
                    <option value="">Select Patient</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                    ))}
                  </select>
                </div>

                {/* Appointment Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newAppt.appointmentDate}
                    onChange={(e) => setNewAppt({ ...newAppt, appointmentDate: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                {/* Appointment Time */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Appointment Time *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:30 AM"
                    value={newAppt.appointmentTime}
                    onChange={(e) => setNewAppt({ ...newAppt, appointmentTime: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                {/* Treatment details */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Treatment Description *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Root Canal, Consultation"
                    value={newAppt.treatment}
                    onChange={(e) => setNewAppt({ ...newAppt, treatment: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                {/* Doctor */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Assign Doctor *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAppt.doctor}
                    onChange={(e) => setNewAppt({ ...newAppt, doctor: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                {/* Location */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAppt.location}
                    onChange={(e) => setNewAppt({ ...newAppt, location: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-6 border-t border-slate-100 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className={`btn-primary flex-2 flex items-center justify-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {submitting && <Loader2 className="animate-spin" size={16} strokeWidth={1.5} />}
                  <span>{submitting ? 'Scheduling...' : 'Schedule Appointment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
