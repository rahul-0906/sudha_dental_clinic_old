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
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" stroke="var(--primary)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* TOP NAV BAR */}
      <header className="glass" style={{
        height: 64, display: 'flex', alignItems: 'center', padding: '0 20px',
        borderBottom: '1px solid var(--border)', gap: 16, flexShrink: 0, zIndex: 100,
        borderRadius: 0,
      }}>
        {/* Logo + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200 }}>
          <div style={{ filter: 'drop-shadow(0 0 8px rgba(20,184,166,0.4))' }}>
            <ToothLogo />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              Sudha Dental Clinic
            </div>
            <div style={{ fontSize: 10, color: 'var(--primary-light)', fontWeight: 500, letterSpacing: '0.5px' }}>
              SANKARANKOVIL · DR. MARIYAPPAN
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { dispatch(setActiveView(id)); setMobileMenuOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                background: activeView === id ? 'var(--primary-glow-bright)' : 'transparent',
                border: activeView === id ? '1px solid var(--border-bright)' : '1px solid transparent',
                color: activeView === id ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => {
                if (activeView !== id) e.currentTarget.style.background = 'rgba(0,0,0,0.03)'
              }}
              onMouseLeave={(e) => {
                if (activeView !== id) e.currentTarget.style.background = 'transparent'
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
          {/* Low Stock Alert */}
          {lowStockCount > 0 && (
            <div title={`${lowStockCount} items low on stock`} style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => dispatch(setActiveView('inventory'))}>
              <Bell size={18} color="var(--warning)" />
              <span style={{
                position: 'absolute', top: -6, right: -6, background: 'var(--danger)',
                color: 'white', fontSize: 9, fontWeight: 700, borderRadius: '50%',
                width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{lowStockCount}</span>
            </div>
          )}

          {/* Date/Time */}
          <div style={{ textAlign: 'right', fontSize: 12 }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {format(now, 'hh:mm:ss aa')}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              {format(now, 'dd MMM yyyy')}
            </div>
          </div>

          {/* Staff/Solo Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>SOLO</span>
            <button
              onClick={() => dispatch(setStaffMode(!isStaffMode))}
              style={{
                width: 48, height: 26, borderRadius: 13, position: 'relative',
                background: isStaffMode ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                border: 'none', cursor: 'pointer', transition: 'background 0.3s',
                boxShadow: isStaffMode ? '0 0 12px rgba(13,148,136,0.4)' : 'none',
              }}
              title={isStaffMode ? 'Switch to Solo Mode' : 'Switch to Staff Mode'}
            >
              <span style={{
                position: 'absolute', top: 3, left: isStaffMode ? 26 : 3,
                width: 20, height: 20, borderRadius: '50%', background: 'white',
                transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }} />
            </button>
            <span style={{ fontSize: 11, color: isStaffMode ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
              STAFF
            </span>
          </div>

          {/* Mode Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: isStaffMode ? 'var(--primary-glow-bright)' : 'rgba(0,0,0,0.05)',
            color: isStaffMode ? 'var(--primary)' : 'var(--text-muted)',
            border: `1px solid ${isStaffMode ? 'var(--border-bright)' : 'transparent'}`,
          }}>
            {isStaffMode ? (
              <>
                <User size={13} strokeWidth={2} />
                <span>STAFF MODE</span>
              </>
            ) : (
              <>
                <Stethoscope size={13} strokeWidth={2} />
                <span>SOLO MODE</span>
              </>
            )}
          </div>

          {/* Logout */}
          <button onClick={handleLogout} title="End session"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-900)' }}>
        {renderContent()}
      </main>
    </div>
  )
}
