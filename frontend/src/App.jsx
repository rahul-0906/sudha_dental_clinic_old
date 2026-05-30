import React, { useState, useEffect } from 'react';
import { CLINIC_CONFIG } from './config';
import DashboardView from './views/DashboardView';
import EMRView from './views/EMRView';
import InventoryView from './views/InventoryView';
import BillingView from './views/BillingView';
import MappingView from './views/MappingView';
import PatientHistoryView from './views/PatientHistoryView';
import NurseWorkflowView from './views/NurseWorkflowView';
import DoctorWorkflowView from './views/DoctorWorkflowView';
import SoloOmniWorkflowView from './views/SoloOmniWorkflowView';
import { WorkflowProvider, useWorkflow } from './store/WorkflowStore';
import {
  LayoutDashboard, BookOpen, Layers, CreditCard,
  Stethoscope, Users, Calendar, Settings, Activity,
  ToggleLeft, ToggleRight
} from 'lucide-react';
import { api } from './api';

const ROLES = [
  { id: 'ADMIN', label: 'Dr. Mariyappan (Owner & Doctor)', desc: 'Full control' },
  { id: 'RECEPTIONIST', label: 'Nurse', desc: 'Bookings & Billing' }
];

// ─── Nurse Mode Toggle button (reads from WorkflowContext) ─────────────────────
function NurseModeToggle() {
  const { isNurseAvailable, toggleNurseMode } = useWorkflow();
  return (
    <button
      onClick={toggleNurseMode}
      className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-200 ${
        isNurseAvailable
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
      }`}
      title={isNurseAvailable ? 'Nurse Available — click to switch to Solo Mode' : 'Solo Doctor Mode — click to enable Nurse Mode'}
    >
      {isNurseAvailable
        ? <ToggleRight className="w-4 h-4" />
        : <ToggleLeft className="w-4 h-4" />
      }
      <span>{isNurseAvailable ? 'Nurse Mode' : 'Solo Mode'}</span>
    </button>
  );
}

// ─── Workflow View Switcher (respects role + nurse mode) ───────────────────────
function WorkflowViewSwitcher({ currentRole }) {
  const { isNurseAvailable } = useWorkflow();

  // In solo mode: Doctor/Admin sees the omni-dashboard, Nurse sees nurse workflow only
  if (!isNurseAvailable) {
    return <SoloOmniWorkflowView />;
  }

  // In nurse mode: Doctor sees DoctorWorkflowView, Nurse sees NurseWorkflowView
  if (currentRole === 'ADMIN') {
    return <DoctorWorkflowView />;
  }
  return <NurseWorkflowView />;
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState(() => {
    const defaultUser = '{"username":"admin", "role":"ADMIN"}';
    const current = JSON.parse(sessionStorage.getItem('currentUser') || defaultUser);
    return current.role || 'ADMIN';
  });
  const [patients, setPatients] = useState([]);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [apptForm, setApptForm] = useState({
    patientId: '',
    dentistId: '2',
    appointmentTime: '',
    chiefComplaint: ''
  });

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    const username = role === 'ADMIN' ? 'admin' : 'receptionist';
    sessionStorage.setItem('currentUser', JSON.stringify({ username, role }));
  };

  useEffect(() => {
    const defaultUser = '{"username":"admin", "role":"ADMIN"}';
    if (!sessionStorage.getItem('currentUser')) {
      sessionStorage.setItem('currentUser', defaultUser);
    }
  }, []);

  const loadPatients = async () => {
    try {
      const data = await api.patients.list();
      setPatients(data);
      if (data.length > 0) {
        setApptForm(prev => ({ ...prev, patientId: data[0].id.toString() }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [activeTab]);

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      await api.appointments.create({
        patientId: parseInt(apptForm.patientId),
        dentistId: parseInt(apptForm.dentistId),
        appointmentTime: apptForm.appointmentTime,
        chiefComplaint: apptForm.chiefComplaint
      });
      setIsApptModalOpen(false);
      setApptForm({
        patientId: patients[0]?.id.toString() || '',
        dentistId: '2',
        appointmentTime: '',
        chiefComplaint: ''
      });
      setActiveTab('dashboard');
      window.location.reload();
    } catch (error) {
      alert('Failed to book appointment: ' + error.message);
    }
  };

  // Nav items — some are role-gated
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'RECEPTIONIST'] },
    { id: 'workflow', label: 'Daily Workflow', icon: Activity, roles: ['ADMIN', 'RECEPTIONIST'] },
    { id: 'history', label: 'Patient Files & History', icon: Users, roles: ['ADMIN', 'RECEPTIONIST'] },
    { id: 'emr', label: 'Dentist EMR', icon: BookOpen, roles: ['ADMIN'] },
    { id: 'inventory', label: 'Inventory', icon: Layers, roles: ['ADMIN', 'RECEPTIONIST'] },
    { id: 'billing', label: 'Cash Flow / Billing', icon: CreditCard, roles: ['ADMIN', 'RECEPTIONIST'] },
    { id: 'mappings', label: 'Procedure Mappings', icon: Settings, roles: ['ADMIN'] },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        {/* Clinic Logo/Branding Header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary-600 text-white shadow-md">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base tracking-tight truncate leading-tight">
              {CLINIC_CONFIG.name}
            </h2>
            <span className="text-[10px] text-primary-400 font-semibold tracking-wider uppercase">
              Dental SaaS
            </span>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems
            .filter(item => item.roles.includes(currentRole))
            .map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold ${
                  activeTab === item.id
                    ? 'bg-primary-700 text-white shadow-md'
                    : 'hover:bg-slate-800 hover:text-slate-100 text-slate-400'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.id === 'workflow' && (
                  <span className="ml-auto text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                    LIVE
                  </span>
                )}
              </button>
            ))}
        </nav>

        {/* Sidebar Footer Clinic Metadata */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs space-y-1">
          <p className="text-slate-500 font-medium">Clinic Contact:</p>
          <p className="text-slate-400 truncate">{CLINIC_CONFIG.email}</p>
          <p className="text-slate-400">{CLINIC_CONFIG.phone}</p>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col">

        {/* Navbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 shadow-sm">
          {/* Active Staff Account */}
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-primary-50 text-primary-700 font-bold px-2 py-0.5 rounded uppercase">
              Staff Account: {ROLES.find(r => r.id === currentRole)?.label || currentRole}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">

            {/* Nurse Mode Toggle — only shown on the workflow tab */}
            {activeTab === 'workflow' && <NurseModeToggle />}

            {/* Book Appointment Shortcut */}
            {(currentRole === 'ADMIN' || currentRole === 'RECEPTIONIST') && (
              <button
                onClick={() => { loadPatients(); setIsApptModalOpen(true); }}
                className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-bold transition border border-slate-200"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Book Visit</span>
              </button>
            )}

            {/* Dev-only role switcher */}
            {import.meta.env.MODE === 'development' && (
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
                <span className="text-xs font-semibold text-slate-400">Switch Account:</span>
                <select
                  value={currentRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {ROLES.map(role => (
                    <option key={role.id} value={role.id}>{role.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </header>

        {/* Content Pane */}
        <main className={`flex-1 overflow-y-auto ${activeTab === 'workflow' ? '' : 'p-8'}`}>
          {activeTab === 'dashboard' && <DashboardView userRole={currentRole} />}
          {activeTab === 'workflow' && (
            <div className="p-8">
              <WorkflowViewSwitcher currentRole={currentRole} />
            </div>
          )}
          {activeTab === 'history' && <PatientHistoryView />}
          {activeTab === 'emr' && currentRole === 'ADMIN' && <EMRView userRole={currentRole} />}
          {activeTab === 'inventory' && <InventoryView userRole={currentRole} />}
          {activeTab === 'billing' && <BillingView userRole={currentRole} />}
          {activeTab === 'mappings' && currentRole === 'ADMIN' && <MappingView />}
        </main>
      </div>

      {/* Book Appointment Modal */}
      {isApptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="bg-primary-700 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">Book Patient Appointment</h3>
              <button
                onClick={() => setIsApptModalOpen(false)}
                className="text-white/80 hover:text-white text-2xl font-semibold bg-transparent border-0 cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleBookAppointment} className="p-6 space-y-4">
              {patients.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-sm">
                  No patients found. Please register a patient first in the dashboard.
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select Patient</label>
                    <select
                      value={apptForm.patientId}
                      onChange={(e) => setApptForm({ ...apptForm, patientId: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                    >
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Assign Dentist</label>
                    <select
                      value={apptForm.dentistId}
                      onChange={(e) => setApptForm({ ...apptForm, dentistId: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                    >
                      <option value="2">Dr. Suraj (Additional Doctor)</option>
                      <option value="1">Dr. Mariyappan (Owner & Doctor)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Appointment Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={apptForm.appointmentTime}
                      onChange={(e) => setApptForm({ ...apptForm, appointmentTime: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Chief Complaint</label>
                    <input
                      type="text"
                      placeholder="e.g. molar extraction / teeth cleaning"
                      value={apptForm.chiefComplaint}
                      onChange={(e) => setApptForm({ ...apptForm, chiefComplaint: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsApptModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-lg transition text-sm font-semibold shadow-md"
                    >
                      Book Visit
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root App — wraps everything in WorkflowProvider ──────────────────────────
export default function App() {
  return (
    <WorkflowProvider>
      <AppContent />
    </WorkflowProvider>
  );
}
