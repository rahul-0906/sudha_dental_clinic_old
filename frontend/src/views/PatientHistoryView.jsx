import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, User, Phone, Mail, FileText, Calendar, Plus, Pill, ShieldAlert, Edit3, ClipboardList, CheckCircle } from 'lucide-react';

export default function PatientHistoryView() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [treatmentHistory, setTreatmentHistory] = useState([]);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit Patient Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState({
    id: null,
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: 'Male',
    medicalHistory: ''
  });

  const loadPatients = async () => {
    try {
      const data = await api.patients.list();
      setPatients(data);
      if (data.length > 0 && !selectedPatient) {
        handleSelectPatient(data[0]);
      }
    } catch (error) {
      console.error("Failed to load patients:", error);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setLoading(true);
    try {
      // 1. Fetch treatment history
      const treatments = await api.treatments.list();
      const patientTreatments = treatments.filter(t => t.patient.id === patient.id);
      setTreatmentHistory(patientTreatments.sort((a, b) => b.id - a.id));

      // 2. Fetch appointments
      const appointments = await api.appointments.list();
      const patientAppts = appointments.filter(a => a.patient.id === patient.id);
      setAppointmentHistory(patientAppts.sort((a, b) => new Date(b.appointmentTime) - new Date(a.appointmentTime)));

      // 3. Fetch invoices
      const invoices = await api.billing.invoices();
      const patientInvoices = invoices.filter(i => i.patient.id === patient.id);
      setInvoiceHistory(patientInvoices.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("Failed to load patient history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    setEditingPatient({
      id: selectedPatient.id,
      name: selectedPatient.name,
      phone: selectedPatient.phone,
      email: selectedPatient.email || '',
      age: selectedPatient.age,
      gender: selectedPatient.gender || 'Male',
      medicalHistory: selectedPatient.medicalHistory || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    try {
      // In a real application we would call api.patients.update, but let's check:
      // Our api wrapper has:
      // api.patients.list()
      // api.patients.create()
      // Let's make sure if we need to call fetch directly or if we have an endpoint.
      // Yes, in api.js, request has standard method handling. We can write a custom request or check:
      // Since api.patients has no update, let's write request in api.js or handle updating in localStorage fallback or make a PUT call.
      // Wait, let's check if the backend has PUT /api/patients/{id}. Yes, line 38 in PatientController:
      // @PutMapping("/{id}") public ResponseEntity<Patient> updatePatient(...)
      // Let's add update to api.patients in api.js, or just use request directly in PatientHistoryView!
      // Wait, since we import api, can we add `update` dynamically?
      // Yes, we can just use fetch or add it to api.js. Since we already updated api.js, we can also add it to api.js or call the api endpoint.
      // Let's call request or edit api.js to add patient.update! That's very clean.
      // Wait, let's just make sure we update it. Let's see what is inside api.js.
      // Let's check how api.js handles update:
      // Currently, it does not have update. Let's write request or we can edit api.js later.
      // Wait! We can edit api.js to add:
      // patients: { ..., update: (id, data) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }) }
      // Let's call request or update api.js. Let's check how we can do it.
      
      const res = await fetch(`http://localhost:8081/api/patients/${editingPatient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': JSON.parse(sessionStorage.getItem('currentUser') || '{"username":"admin"}').username,
        },
        body: JSON.stringify(editingPatient)
      });
      
      if (!res.ok) {
        throw new Error("Failed to update patient details");
      }
      
      const updated = await res.json();
      setIsEditModalOpen(false);
      
      // Update local mock storage as well
      const localPats = JSON.parse(localStorage.getItem('sudha_patients') || '[]');
      const index = localPats.findIndex(p => p.id === editingPatient.id);
      if (index > -1) {
        localPats[index] = { ...localPats[index], ...editingPatient };
        localStorage.setItem('sudha_patients', JSON.stringify(localPats));
      }

      setSelectedPatient(updated);
      loadPatients();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  // Filter patients based on search
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 font-sans">Patient Files & Medical History</h1>
        <p className="text-sm text-slate-500">Search and click on any patient profile to access their full case files and clinical timelines.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Side: Search & Selection List */}
        <div className="md:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[650px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name/phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredPatients.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No patients found</p>
            ) : (
              filteredPatients.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className={`w-full text-left p-3.5 transition-all flex flex-col space-y-1 ${
                    selectedPatient?.id === p.id 
                      ? 'bg-primary-50/70 border-l-4 border-primary-600' 
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <span className="font-bold text-xs text-slate-800">{p.name}</span>
                  <span className="text-[10px] text-slate-500 flex items-center font-mono">
                    <Phone className="w-3 h-3 mr-1 text-slate-400" /> {p.phone}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Timelines & File History */}
        <div className="md:col-span-3 space-y-6">
          {selectedPatient ? (
            <>
              {/* Profile Card Summary */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex justify-between items-start">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-full bg-slate-100 text-slate-600">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-extrabold text-base text-slate-800">{selectedPatient.name}</h2>
                      <p className="text-xs text-slate-400 font-medium">Patient ID: #PAT-{selectedPatient.id} • Age: {selectedPatient.age} ({selectedPatient.gender})</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
                    <div className="flex items-center text-slate-600">
                      <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      <span>{selectedPatient.phone}</span>
                    </div>
                    <div className="flex items-center text-slate-600">
                      <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      <span className="truncate">{selectedPatient.email || 'No email registered'}</span>
                    </div>
                  </div>

                  {selectedPatient.medicalHistory && (
                    <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-3 flex items-start space-x-2 text-amber-800 text-xs">
                      <ShieldAlert className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
                      <div>
                        <span className="font-bold">Medical History Advisory:</span>
                        <p className="mt-0.5 text-amber-700 font-medium">{selectedPatient.medicalHistory}</p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleOpenEditModal}
                  className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 font-bold transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit File</span>
                </button>
              </div>

              {/* History Tabs Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Clinical EMR History Timeline (2/3 width) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h3 className="font-extrabold text-sm text-slate-800 flex items-center mb-4">
                      <ClipboardList className="w-4 h-4 mr-2 text-primary-700" />
                      <span>Clinical Treatment Timeline</span>
                    </h3>

                    {loading ? (
                      <p className="text-xs text-slate-400 text-center py-12 animate-pulse">Loading files...</p>
                    ) : treatmentHistory.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 border border-dashed border-slate-100 rounded-xl">
                        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-xs font-semibold">No treatment logs registered.</p>
                      </div>
                    ) : (
                      <div className="relative border-l border-slate-200 ml-3 pl-6 space-y-6">
                        {treatmentHistory.map((tr) => (
                          <div key={tr.id} className="relative group">
                            {/* Dot */}
                            <span className="absolute -left-[31px] top-1.5 p-1 bg-primary-600 text-white rounded-full ring-4 ring-white shadow-sm flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </span>
                            <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-200 rounded-xl p-4 transition-all">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-extrabold text-slate-800 text-xs">{tr.procedureCompleted}</h4>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Log ID: #TR-{tr.id} • Dr. {tr.dentist?.fullName || 'Sarah Jenkins'}</p>
                                </div>
                                <span className="font-bold text-slate-700 text-xs">₹{tr.cost}</span>
                              </div>
                              
                              <div className="mt-3 grid grid-cols-2 gap-4 text-[11px] border-t border-slate-100 pt-3">
                                <div>
                                  <span className="text-slate-400 font-medium">Chief Complaint:</span>
                                  <p className="text-slate-700 italic">"{tr.chiefComplaint}"</p>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-medium">Clinical Diagnosis:</span>
                                  <p className="text-slate-700 font-semibold text-slate-800">{tr.diagnosis}</p>
                                </div>
                              </div>

                              {/* Prescriptions nested inside the visit */}
                              {tr.prescriptions && tr.prescriptions.length > 0 && (
                                <div className="mt-3 bg-white p-2.5 rounded-lg border border-slate-200/50 space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center">
                                    <Pill className="w-3 h-3 mr-1 text-slate-400" /> Prescribed Medications:
                                  </span>
                                  {tr.prescriptions.map((p, idx) => (
                                    <div key={idx} className="text-[10px] text-slate-700 flex justify-between border-b border-slate-100 last:border-b-0 py-0.5">
                                      <span className="font-semibold text-slate-800">{p.medicineName} {p.dosage}</span>
                                      <span className="text-slate-500">{p.duration} • <span className="italic">"{p.instructions}"</span></span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right columns: Invoices and Appointments (1/3 width) */}
                <div className="space-y-4">
                  {/* Billing history */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h3 className="font-extrabold text-sm text-slate-800 flex items-center mb-3">
                      <IndianRupee className="w-4 h-4 mr-2 text-slate-600" />
                      <span>Invoice History</span>
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {invoiceHistory.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">No invoices</p>
                      ) : (
                        invoiceHistory.map((inv) => (
                          <div key={inv.id} className="border border-slate-200/60 rounded-xl p-3 text-xs bg-slate-50/50">
                            <div className="flex justify-between font-semibold">
                              <span className="font-mono text-slate-500">#INV-{inv.id}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                                inv.status === 'PARTIALLY_PAID' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {inv.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 mt-2 text-[10px] border-t border-slate-100 pt-2">
                              <div>
                                <span className="text-slate-400">Total Bill:</span>
                                <p className="font-bold text-slate-700">₹{inv.totalAmount}</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Paid:</span>
                                <p className="font-semibold text-slate-600">₹{inv.paidAmount}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Appointments history */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h3 className="font-extrabold text-sm text-slate-800 flex items-center mb-3">
                      <Calendar className="w-4 h-4 mr-2 text-slate-600" />
                      <span>Visits History</span>
                    </h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {appointmentHistory.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">No visits</p>
                      ) : (
                        appointmentHistory.map((appt) => (
                          <div key={appt.id} className="border border-slate-200/60 rounded-xl p-3 text-xs bg-slate-50/50">
                            <div className="flex justify-between items-center font-semibold">
                              <span className="text-slate-700">
                                {new Date(appt.appointmentTime).toLocaleDateString()}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                appt.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' : 'bg-primary-50 text-primary-700'
                              }`}>
                                {appt.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 italic">"{appt.chiefComplaint || 'Consultation'}"</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 shadow-sm">
              <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold">No Patient Selected</p>
              <p className="text-xs mt-1">Please register or search and select a patient in the left panel to access records.</p>
            </div>
          )}
        </div>

      </div>

      {/* Edit Patient Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-base font-bold">Edit Patient Case File</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-white/80 hover:text-white text-2xl font-semibold">&times;</button>
            </div>
            <form onSubmit={handleUpdatePatient} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-500 font-semibold uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingPatient.name}
                    onChange={(e) => setEditingPatient({ ...editingPatient, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={editingPatient.phone}
                    onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingPatient.email}
                    onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">Age</label>
                  <input
                    type="number"
                    required
                    value={editingPatient.age}
                    onChange={(e) => setEditingPatient({ ...editingPatient, age: parseInt(e.target.value) || '' })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold uppercase mb-1">Gender</label>
                  <select
                    value={editingPatient.gender}
                    onChange={(e) => setEditingPatient({ ...editingPatient, gender: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold uppercase mb-1">Medical History & Allergies</label>
                <textarea
                  rows="3"
                  value={editingPatient.medicalHistory}
                  onChange={(e) => setEditingPatient({ ...editingPatient, medicalHistory: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition text-sm font-semibold shadow-md"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
