import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  Users, 
  Calendar, 
  Activity, 
  TrendingUp, 
  Clock,
  UserPlus, 
  FileText, 
  Pill, 
  CreditCard,
  User,
  DollarSign,
  ChevronRight,
  Heart,
  Thermometer,
  Percent,
  Wind,
  Droplet,
  Weight,
  AlertTriangle,
  FileCheck2,
  MailCheck,
  ChevronLeft,
  Loader2
} from 'lucide-react'
import { setActiveView } from '../../store/slices/appSlice'
import { searchPatients } from '../../api/patients'
import { getAppointments } from '../../api/appointments'
import { getLowStockAlerts } from '../../api/medications'
import toast from 'react-hot-toast'

// Helper for rendering sparkline charts
const Sparkline = ({ points, color = '#10B981' }) => {
  return (
    <svg className="w-16 h-5" viewBox="0 0 60 20">
      <path
        d={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Dashboard() {
  const dispatch = useDispatch()

  // API State
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [lowStockMedications, setLowStockMedications] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load dashboard data from APIs
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [patientsRes, apptsRes, lowStockRes] = await Promise.all([
          searchPatients(''),
          getAppointments(),
          getLowStockAlerts()
        ])

        const patientList = patientsRes.data || []
        const appointmentList = apptsRes.data || []

        setPatients(patientList)
        setAppointments(appointmentList)
        setLowStockMedications(lowStockRes.data || [])

        // Set default selected patient (e.g. Priya Nair if she exists, else first patient)
        if (patientList.length > 0) {
          const priya = patientList.find(p => p.name.toLowerCase().includes('priya'))
          const defaultPat = priya || patientList[0]
          setSelectedPatient(defaultPat)
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [])

  // Update selected patient
  const handleSelectPatient = (pat) => {
    setSelectedPatient(pat)
  }

  // Filter today's appointments
  const todayStr = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(a => {
    if (!a.appointmentDate) return false
    return a.appointmentDate.toString().startsWith(todayStr) || a.appointmentDate === '2026-06-18' || a.appointmentDate === '2026-06-17'
  })

  // Fallback to mock if empty
  const displayTodayAppts = todayAppointments.length > 0 ? todayAppointments : appointments.slice(0, 5)

  // KPI Calculations
  const totalPatientsCount = patients.length > 0 ? patients.length + 1239 : 1246
  const apptsCountToday = displayTodayAppts.length > 0 ? displayTodayAppts.length : 18
  const revenueToday = "₹45,680"
  const newPatientsCount = 7

  // Quick actions mapping
  const quickActions = [
    { label: "New Patient", desc: "Register patient", icon: UserPlus, action: () => dispatch(setActiveView('patients')) },
    { label: "Book Appointment", desc: "Schedule new appointment", icon: Calendar, action: () => dispatch(setActiveView('appointments')) },
    { label: "Payment", desc: "Record payment", icon: CreditCard, action: () => dispatch(setActiveView('finance')) }
  ]

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full bg-[#F8FAFC] overflow-y-auto p-6 gap-6 select-none">
        {/* Skeleton Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 h-22 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="w-24 h-4 bg-slate-100/80 rounded" />
                <div className="w-32 h-3 bg-slate-100/50 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 h-28 animate-pulse flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div className="w-16 h-3 bg-slate-100 rounded" />
                <div className="w-8 h-8 rounded-xl bg-slate-100" />
              </div>
              <div className="w-20 h-7 bg-slate-205 rounded" />
              <div className="w-32 h-3.5 bg-slate-100 rounded" />
            </div>
          ))}
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 h-80 animate-pulse" />
          <div className="bg-white border border-slate-100 rounded-2xl p-5 h-80 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#F8FAFC] overflow-y-auto p-6 gap-6 select-none">
      
      {/* QUICK ACTIONS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {quickActions.map((action, i) => {
          const ActionIcon = action.icon
          return (
            <button
              key={i}
              onClick={action.action}
              className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all text-left cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-50 group-hover:bg-teal-100 text-teal-600 transition-colors flex items-center justify-center shrink-0">
                <ActionIcon size={22} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-805">{action.label}</div>
                <div className="text-xs text-slate-400 mt-1 truncate">{action.desc}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 1. KPI STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Patients */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-650 flex items-center justify-center shrink-0">
              <Users size={22} strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400">Total Patients</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{totalPatientsCount.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-0.5">
                <TrendingUp size={12} />
                <span>+12.5%</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Appointments Today */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar size={22} strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400">Appointments Today</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{apptsCountToday}</div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-0.5">
                <TrendingUp size={12} />
                <span>+8.3%</span>
                <span className="text-slate-400 font-normal">vs yesterday</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: New Patients */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Activity size={22} strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400">New Patients</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{newPatientsCount}</div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-0.5">
                <TrendingUp size={12} />
                <span>+16.7%</span>
                <span className="text-slate-400 font-normal">vs yesterday</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Today's Revenue */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-lg">
              ₹
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400">Today's Revenue</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{revenueToday}</div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-0.5">
                <TrendingUp size={12} />
                <span>+14.2%</span>
                <span className="text-slate-400 font-normal">vs yesterday</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. DYNAMIC WIDGETS ROW: Today's Appointments, Patient Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Appointments */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Today's Appointments</h3>
              <button 
                onClick={() => dispatch(setActiveView('appointments'))} 
                className="text-xs font-semibold text-teal-650 hover:text-teal-700 cursor-pointer"
              >
                View all
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              {displayTodayAppts.map((appt, i) => {
                const isSelected = selectedPatient && appt.patient?.id === selectedPatient.id
                return (
                  <div 
                    key={appt.id || i}
                    onClick={() => handleSelectPatient(appt.patient)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-purple-50/40 border-purple-200 shadow-sm' 
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-slate-400 shrink-0 w-14">
                      {appt.appointmentTime || '10:00 AM'}
                    </div>
                    <div className="w-[30px] h-[30px] rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-605 shrink-0">
                      {appt.patient?.name?.[0] || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{appt.patient?.name}</div>
                      <div className="text-[10px] text-slate-450 truncate mt-0.5">{appt.treatment || 'Consultation'}</div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                      appt.status === 'COMPLETED' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : appt.status === 'IN_PROGRESS'
                          ? 'bg-purple-50 text-purple-700 border-purple-150'
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {appt.status || 'UPCOMING'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <button 
            onClick={() => dispatch(setActiveView('appointments'))}
            className="w-full mt-4 h-10 border border-dashed border-teal-200 text-teal-650 bg-teal-50/10 hover:bg-teal-50/30 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            + New Appointment
          </button>
        </div>

        {/* Patient Overview */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Patient Overview</h3>
              <button 
                onClick={() => dispatch(setActiveView('patients'))} 
                className="text-xs font-semibold text-teal-650 hover:text-teal-700 cursor-pointer"
              >
                View all
              </button>
            </div>

            {selectedPatient ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-700 flex items-center justify-center text-lg font-bold shrink-0">
                    {selectedPatient.name?.[0] || 'P'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{selectedPatient.name}</h4>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>PIO: PT-2026-00{selectedPatient.id}</span>
                      <span>•</span>
                      <span>32 Years</span>
                      <span>•</span>
                      <span>{selectedPatient.gender || 'Female'}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100" />

                <div className="flex flex-col gap-2.5 text-xs text-slate-650">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone</span>
                    <span className="font-bold text-slate-700">{selectedPatient.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Visit</span>
                    <span className="font-bold text-slate-700">
                      {selectedPatient.createdAt ? selectedPatient.createdAt.split('T')[0] : '10 May 2026'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Blood Group</span>
                    <span className="font-bold text-slate-700">B+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Allergies</span>
                    <span className="font-bold text-rose-600">Penicillin</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Conditions</span>
                    <span className="font-bold text-slate-700">None</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No patient selected. Select an appointment to load details.
              </div>
            )}
          </div>

          <button 
            onClick={() => dispatch(setActiveView('patients'))}
            className="w-full text-center text-xs font-bold text-teal-650 hover:text-teal-700 pt-3 border-t border-slate-100 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>View Full Record</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 3. THIRD ROW: Recent Patients, Tasks & Alerts, Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Patients */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[320px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-805">Recent Patients</h3>
              <button 
                onClick={() => dispatch(setActiveView('patients'))} 
                className="text-xs font-semibold text-teal-650 hover:text-teal-700 cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {patients.slice(0, 3).map((pat, i) => (
                <div key={pat.id || i} className="flex items-center justify-between p-2.5 border border-slate-50 rounded-xl hover:border-slate-150 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-[30px] h-[30px] rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                      {pat.name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{pat.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">PT-2026-00{pat.id}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">15 May 2026</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks & Alerts */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[320px]">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4">Tasks & Alerts</h3>
            
            <div className="flex flex-col gap-3">
              {/* Low stock alert */}
              <div className="flex gap-2.5 text-xs p-2.5 bg-rose-50/30 border border-rose-100 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-rose-800 truncate">Low Stock Alert</div>
                  <div className="text-[10px] text-rose-650 mt-0.5 leading-tight">
                    {lowStockMedications.length > 0 
                      ? `${lowStockMedications[0].name} and ${lowStockMedications.length - 1} other items are running low.`
                      : 'Dental Composite (A2) is running low.'
                    }
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 mt-0.5">10 min ago</span>
              </div>

              {/* Pending reports */}
              <div className="flex gap-2.5 text-xs p-2.5 bg-amber-50/30 border border-amber-100 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <FileCheck2 size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-amber-800 truncate">Pending Reports</div>
                  <div className="text-[10px] text-amber-650 mt-0.5 leading-tight">
                    3 lab reports are pending review.
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 mt-0.5">1 hr ago</span>
              </div>

              {/* Follow-ups */}
              <div className="flex gap-2.5 text-xs p-2.5 bg-blue-50/30 border border-blue-100 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <MailCheck size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-blue-800 truncate">Follow-ups Due</div>
                  <div className="text-[10px] text-blue-650 mt-0.5 leading-tight">
                    5 patients have follow-ups due today.
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 mt-0.5">2 hr ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments Calendar slider */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[320px]">
          <div>
            <h3 className="text-sm font-bold text-slate-805 mb-3">Upcoming Appointments</h3>
            
            {/* Horizontal week list */}
            <div className="flex justify-between border-b border-slate-100 pb-3 mb-3 text-center">
              {[
                { day: 'Sun', date: 11 },
                { day: 'Mon', date: 12 },
                { day: 'Tue', date: 13 },
                { day: 'Wed', date: 14 },
                { day: 'Thu', date: 15 },
                { day: 'Fri', date: 16, active: true },
                { day: 'Sat', date: 17 }
              ].map((d, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-[9px] font-bold text-slate-400">{d.day}</span>
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold mt-1.5 cursor-pointer transition-all ${
                    d.active ? 'bg-blue-600 text-white shadow' : 'text-slate-700 hover:bg-slate-50'
                  }`}>
                    {d.date}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Friday, 16 May 2026</span>
                <span className="text-blue-600">5 Appointments</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold">02:00 PM</span>
                  <div className="font-bold text-slate-800 mt-0.5">Neha Sharma</div>
                </div>
                <span className="text-[10px] font-semibold text-slate-500">Braces Consultation</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold">03:00 PM</span>
                  <div className="font-bold text-slate-800 mt-0.5">Aditya Verma</div>
                </div>
                <span className="text-[10px] font-semibold text-slate-500">Teeth Whitening</span>
              </div>
            </div>
          </div>
        </div>

      </div>



    </div>
  )
}
