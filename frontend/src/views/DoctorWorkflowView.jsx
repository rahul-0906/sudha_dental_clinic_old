import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWorkflow } from '../store/WorkflowStore';
import { api } from '../api';
import {
  User, Stethoscope, ClipboardList, Plus, Trash2,
  CheckCircle, Clock, AlertCircle, FileText, Pill
} from 'lucide-react';

// ─── Standard Procedures & Default Costs ───────────────────────────────────────
const STANDARD_PROCEDURES = [
  { name: 'Filling', defaultCost: 1500 },
  { name: 'Root Canal', defaultCost: 6500 },
  { name: 'Extraction', defaultCost: 2000 },
  { name: 'Teeth Cleaning', defaultCost: 1200 },
  { name: 'Consultation Only', defaultCost: 300 },
];

// ─── Wait‑time helper ──────────────────────────────────────────────────────────
function formatWaitTime(checkedInAt) {
  if (!checkedInAt) return '—';
  const diffMs = Date.now() - new Date(checkedInAt).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENT QUEUE SIDEBAR  (Left 30 %)
// ═══════════════════════════════════════════════════════════════════════════════
function PatientQueueSidebar({ waitingVisits, activeVisit, onCallPatient }) {
  return (
    <aside className="w-full h-full flex flex-col bg-white border-r border-slate-200">
      {/* Sidebar Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ClipboardList className="w-5 h-5 text-primary-700" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">Patient Queue</h2>
        </div>
        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-primary-100 text-primary-700 text-xs font-bold tabular-nums">
          {waitingVisits.length}
        </span>
      </div>

      {/* Scrollable Queue List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {waitingVisits.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <CheckCircle className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-xs text-slate-400 font-medium">No patients waiting</p>
          </div>
        )}

        {waitingVisits.map((visit) => {
          const isActive = activeVisit?.id === visit.id;
          return (
            <button
              key={visit.id}
              onClick={() => !isActive && onCallPatient(visit.id)}
              disabled={isActive}
              className={`
                w-full text-left rounded-xl p-3.5 transition-all duration-200 group
                ${isActive
                  ? 'bg-blue-50 border-2 border-blue-400 shadow-sm cursor-default'
                  : 'bg-white border border-slate-150 hover:border-primary-300 hover:shadow-md hover:bg-primary-50/30 cursor-pointer'
                }
              `}
            >
              {/* Patient name + status badge */}
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500 group-hover:bg-primary-100 group-hover:text-primary-700'
                  } transition-colors`}>
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 truncate">
                    {visit.patientName || 'Unknown Patient'}
                  </span>
                </div>
                {isActive && (
                  <span className="flex-shrink-0 text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    In Room
                  </span>
                )}
              </div>

              {/* Wait time */}
              <div className="flex items-center space-x-1 text-[11px] text-slate-400 ml-10 mb-1">
                <Clock className="w-3 h-3" />
                <span>{formatWaitTime(visit.checkedInAt)}</span>
              </div>

              {/* Chief complaint preview */}
              {visit.chiefComplaint && (
                <p className="text-xs text-slate-500 leading-relaxed ml-10 line-clamp-2">
                  {visit.chiefComplaint}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVE CONSULTATION FORM  (Right 70 %)
// ═══════════════════════════════════════════════════════════════════════════════
function ActiveConsultation({ visit, medicines, onComplete }) {
  // ── Form state ────────────────────────────────────────────────────────────
  const [diagnosis, setDiagnosis] = useState('');
  const [procedure, setProcedure] = useState(STANDARD_PROCEDURES[0].name);
  const [cost, setCost] = useState(STANDARD_PROCEDURES[0].defaultCost);
  const [notes, setNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [newMed, setNewMed] = useState({ medicineName: '', dosage: '', duration: '', instructions: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset form when the active visit changes
  useEffect(() => {
    setDiagnosis('');
    setProcedure(STANDARD_PROCEDURES[0].name);
    setCost(STANDARD_PROCEDURES[0].defaultCost);
    setNotes('');
    setPrescriptions([]);
    setNewMed({ medicineName: medicines[0]?.materialName || '', dosage: '', duration: '', instructions: '' });
    setSubmitting(false);
    setShowSuccess(false);
  }, [visit?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Procedure change → update cost ────────────────────────────────────────
  const handleProcedureChange = (e) => {
    const name = e.target.value;
    setProcedure(name);
    const match = STANDARD_PROCEDURES.find((p) => p.name === name);
    setCost(match ? match.defaultCost : 1500);
  };

  // ── Prescription helpers ──────────────────────────────────────────────────
  const addPrescription = () => {
    if (!newMed.medicineName) return;
    setPrescriptions((prev) => [...prev, { ...newMed }]);
    setNewMed({ medicineName: medicines[0]?.materialName || '', dosage: '', duration: '', instructions: '' });
  };

  const removePrescription = (idx) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!diagnosis.trim()) {
      alert('Please enter a diagnosis before completing the consultation.');
      return;
    }
    setSubmitting(true);
    try {
      await onComplete(visit.id, {
        diagnosis,
        procedureCompleted: procedure,
        cost: parseFloat(cost) || 0,
        prescriptions,
        notes,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) {
      alert('Failed to complete consultation: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* ── Success Toast ────────────────────────────────────────────────── */}
      {showSuccess && (
        <div className="sticky top-0 z-20 mx-6 mt-4 animate-slide-down">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center space-x-3 shadow-lg shadow-emerald-100/40">
            <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 animate-bounce-once">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">Consultation Completed!</p>
              <p className="text-xs text-emerald-600 mt-0.5">Patient moved to billing queue.</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        {/* ── Patient Info Header ──────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">{visit.patientName || 'Unknown Patient'}</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-xs text-slate-500">
                  {visit.patientPhone && <span>📞 {visit.patientPhone}</span>}
                  {visit.patientAge && <span>{visit.patientAge} yrs</span>}
                  {visit.patientGender && <span>• {visit.patientGender}</span>}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full uppercase tracking-wider">
              With Doctor
            </span>
          </div>

          {/* Chief complaint (read-only) */}
          {visit.chiefComplaint && (
            <div className="mt-4 bg-white/70 rounded-xl p-3 border border-slate-200/60">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Chief Complaint
              </label>
              <p className="text-sm text-slate-700 leading-relaxed">{visit.chiefComplaint}</p>
            </div>
          )}
        </div>

        {/* ── Section: Diagnosis ───────────────────────────────────────── */}
        <section>
          <SectionHeader icon={<Stethoscope className="w-4 h-4" />} title="Diagnosis" />
          <textarea
            rows={3}
            placeholder="What was diagnosed? e.g., reversible pulpitis, dental caries..."
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-shadow resize-none"
          />
        </section>

        {/* ── Section: Procedure & Cost ────────────────────────────────── */}
        <section>
          <SectionHeader icon={<FileText className="w-4 h-4" />} title="Procedure & Cost" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Procedure</label>
              <select
                value={procedure}
                onChange={handleProcedureChange}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
              >
                {STANDARD_PROCEDURES.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} — ₹{p.defaultCost.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Cost (₹)</label>
              <input
                type="number"
                min={0}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white font-semibold text-slate-800"
              />
            </div>
          </div>
        </section>

        {/* ── Section: Prescription Builder ────────────────────────────── */}
        <section>
          <SectionHeader icon={<Pill className="w-4 h-4" />} title="Prescription Builder" />

          {/* Existing prescriptions table */}
          {prescriptions.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden text-sm mb-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase">
                    <th className="px-4 py-2.5">Medicine</th>
                    <th className="px-4 py-2.5">Dosage</th>
                    <th className="px-4 py-2.5">Duration</th>
                    <th className="px-4 py-2.5">Instructions</th>
                    <th className="px-4 py-2.5 text-right w-16">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescriptions.map((pres, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{pres.medicineName}</td>
                      <td className="px-4 py-2.5 text-slate-600">{pres.dosage}</td>
                      <td className="px-4 py-2.5 text-slate-600">{pres.duration}</td>
                      <td className="px-4 py-2.5 text-slate-500 italic text-xs">"{pres.instructions}"</td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => removePrescription(idx)}
                          className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
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

          {/* New medication row builder */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Medicine</label>
              <select
                value={newMed.medicineName}
                onChange={(e) => setNewMed({ ...newMed, medicineName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {medicines.length === 0 ? (
                  <option value="">No medicines found</option>
                ) : (
                  medicines.map((med) => (
                    <option key={med.id} value={med.materialName}>
                      {med.materialName} ({med.quantity} {med.unit})
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
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Duration</label>
              <input
                type="text"
                placeholder="e.g. 5 days"
                value={newMed.duration}
                onChange={(e) => setNewMed({ ...newMed, duration: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Twice daily"
                  value={newMed.instructions}
                  onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                type="button"
                onClick={addPrescription}
                className="self-end bg-slate-700 hover:bg-slate-800 text-white p-2.5 rounded-lg transition-colors shadow-sm"
                title="Add Medicine"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ── Section: Doctor's Notes ──────────────────────────────────── */}
        <section>
          <SectionHeader icon={<ClipboardList className="w-4 h-4" />} title="Doctor's Notes" />
          <textarea
            rows={3}
            placeholder="Additional notes, follow-up instructions, or observations..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-shadow resize-none"
          />
        </section>

        {/* ── Action Button ────────────────────────────────────────────── */}
        <div className="pt-2 pb-4">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="
              w-full flex items-center justify-center space-x-2.5
              py-3.5 rounded-xl text-sm font-bold
              bg-primary-700 hover:bg-primary-800 text-white
              shadow-lg shadow-primary-700/20 hover:shadow-primary-700/30
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-5 h-5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Completing…</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Complete Consultation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable Section Header ────────────────────────────────────────────────
function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center space-x-2 mb-3">
      <span className="text-primary-700">{icon}</span>
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE  (No patient is WITH_DOCTOR)
// ═══════════════════════════════════════════════════════════════════════════════
function EmptyConsultation({ waitingCount }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8">
      <div className="relative mb-6">
        {/* Background decorative ring */}
        <div className="absolute inset-0 rounded-full bg-primary-100/40 animate-pulse-slow scale-150" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center shadow-inner">
          <Stethoscope className="w-9 h-9 text-primary-500" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-700 mb-1">No Patient in Consultation</h3>
      <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
        Select a patient from the queue to begin the consultation session.
      </p>

      {waitingCount > 0 && (
        <div className="mt-6 inline-flex items-center space-x-2 bg-amber-50 text-amber-700 text-xs font-bold px-4 py-2 rounded-full border border-amber-200">
          <AlertCircle className="w-4 h-4" />
          <span>
            {waitingCount} patient{waitingCount !== 1 ? 's' : ''} waiting
          </span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN VIEW EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export default function DoctorWorkflowView() {
  const { patientQueue, callPatientToDoctor, completeConsultation } = useWorkflow();

  // ── Medicine list from inventory ──────────────────────────────────────────
  const [medicines, setMedicines] = useState([]);

  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const inventoryList = await api.inventory.list();
        const meds = inventoryList.filter((item) => (item.type || 'MATERIAL') === 'MEDICINE');
        setMedicines(meds);
      } catch (err) {
        console.error('Failed to load medicines', err);
      }
    };
    loadMedicines();
  }, []);

  // ── Derived queues ────────────────────────────────────────────────────────
  const waitingVisits = useMemo(
    () => (patientQueue || []).filter((v) => v.status === 'WAITING'),
    [patientQueue],
  );

  const activeVisit = useMemo(
    () => (patientQueue || []).find((v) => v.status === 'WITH_DOCTOR') || null,
    [patientQueue],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCallPatient = useCallback(
    async (visitId) => {
      try {
        await callPatientToDoctor(visitId);
      } catch (err) {
        alert('Failed to call patient: ' + err.message);
      }
    },
    [callPatientToDoctor],
  );

  const handleCompleteConsultation = useCallback(
    async (visitId, data) => {
      await completeConsultation(visitId, data);
    },
    [completeConsultation],
  );

  // Combined list for sidebar: show active visit on top, then waiting
  const sidebarVisits = useMemo(() => {
    const list = [];
    if (activeVisit) list.push(activeVisit);
    list.push(...waitingVisits);
    return list;
  }, [activeVisit, waitingVisits]);

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-8 bg-slate-50">
      {/* ─── Left Panel: Queue Sidebar (30 %) ──────────────────────────── */}
      <div className="w-[30%] min-w-[260px] max-w-[380px] flex-shrink-0 border-r border-slate-200 bg-white shadow-sm">
        <PatientQueueSidebar
          waitingVisits={sidebarVisits}
          activeVisit={activeVisit}
          onCallPatient={handleCallPatient}
        />
      </div>

      {/* ─── Right Panel: Active Consultation (70 %) ───────────────────── */}
      <div className="flex-1 min-w-0 bg-white">
        {activeVisit ? (
          <ActiveConsultation
            key={activeVisit.id}
            visit={activeVisit}
            medicines={medicines}
            onComplete={handleCompleteConsultation}
          />
        ) : (
          <EmptyConsultation waitingCount={waitingVisits.length} />
        )}
      </div>

      {/* ─── Inline Keyframe Animations ────────────────────────────────── */}
      <style>{`
        @keyframes slide-down {
          0%   { opacity: 0; transform: translateY(-12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.35s ease-out;
        }

        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.2); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.5s ease-in-out;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
