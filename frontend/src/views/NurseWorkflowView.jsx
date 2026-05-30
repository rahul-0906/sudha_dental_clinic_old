import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWorkflow } from '../store/WorkflowStore';
import { api } from '../api';
import {
  UserPlus,
  Clock,
  Stethoscope,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Users,
  ArrowRight,
  Search,
  Phone,
  AlertCircle,
  Pill,
  IndianRupee,
  RefreshCw,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns a human-readable relative time string, e.g. "3 min ago" */
function relativeTime(isoOrDate) {
  if (!isoOrDate) return '';
  const diff = Math.max(0, Date.now() - new Date(isoOrDate).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Format time from ISO string */
function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Status Badge Micro-component ───────────────────────────────────────────

const STATUS_COLORS = {
  WAITING: 'bg-blue-100 text-blue-700',
  WITH_DOCTOR: 'bg-emerald-100 text-emerald-700',
  PENDING_BILLING: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-slate-100 text-slate-600',
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        STATUS_COLORS[status] || 'bg-slate-100 text-slate-500'
      }`}
    >
      {status?.replace('_', ' ')}
    </span>
  );
}

// ─── Pulsing Dot ────────────────────────────────────────────────────────────

function PulsingDot({ color = 'bg-emerald-500' }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span
        className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`}
      />
      <span
        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`}
      />
    </span>
  );
}

// ─── Column Header ──────────────────────────────────────────────────────────

function ColumnHeader({ icon: Icon, title, count, accentClass, stripClass }) {
  return (
    <div className="sticky top-0 z-10">
      <div className={`h-1.5 rounded-t-2xl ${stripClass}`} />
      <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className={`p-1.5 rounded-lg ${accentClass}`}>
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        </div>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${accentClass}`}
        >
          {count}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function NurseWorkflowView() {
  const {
    patientQueue,
    addToQueue,
    callPatientToDoctor,
    completeBilling,
  } = useWorkflow();

  // ── Local state ──────────────────────────────────────────────────────────
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [billingPanelId, setBillingPanelId] = useState(null);
  const [paidAmounts, setPaidAmounts] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');

  // Quick-add form state
  const [queueForm, setQueueForm] = useState({
    patientId: '',
    dentistId: '1',
    chiefComplaint: '',
  });

  // ── Load patients for the selector ───────────────────────────────────────
  useEffect(() => {
    const loadPatients = async () => {
      setPatientsLoading(true);
      try {
        const data = await api.patients.list();
        setPatients(data);
        if (data.length > 0 && !queueForm.patientId) {
          setQueueForm((prev) => ({ ...prev, patientId: data[0].id.toString() }));
        }
      } catch (err) {
        console.error('Failed to load patients:', err);
      } finally {
        setPatientsLoading(false);
      }
    };
    loadPatients();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived visit buckets ────────────────────────────────────────────────
  const waitingVisits = useMemo(
    () =>
      (patientQueue || [])
        .filter((v) => v.status === 'WAITING')
        .sort((a, b) => new Date(a.arrivalTime) - new Date(b.arrivalTime)),
    [patientQueue]
  );

  const withDoctorVisits = useMemo(
    () => (patientQueue || []).filter((v) => v.status === 'WITH_DOCTOR'),
    [patientQueue]
  );

  const pendingBillingVisits = useMemo(
    () => (patientQueue || []).filter((v) => v.status === 'PENDING_BILLING'),
    [patientQueue]
  );

  const completedVisits = useMemo(
    () =>
      (patientQueue || [])
        .filter((v) => v.status === 'COMPLETED')
        .sort((a, b) => new Date(b.completedTime || 0) - new Date(a.completedTime || 0)),
    [patientQueue]
  );

  // ── Filtered patients for dropdown ───────────────────────────────────────
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
    );
  }, [patients, patientSearch]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAddToQueue = useCallback(
    async (e) => {
      e.preventDefault();
      if (!queueForm.patientId) return;
      setActionLoading('add-queue');
      try {
        const pat = patients.find((p) => p.id === Number(queueForm.patientId));
        if (!pat) return;
        const dentist = queueForm.dentistId === '1'
          ? { id: 1, fullName: 'Dr. Mariyappan' }
          : { id: 2, fullName: 'Dr. Suraj' };
        addToQueue(
          { id: pat.id, name: pat.name, phone: pat.phone },
          dentist,
          queueForm.chiefComplaint
        );
        setQueueForm((prev) => ({
          ...prev,
          chiefComplaint: '',
        }));
      } catch (err) {
        console.error('Failed to add to queue:', err);
      } finally {
        setActionLoading(null);
      }
    },
    [queueForm, addToQueue, patients]
  );

  const handleSendToDoctor = useCallback(
    async (visitId) => {
      setActionLoading(`send-${visitId}`);
      try {
        await callPatientToDoctor(visitId);
      } catch (err) {
        console.error('Failed to send to doctor:', err);
      } finally {
        setActionLoading(null);
      }
    },
    [callPatientToDoctor]
  );

  const handleCompleteBilling = useCallback(
    async (visitId) => {
      const paid = parseFloat(paidAmounts[visitId]) || 0;
      setActionLoading(`bill-${visitId}`);
      try {
        await completeBilling(visitId, paid);
        setBillingPanelId(null);
        setPaidAmounts((prev) => {
          const next = { ...prev };
          delete next[visitId];
          return next;
        });
      } catch (err) {
        console.error('Failed to complete billing:', err);
      } finally {
        setActionLoading(null);
      }
    },
    [completeBilling, paidAmounts]
  );

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
            <Users className="w-6 h-6 text-primary-600" />
            <span>Daily Workflow</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Summary pills */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <span className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{waitingVisits.length} Waiting</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{withDoctorVisits.length} In Session</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold">
            <CreditCard className="w-3.5 h-3.5" />
            <span>{pendingBillingVisits.length} To Bill</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{completedVisits.length} Done</span>
          </span>
          <button
            onClick={() => window.location.reload()}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Kanban Columns ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ══════════════════════════════════════════════════════════════ */}
        {/* COLUMN 1 — WAITING (Patient Queue)                           */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[420px]">
          <ColumnHeader
            icon={Clock}
            title="Patient Queue"
            count={waitingVisits.length}
            accentClass="bg-blue-50 text-blue-600"
            stripClass="bg-gradient-to-r from-blue-500 to-blue-400"
          />

          {/* Quick-add form */}
          <form
            onSubmit={handleAddToQueue}
            className="px-4 pt-4 pb-3 border-b border-slate-100 bg-slate-50/60 space-y-2.5"
          >
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Quick Add Patient</span>
            </div>

            {/* Patient selector with search */}
            <div className="relative">
              <select
                value={queueForm.patientId}
                onChange={(e) =>
                  setQueueForm((prev) => ({ ...prev, patientId: e.target.value }))
                }
                className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition appearance-none"
                required
              >
                <option value="" disabled>
                  Select Patient…
                </option>
                {filteredPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.phone})
                  </option>
                ))}
              </select>
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Dentist selector */}
            <select
              value={queueForm.dentistId}
              onChange={(e) =>
                setQueueForm((prev) => ({ ...prev, dentistId: e.target.value }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition"
            >
              <option value="1">Dr. Mariyappan</option>
              <option value="2">Dr. Suraj</option>
            </select>

            {/* Chief complaint */}
            <input
              type="text"
              placeholder="Chief complaint…"
              value={queueForm.chiefComplaint}
              onChange={(e) =>
                setQueueForm((prev) => ({
                  ...prev,
                  chiefComplaint: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition placeholder:text-slate-400"
            />

            <button
              type="submit"
              disabled={actionLoading === 'add-queue' || !queueForm.patientId}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
            >
              {actionLoading === 'add-queue' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>Add to Queue</span>
            </button>
          </form>

          {/* Waiting cards */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {waitingVisits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Clock className="w-10 h-10 mb-2 text-slate-300" />
                <p className="text-sm font-medium">Queue is empty</p>
                <p className="text-xs mt-0.5">Add a patient above to get started</p>
              </div>
            ) : (
              waitingVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="group bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {visit.patientName || visit.patient?.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">
                          {visit.patientPhone || visit.patient?.phone}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      <span>{relativeTime(visit.arrivalTime)}</span>
                    </div>
                  </div>

                  {visit.chiefComplaint && (
                    <p className="text-xs text-slate-500 italic mt-2 line-clamp-2">
                      "{visit.chiefComplaint}"
                    </p>
                  )}

                  {visit.dentistName && (
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Assigned: <span className="font-semibold text-slate-600">{visit.dentistName}</span>
                    </p>
                  )}

                  <button
                    onClick={() => handleSendToDoctor(visit.id)}
                    disabled={actionLoading === `send-${visit.id}`}
                    className="mt-3 w-full flex items-center justify-center space-x-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm group-hover:shadow-md"
                  >
                    {actionLoading === `send-${visit.id}` ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Send to Doctor</span>
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* COLUMN 2 — WITH DOCTOR                                       */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[420px]">
          <ColumnHeader
            icon={Stethoscope}
            title="With Doctor"
            count={withDoctorVisits.length}
            accentClass="bg-emerald-50 text-emerald-600"
            stripClass="bg-gradient-to-r from-emerald-500 to-emerald-400"
          />

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {withDoctorVisits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Stethoscope className="w-10 h-10 mb-2 text-slate-300" />
                <p className="text-sm font-medium">No active sessions</p>
                <p className="text-xs mt-0.5">Patients will appear here once sent</p>
              </div>
            ) : (
              withDoctorVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {visit.patientName || visit.patient?.name}
                      </p>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <Stethoscope className="w-3 h-3 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700">
                          {visit.dentistName || visit.dentist?.fullName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <PulsingDot color="bg-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">
                        In Session
                      </span>
                    </div>
                  </div>

                  {visit.chiefComplaint && (
                    <p className="text-xs text-slate-500 italic mt-2 line-clamp-2">
                      "{visit.chiefComplaint}"
                    </p>
                  )}

                  {visit.arrivalTime && (
                    <div className="mt-2 flex items-center space-x-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>Arrived {relativeTime(visit.arrivalTime)}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* COLUMN 3 — PENDING BILLING                                   */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[420px]">
          <ColumnHeader
            icon={CreditCard}
            title="Pending Billing"
            count={pendingBillingVisits.length}
            accentClass="bg-amber-50 text-amber-600"
            stripClass="bg-gradient-to-r from-amber-500 to-amber-400"
          />

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {pendingBillingVisits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <CreditCard className="w-10 h-10 mb-2 text-slate-300" />
                <p className="text-sm font-medium">No pending bills</p>
                <p className="text-xs mt-0.5">Patients done with consultation appear here</p>
              </div>
            ) : (
              pendingBillingVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="group bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {visit.patientName || visit.patient?.name}
                      </p>
                      {visit.procedureCompleted && (
                        <div className="flex items-center space-x-1.5 mt-1">
                          <span className="inline-flex items-center bg-amber-50 text-amber-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                            {visit.procedureCompleted}
                          </span>
                        </div>
                      )}
                    </div>
                    {visit.cost != null && (
                      <span className="flex items-center space-x-0.5 text-sm font-bold text-slate-800">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-500" />
                        <span>{visit.cost}</span>
                      </span>
                    )}
                  </div>

                  {/* Prescriptions summary */}
                  {visit.prescriptions && visit.prescriptions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center space-x-1 text-[11px] font-semibold text-slate-500 uppercase">
                        <Pill className="w-3 h-3" />
                        <span>Prescriptions</span>
                      </div>
                      {visit.prescriptions.map((rx, i) => (
                        <p
                          key={i}
                          className="text-xs text-slate-600 pl-4 truncate"
                        >
                          • {rx.medicineName}{' '}
                          <span className="text-slate-400">
                            {rx.dosage} × {rx.duration}
                          </span>
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Inline billing panel */}
                  {billingPanelId === visit.id ? (
                    <div className="mt-3 pt-3 border-t border-amber-100 space-y-2.5 animate-in slide-in-from-top-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Total Cost</span>
                        <span className="font-bold text-slate-800">
                          ₹{visit.cost || 0}
                        </span>
                      </div>

                      {visit.prescriptions && visit.prescriptions.length > 0 && (
                        <div className="flex items-center space-x-1.5 bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold">
                          <Pill className="w-3 h-3" />
                          <span>
                            {visit.prescriptions.length} medicine
                            {visit.prescriptions.length > 1 ? 's' : ''} to dispense
                          </span>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                          Amount Collected
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={paidAmounts[visit.id] || ''}
                            onChange={(e) =>
                              setPaidAmounts((prev) => ({
                                ...prev,
                                [visit.id]: e.target.value,
                              }))
                            }
                            className="w-full pl-7 pr-3 py-2 border border-amber-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => setBillingPanelId(null)}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleCompleteBilling(visit.id)}
                          disabled={actionLoading === `bill-${visit.id}`}
                          className="flex-1 flex items-center justify-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-bold transition shadow-sm"
                        >
                          {actionLoading === `bill-${visit.id}` ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Complete Visit</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setBillingPanelId(visit.id)}
                      className="mt-3 w-full flex items-center justify-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm group-hover:shadow-md"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Dispense &amp; Bill</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4 — COMPLETED TODAY (Collapsible)                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <button
          onClick={() => setCompletedExpanded((prev) => !prev)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition"
        >
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Completed Today</h3>
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
              {completedVisits.length}
            </span>
          </div>
          {completedExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {completedExpanded && (
          <div className="border-t border-slate-100">
            {completedVisits.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">No completed visits yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {completedVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition"
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="p-1.5 rounded-full bg-emerald-50 text-emerald-500">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">
                          {visit.patientName || visit.patient?.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {visit.procedureCompleted || visit.chiefComplaint || 'General visit'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0">
                      {visit.paidAmount != null && (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          ₹{visit.paidAmount}
                        </span>
                      )}
                      {visit.completedTime && (
                        <span className="text-xs text-slate-400 font-medium">
                          {formatTime(visit.completedTime)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
