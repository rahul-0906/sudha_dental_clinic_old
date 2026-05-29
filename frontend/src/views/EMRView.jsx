import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { BookOpen, User, Plus, Trash2, CheckCircle, ShieldAlert } from 'lucide-react';

const STANDARD_PROCEDURES = [
  { name: 'Filling', defaultCost: 1500 },
  { name: 'Root Canal', defaultCost: 6500 },
  { name: 'Extraction', defaultCost: 2000 },
  { name: 'Teeth Cleaning', defaultCost: 1200 },
  { name: 'Consultation Only', defaultCost: 300 }
];

export default function EMRView({ userRole }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [procedureCompleted, setProcedureCompleted] = useState('');
  const [cost, setCost] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [procedureOptions, setProcedureOptions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  
  // Prescription List
  const [prescriptions, setPrescriptions] = useState([]);
  const [newMed, setNewMed] = useState({ medicineName: '', dosage: '', duration: '', instructions: '' });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const list = await api.patients.list();
        setPatients(list);
        if (list.length > 0) setSelectedPatientId(list[0].id.toString());
      } catch (err) {
        console.error("Failed to load patients", err);
      }

      try {
        const mappingList = await api.mappings.list();
        const mappedNames = Array.from(new Set(mappingList.map(m => m.procedureName)));
        const allNames = Array.from(new Set([...mappedNames, ...STANDARD_PROCEDURES.map(p => p.name)]));
        setProcedureOptions(allNames);
        if (allNames.length > 0) {
          const firstProc = allNames[0];
          setProcedureCompleted(firstProc);
          const standard = STANDARD_PROCEDURES.find(p => p.name === firstProc);
          setCost(standard ? standard.defaultCost : 1500);
          setPaidAmount(standard ? standard.defaultCost : 1500);
        }
      } catch (err) {
        console.error("Failed to load mappings", err);
        const fallbackNames = STANDARD_PROCEDURES.map(p => p.name);
        setProcedureOptions(fallbackNames);
        if (fallbackNames.length > 0) {
          setProcedureCompleted(fallbackNames[0]);
          const standard = STANDARD_PROCEDURES.find(p => p.name === fallbackNames[0]);
          setCost(standard ? standard.defaultCost : 1500);
          setPaidAmount(standard ? standard.defaultCost : 1500);
        }
      }
      
      try {
        const inventoryList = await api.inventory.list();
        const meds = inventoryList.filter(item => (item.type || 'MATERIAL') === 'MEDICINE');
        setMedicines(meds);
        if (meds.length > 0) {
          setNewMed(prev => ({ ...prev, medicineName: meds[0].materialName }));
        }
      } catch (err) {
        console.error("Failed to load medicines list", err);
      }
    };
    loadData();
  }, []);

  const handleProcedureChange = (e) => {
    const procName = e.target.value;
    setProcedureCompleted(procName);
    const standard = STANDARD_PROCEDURES.find(p => p.name === procName);
    if (standard) {
      setCost(standard.defaultCost);
      setPaidAmount(standard.defaultCost);
    } else {
      setCost(1500);
      setPaidAmount(1500);
    }
  };

  const addPrescriptionRow = () => {
    if (!newMed.medicineName) return;
    setPrescriptions([...prescriptions, { ...newMed }]);
    setNewMed({ medicineName: '', dosage: '', duration: '', instructions: '' });
  };

  const removePrescriptionRow = (index) => {
    setPrescriptions(prescriptions.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert("Please select a patient.");
      return;
    }

    setLoading(true);
    try {
      await api.treatments.create({
        patientId: parseInt(selectedPatientId),
        dentistId: 2, // Mocked Dentist Dr. Sarah Jenkins
        chiefComplaint,
        diagnosis,
        procedureCompleted,
        cost: parseFloat(cost) || 0,
        paidAmount: parseFloat(paidAmount) || 0,
        prescriptions
      });

      setSuccessMsg("EMR treatment record log created! Stock materials auto-deducted and invoice generated.");
      
      // Reset form
      setChiefComplaint('');
      setDiagnosis('');
      setPrescriptions([]);
      if (procedureOptions.length > 0) {
        const firstProc = procedureOptions[0];
        setProcedureCompleted(firstProc);
        const standard = STANDARD_PROCEDURES.find(p => p.name === firstProc);
        setCost(standard ? standard.defaultCost : 1500);
        setPaidAmount(standard ? standard.defaultCost : 1500);
      }

      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert("Error submitting EMR: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // EMR check (Dentists or Admin)
  if (userRole === 'RECEPTIONIST') {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center max-w-md mx-auto mt-12 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Access Restricted</h3>
        <p className="text-slate-500 text-sm mt-1">
          Only Dentists and Administrators are authorized to update patient Electronic Medical Records (EMR) and prescribe medications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">EMR & Treatment Entry</h1>
        <p className="text-sm text-slate-500">Record a patient clinical session, write prescriptions, and auto-deduct supplies.</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center space-x-2 text-emerald-800 shadow-sm animate-pulse">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      {/* Entry Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-primary-700" />
          <h2 className="text-lg font-bold text-slate-800">Visit Record Details</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center">
                <User className="w-3.5 h-3.5 mr-1" />
                <span>Patient File</span>
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Phone: {p.phone})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Completed Procedure</label>
              <select
                value={procedureCompleted}
                onChange={handleProcedureChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
              >
                {procedureOptions.map(procName => (
                  <option key={procName} value={procName}>{procName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clinical Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Chief Complaint</label>
              <textarea
                rows="3"
                required
                placeholder="Why did the patient visit? e.g., severe localized sensitivity..."
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Diagnosis</label>
              <textarea
                rows="3"
                required
                placeholder="What was diagnosed? e.g., reversible pulpitis, dental caries..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          </div>

          {/* Cost and Ledger */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Total Procedure Cost (₹)</label>
              <input
                type="number"
                required
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Amount Paid Today (₹)</label>
              <input
                type="number"
                required
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Balance Remaining (₹)</label>
              <div className="px-3.5 py-2.5 font-bold text-slate-700 text-sm bg-slate-100 border border-slate-200 rounded-lg">
                ₹{Math.max(0, cost - paidAmount)}
              </div>
            </div>
          </div>

          {/* Prescription Section */}
          <div className="space-y-4 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-800">Prescription Builder</h3>
            
            {/* Added Medications Table */}
            {prescriptions.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase">
                      <th className="px-4 py-2">Medicine Name</th>
                      <th className="px-4 py-2">Dosage</th>
                      <th className="px-4 py-2">Duration</th>
                      <th className="px-4 py-2">Instructions</th>
                      <th className="px-4 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {prescriptions.map((pres, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 font-medium text-slate-800">{pres.medicineName}</td>
                        <td className="px-4 py-2 text-slate-600">{pres.dosage}</td>
                        <td className="px-4 py-2 text-slate-600">{pres.duration}</td>
                        <td className="px-4 py-2 text-slate-500 italic">"{pres.instructions}"</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removePrescriptionRow(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Row Builder Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Medicine Name</label>
                <select
                  value={newMed.medicineName}
                  onChange={(e) => setNewMed({ ...newMed, medicineName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                >
                  {medicines.length === 0 ? (
                    <option value="">No medicines found</option>
                  ) : (
                    medicines.map(med => (
                      <option key={med.id} value={med.materialName}>
                        {med.materialName} ({med.quantity} {med.unit} left)
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Dosage</label>
                <input
                  type="text"
                  placeholder="e.g. 500mg"
                  value={newMed.dosage}
                  onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                  className="w-full px-3.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 5 days"
                  value={newMed.duration}
                  onChange={(e) => setNewMed({ ...newMed, duration: e.target.value })}
                  className="w-full px-3.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                />
              </div>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Twice daily after meals"
                    value={newMed.instructions}
                    onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                    className="w-full px-3.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={addPrescriptionRow}
                  className="bg-slate-700 hover:bg-slate-800 text-white p-2 rounded-lg transition"
                  title="Add Medicine"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-lg transition text-sm font-semibold shadow-md disabled:opacity-50"
          >
            {loading ? 'Submitting Record...' : 'Submit Session Record'}
          </button>
        </div>
      </form>
    </div>
  );
}
