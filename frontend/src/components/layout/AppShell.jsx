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
  Stethoscope
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
import { format } from 'date-fns'

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
      <header className={`w-full shrink-0 border-b border-slate-200 flex items-center justify-between px-6 bg-white z-50 rounded-none transition-all duration-200 ${isStaffMode ? 'h-[72px]' : 'h-14'}`}>
        {/* Logo + Name */}
        <div className="flex items-center gap-3 shrink-0">
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
        <nav className="flex items-center gap-6 mx-auto">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { dispatch(setActiveView(id)); setMobileMenuOpen(false) }}
              className={`
                flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors duration-200
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
        <div className="flex items-center gap-5 shrink-0">
          {/* Low Stock Alert */}
          {lowStockCount > 0 && (
            <button
              type="button"
              title={`${lowStockCount} items low on stock`}
              onClick={() => dispatch(setActiveView('inventory'))}
              className="relative p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Bell size={20} strokeWidth={1.5} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
          )}

          {/* Date/Time */}
          <div className="text-right text-xs leading-tight font-medium text-slate-500 whitespace-nowrap">
            <div className="text-slate-800 font-semibold">
              {format(now, 'hh:mm:ss aa')}
            </div>
            <div className="text-slate-400 mt-0.5">
              {format(now, 'dd MMM yyyy')}
            </div>
          </div>

          {/* Staff/Solo Toggle */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${!isStaffMode ? 'text-teal-600' : 'text-slate-400'}`}>
              SOLO
            </span>
            <button
              type="button"
              onClick={() => dispatch(setStaffMode(!isStaffMode))}
              className={`
                relative w-12 h-6 rounded-full border transition-colors duration-200 ease-in-out
                ${isStaffMode ? 'bg-teal-600 border-teal-600' : 'bg-slate-100 border-slate-200'}
              `}
              title={isStaffMode ? 'Switch to Solo Mode' : 'Switch to Staff Mode'}
            >
              <span
                className={`
                  absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm border border-slate-200/50
                  transition-all duration-200 ease-in-out
                  ${isStaffMode ? 'left-[26px]' : 'left-0.5'}
                `}
              />
            </button>
            <span className={`text-xs font-semibold ${isStaffMode ? 'text-teal-600' : 'text-slate-400'}`}>
              STAFF
            </span>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200" />

          {/* Mode Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-sm font-medium text-slate-600">
            {isStaffMode ? (
              <>
                <User size={14} strokeWidth={1.5} />
                <span className="whitespace-nowrap">STAFF MODE</span>
              </>
            ) : (
              <>
                <Stethoscope size={14} strokeWidth={1.5} />
                <span className="whitespace-nowrap">SOLO MODE</span>
              </>
            )}
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            title="End session"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-all"
          >
            <LogOut size={20} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex flex-1 overflow-hidden w-full bg-slate-50">
        {renderContent()}
      </main>
    </div>
  )
}
