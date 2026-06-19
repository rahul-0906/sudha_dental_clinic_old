import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  LayoutDashboard,
  Users,
  Package,
  DollarSign,
  BarChart3,
  Bell,
  LogOut,
  Settings,
  Mail,
  ChevronRight,
  Sun,
  Search,
  Calendar
} from 'lucide-react'
import { setActiveView } from '../../store/slices/appSlice'
import { getLowStockAlerts } from '../../api/medications'
import BillingPage from '../finance/BillingPage'
import InventoryPage from '../inventory/InventoryPage'
import ReportsPage from '../finance/ReportsPage'
import PatientsPage from '../patient/PatientsPage'
import Dashboard from '../dashboard/Dashboard'
import AppointmentsPage from '../appointments/AppointmentsPage'
import MessagesPage from '../messages/MessagesPage'
import StaffPage from '../staff/StaffPage'
import SettingsPage from '../settings/SettingsPage'
import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export const ToothLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M40 8C28 8 18 16 18 26C18 32 20 38 22 44C24 50 25 60 27 66C28 70 30 72 32 72C34 72 36 68 38 62C39 58 40 54 40 54C40 54 41 58 42 62C44 68 46 72 48 72C50 72 52 70 53 66C55 60 56 50 58 44C60 38 62 32 62 26C62 16 52 8 40 8Z" />
  </svg>
)

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'finance', label: 'Billing & Payments', icon: DollarSign },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'report', label: 'Reports', icon: BarChart3 },
  { id: 'messages', label: 'Messages', icon: Mail, badge: 4 },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function AppShell() {
  const dispatch = useDispatch()
  const activeView = useSelector((state) => state.app.activeView)
  const [now, setNow] = useState(new Date())
  const [lowStockCount, setLowStockCount] = useState(0)
  const location = useLocation()

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    getLowStockAlerts().then(res => setLowStockCount(res.data.length)).catch(() => {})
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('clinicPinDate')
    localStorage.removeItem('clinicPinValid')
    localStorage.removeItem('clinicPin')
    window.location.reload()
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard />
      case 'patients': return <PatientsPage />
      case 'appointments': return <AppointmentsPage />
      case 'inventory': return <InventoryPage />
      case 'finance': return <BillingPage />
      case 'report': return <ReportsPage />
      case 'messages': return <MessagesPage />
      case 'staff': return <StaffPage />
      case 'settings': return <SettingsPage />
      default: return <Dashboard />
    }
  }

  return (
    <div className="w-full h-screen flex overflow-hidden bg-[#F8FAFC]">
      
      {/* 1. OUTERMOST LEFT SIDEBAR: Dark Menu Navigation */}
      <aside className="w-[280px] shrink-0 bg-[#0A122A] text-slate-400 flex flex-col h-full overflow-hidden select-none">
        
        {/* Logo Header */}
        <div className="h-[72px] shrink-0 border-b border-slate-800/80 flex items-center gap-3 px-6 text-white">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 shrink-0">
            <ToothLogo size={20} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-sm font-bold leading-none text-white">
              Sudha
            </div>
            <div className="text-[10px] font-medium text-slate-400 block mt-1">
              Dental Clinic
            </div>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1.5 no-scrollbar">
          {navItems.map(({ id, label, icon: Icon, badge, mockup }) => {
            const isActive = activeView === id
            return (
              <button
                key={id}
                onClick={() => {
                  if (mockup) {
                    toast.success(`${label} module coming soon!`)
                  } else {
                    dispatch(setActiveView(id))
                  }
                }}
                className={`
                  w-full h-11 px-4 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group
                  ${isActive 
                    ? 'bg-teal-500/10 text-teal-400 font-semibold border border-teal-500/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} strokeWidth={1.5} className={isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'} />
                  <span className="text-xs tracking-wide">{label}</span>
                </div>
                {badge && (
                  <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User Profile Widget */}
        <div className="p-4 border-t border-slate-800 flex items-center gap-3 bg-slate-950/20">
          <div className="w-[34px] h-[34px] rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            DM
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">Dr. Mariyappan</div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">Administrator</div>
          </div>
          <ChevronRight size={14} className="text-slate-500" />
        </div>

        {/* Clock/Weather Widget */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 leading-tight">
          <div>
            <div className="text-[9px] text-slate-505 font-medium uppercase">{format(now, 'EEEE, dd MMM yyyy')}</div>
            <div className="text-sm font-bold text-white mt-1">{format(now, 'hh:mm aa')}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <Sun size={14} className="text-amber-500 animate-spin-slow" />
            <span className="font-semibold text-slate-350">28°C</span>
          </div>
        </div>
      </aside>

      {/* 2. RIGHT WORKSPACE CONTAINER */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        
        {/* Top greeting & notification header */}
        <header className="h-[72px] shrink-0 border-b border-slate-200/80 bg-white px-6 flex items-center justify-between z-40">
          <div>
            <h1 className="text-base font-bold text-slate-800 flex items-center gap-1.5 leading-none">
              Good morning, Dr. Mariyappan <span className="text-sm">👋</span>
            </h1>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Here's what's happening at Sudha Dental Clinic today.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative w-64 md:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search patients, appointments..."
                className="w-full h-9 bg-slate-50 border border-slate-250 rounded-lg pl-9 pr-12 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                ⌘ K
              </span>
            </div>

            {/* Notifications Button */}
            <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 border border-slate-200 bg-white transition-all cursor-pointer">
              <Bell size={18} strokeWidth={1.5} />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Logout */}
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-404 hover:text-rose-600 rounded-lg hover:bg-slate-55 border border-slate-200 bg-white transition-all cursor-pointer flex items-center justify-center"
              title="Logout"
            >
              <LogOut size={18} strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 w-full overflow-hidden flex bg-slate-50">
          


          {/* Main Workspace Scrollable Area */}
          <main className="flex-1 bg-white overflow-hidden h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {renderContent()}
            </div>
          </main>

        </div>
      </div>
      
    </div>
  )
}
