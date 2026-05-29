import React, { useState, useEffect } from 'react';
import { CLINIC_CONFIG } from './config';
import DashboardView from './views/DashboardView';
import EMRView from './views/EMRView';
import InventoryView from './views/InventoryView';
import BillingView from './views/BillingView';
import MappingView from './views/MappingView';
import PatientHistoryView from './views/PatientHistoryView';
import { LayoutDashboard, BookOpen, Layers, CreditCard, Stethoscope, Users, Calendar, Plus, Settings } from 'lucide-react';
import { api } from './api';

const ROLES = [
  { id: 'ADMIN', label: 'Admin (Clinic Owner)', desc: 'Full system control' },
  { id: 'DENTIST', label: 'Dentist', desc: 'EMR, Prescribing & Calendar' },
  { id: 'RECEPTIONIST', label: 'Receptionist', desc: 'Bookings, Onboarding & Billing' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState(() => {
    const defaultUser = '{"username":"admin", "role":"ADMIN"}';
    const current = JSON.parse(sessionStorage.getItem('currentUser') || defaultUser);
    return current.role || 'ADMIN';
  });
  const [patients, setPatients] = useState([]);

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    const username = role.toLowerCase() + '_user';
    sessionStorage.setItem('currentUser', JSON.stringify({ username, role }));
  };

  useEffect(() => {
    const defaultUser = '{"username":"admin", "role":"ADMIN"}';
    if (!sessionStorage.getItem('currentUser')) {
      sessionStorage.setItem('currentUser', defaultUser);
    }
  }, []);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [apptForm, setApptForm] = useState({
    patientId: '',
    dentistId: '2', // Default to Dr. Sarah Jenkins (ID: 2)
    appointmentTime: '',
    chiefComplaint: ''
  });

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
      // Refresh current view if we are on dashboard
      setActiveTab('dashboard');
      window.location.reload(); // Reload to refresh dashboard state
    } catch (error) {
      alert("Failed to book appointment: " + error.message);
    }
  };

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
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold ${
              activeTab === 'dashboard'
                ? 'bg-primary-700 text-white shadow-md'
                : 'hover:bg-slate-800 hover:text-slate-100 text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold ${
              activeTab === 'history'
                ? 'bg-primary-700 text-white shadow-md'
                : 'hover:bg-slate-800 hover:text-slate-100 text-slate-400'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Patient Files & History</span>
          </button>

          <button
            onClick={() => setActiveTab('emr')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold ${
              activeTab === 'emr'
                ? 'bg-primary-700 text-white shadow-md'
                : 'hover:bg-slate-800 hover:text-slate-100 text-slate-400'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Dentist EMR</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold ${
              activeTab === 'inventory'
                ? 'bg-primary-700 text-white shadow-md'
                : 'hover:bg-slate-800 hover:text-slate-100 text-slate-400'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span>Inventory</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold ${
              activeTab === 'billing'
                ? 'bg-primary-700 text-white shadow-md'
                : 'hover:bg-slate-800 hover:text-slate-100 text-slate-400'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span>Cash Flow / Billing</span>
          </button>

          {currentRole === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('mappings')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold ${
                activeTab === 'mappings'
                  ? 'bg-primary-700 text-white shadow-md'
                  : 'hover:bg-slate-800 hover:text-slate-100 text-slate-400'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Procedure Mappings</span>
            </button>
          )}
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
          {/* Active Navigation Title */}
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-primary-50 text-primary-700 font-bold px-2 py-0.5 rounded uppercase">
              {currentRole} Access
            </span>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center space-x-4">
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

            {/* Role selection dropdown to test 3-tier RBAC access levels */}
            {import.meta.env.MODE === 'development' && (
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
                <span className="text-xs font-semibold text-slate-400">Simulate Role:</span>
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
        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardView userRole={currentRole} />}
          {activeTab === 'history' && <PatientHistoryView />}
          {activeTab === 'emr' && <EMRView userRole={currentRole} />}
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
                      <option value="2">Dr. Sarah Jenkins (Dentist)</option>
                      <option value="1">Dr. Sudha (Owner)</option>
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
