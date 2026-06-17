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
  Menu,
  X,
  User,
  Stethoscope,
  UserPlus
} from 'lucide-react'
import { setStaffMode, setActiveView } from '../../store/slices/appSlice'
import { fetchTodayQueue } from '../../store/slices/queueSlice'
import { getLowStockAlerts } from '../../api/medications'
import StaffLayout from './StaffLayout'
import SoloLayout from './SoloLayout'
import InventoryPage from '../inventory/InventoryPage'
import FinancialLedger from '../finance/FinancialLedger'
import DailyReport from '../finance/DailyReport'
import PatientHistoryPage from '../patient/PatientHistoryPage'
import PatientSearch from '../patient/PatientSearch'
import { useLocation } from 'react-router-dom'
import PatientRegistrationModal from '../patient/PatientRegistrationModal'
import QueueBoard from '../queue/QueueBoard'
import StaffPanel from './StaffPanel'
import { format } from 'date-fns'
import { StaffIcon, DoctorIcon } from '../common/ProfileIcons'

export const ToothLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M40 8C28 8 18 16 18 26C18 32 20 38 22 44C24 50 25 60 27 66C28 70 30 72 32 72C34 72 36 68 38 62C39 58 40 54 40 54C40 54 41 58 42 62C44 68 46 72 48 72C50 72 52 70 53 66C55 60 56 50 58 44C60 38 62 32 62 26C62 16 52 8 40 8Z" />
  </svg>
)

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'report', label: 'Daily Report', icon: BarChart3 },
]

export default function AppShell() {
  const dispatch = useDispatch()
  const isStaffMode = useSelector((state) => state.app.isStaffAvailable)
  const activeView = useSelector((state) => state.app.activeView)
  const [now, setNow] = useState(new Date())
  const [lowStockCount, setLowStockCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showRegModal, setShowRegModal] = useState(false)
  const location = useLocation()
  const hideSidebarViews = ['patients', 'inventory', 'finance', 'report']
  const hideSidebarRoutes = ['/patients', '/inventory', '/finance', '/daily-report', '/report']
  const shouldHideSidebar = hideSidebarViews.includes(activeView) || hideSidebarRoutes.some(route => location.pathname.includes(route))

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    dispatch(fetchTodayQueue())
    getLowStockAlerts().then(res => setLowStockCount(res.data.length)).catch(() => {})
  }, [dispatch])

  const handleLogout = () => {
    localStorage.removeItem('clinicPinDate')
    localStorage.removeItem('clinicPinValid')
    localStorage.removeItem('clinicPin')
    window.location.reload()
  }

  const renderContent = () => {
    switch (activeView) {
      case 'patients': return <PatientHistoryPage />
      case 'inventory': return <InventoryPage />
      case 'finance': return <FinancialLedger />
      case 'report': return <DailyReport />
      default: return isStaffMode ? <StaffLayout /> : <SoloLayout />
    }
  }

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-white">
      {/* TOP NAV BAR */}
      <header className="w-full h-[72px] shrink-0 border-b border-slate-200 flex items-center justify-between px-6 bg-white z-50 rounded-none gap-8">
        {/* Logo + Name */}
        <div className="flex items-center gap-3 shrink-0 min-w-max">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 shrink-0">
            <ToothLogo size={22} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-sm font-semibold text-slate-800 leading-none whitespace-nowrap">
              Sudha Dental Clinic
            </div>
            <div className="text-[10px] font-medium text-teal-600 uppercase tracking-wider block mt-0.5 whitespace-nowrap">
              SANKARANKOVIL · DR. MARIYAPPAN
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-1 items-center justify-center gap-6 overflow-x-auto no-scrollbar">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { dispatch(setActiveView(id)); setMobileMenuOpen(false) }}
              className={`
                flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors duration-200 cursor-pointer
                ${activeView === id 
                  ? 'text-teal-700 font-semibold' 
                  : 'font-medium'
                }
              `}
            >
              <Icon size={16} strokeWidth={1.5} />
              <span className="whitespace-nowrap text-sm">{label}</span>
            </button>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-5 shrink-0 relative">
          {/* Low Stock Alert */}
          {lowStockCount > 0 && (
            <button
              type="button"
              title={`${lowStockCount} items low on stock`}
              onClick={() => dispatch(setActiveView('inventory'))}
              className="relative p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Bell size={20} strokeWidth={1.5} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
          )}

          {/* Date/Time */}
          <div className="text-right text-xs leading-tight font-medium text-slate-500 whitespace-nowrap">
            <div className="text-slate-800 font-semibold">
              {format(now, 'hh:mm aa')}
            </div>
            <div className="text-slate-400 mt-0.5">
              {format(now, 'dd MMM yyyy')}
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200" />

          {/* Clickable Role Icon Toggle */}
          <button
            type="button"
            onClick={() => dispatch(setStaffMode(!isStaffMode))}
            className="p-1 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
            title={isStaffMode ? "Switch to Solo Mode (Doctor view)" : "Switch to Staff Mode (Shared desk)"}
          >
            {isStaffMode ? (
              <StaffIcon size={20} className="!p-2 !rounded-xl" />
            ) : (
              <DoctorIcon size={20} className="!p-2 !rounded-xl" />
            )}
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            title="End session"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
          >
            <LogOut size={20} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* BOTTOM CONTAINER */}
      <div className="flex-1 w-full overflow-hidden flex bg-slate-50">
        {/* Left Sidebar */}
        {!shouldHideSidebar && (
          <aside className="w-[320px] shrink-0 border-r border-slate-200 bg-slate-50/50 flex flex-col h-full overflow-hidden">
            {isStaffMode ? (
              <StaffPanel />
            ) : (
              <div className="p-4 flex flex-col gap-4 h-full overflow-hidden">
                {/* Search & Register Patient 2-Column Row */}
                <div className="flex items-center gap-2 w-full shrink-0">
                  <div className="flex-1 min-w-0">
                    <PatientSearch />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRegModal(true)}
                    className="flex items-center justify-center shrink-0 w-10 h-10 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer"
                    title="Register New Patient"
                  >
                    <UserPlus size={20} strokeWidth={1.5} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <QueueBoard compact />
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Main Workspace (Canvas) */}
        <main className="flex-1 bg-white overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {showRegModal && <PatientRegistrationModal onClose={() => setShowRegModal(false)} />}
    </div>
  )
}
