import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWorkflow } from '../store/WorkflowStore';
import { api } from '../api';
import {
  User,
  UserPlus,
  Stethoscope,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Activity,
  DollarSign,
  Plus,
  Trash2,
  Pill,
} from 'lucide-react';

// ─── Standard Procedures (same as EMRView) ──────────────────────────────────
const STANDARD_PROCEDURES = [
  { name: 'Filling', defaultCost: 1500 },
  { name: 'Root Canal', defaultCost: 6500 },
  { name: 'Extraction', defaultCost: 2000 },
  { name: 'Teeth Cleaning', defaultCost: 1200 },
  { name: 'Consultation Only', defaultCost: 300 },
];

// ─── Helper: Format elapsed wait time ────────────────────────────────────────
function formatWaitTime(isoTimestamp) {
  if (!isoTimestamp) return '—';
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

// ─── Collapsible Section Wrapper ─────────────────────────────────────────────
function PipelineSection({
  title,
  icon: Icon,
  accentColor,
  count,
  defaultOpen = true,
  children,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const accentStyles = {
    blue: {
      border: 'border-l-blue-500',
      bg: 'bg-blue-50/60',
      badge: 'bg-blue-100 text-blue-700',
      iconBg: 'bg-blue-100 text-blue-600',
      headerHover: 'hover:bg-blue-50/80',
    },
    green: {
      border: 'border-l-emerald-500',
      bg: 'bg-emerald-50/60',
      badge: 'bg-emerald-100 text-emerald-700',
      iconBg: 'bg-emerald-100 text-emerald-600',
      headerHover: 'hover:bg-emerald-50/80',
    },
    amber: {
      border: 'border-l-amber-500',
      bg: 'bg-amber-50/60',
      badge: 'bg-amber-100 text-amber-700',
      iconBg: 'bg-amber-100 text-amber-600',
      headerHover: 'hover:bg-amber-50/80',
    },
    slate: {
      border: 'border-l-slate-400',
      bg: 'bg-slate-50/60',
      badge: 'bg-slate-100 text-slate-600',
      iconBg: 'bg-slate-100 text-slate-500',
      headerHover: 'hover:bg-slate-50/80',
    },
  };

  const s = accentStyles[accentColor] || accentStyles.slate;

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 border-l-4 ${s.border} shadow-sm overflow-hidden transition-all duration-300`}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-5 py-3.5 ${s.headerHover} transition-colors duration-200`}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-1.5 rounded-lg ${s.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-800">{title}</span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.badge}`}
          >
            {count}
          </span>
        </div>
        <div className="text-slate-400 transition-transform duration-200">
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Body */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="px-5 pb-4 pt-1">{children}</div>
      </div>
    </div>
  );
}

// ─── Main Solo Omni-Dashboard Component ──────────────────────────────────────
export default function SoloOmniWorkflowView() {
  const {
    patientQueue,
    addToQueue,
    callPatientToDoctor,
    completeConsultation,
    completeBilling,
    VISIT_STATUS,
  } = useWorkflow();

  // ── Data loading state ──────────────────────────────────────────────────
  const [patients, setPatients] = useState([]);
  const [procedureOptions, setProcedureOptions] = useState([]);
  const [medicines, setMedicines] = useState([]);

  // ── Queue add form ──────────────────────────────────────────────────────
  const [queuePatientId, setQueuePatientId] = useState('');
  const [queueComplaint, setQueueComplaint] = useState('');

  // ── Active consultation form ────────────────────────────────────────────
  const [diagnosis, setDiagnosis] = useState('');
  const [procedure, setProcedure] = useState('');
  const [cost, setCost] = useState(0);
  const [notes, setNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [newMed, setNewMed] = useState({
    medicineName: '',
    dosage: '',
    duration: '',
    instructions: '',
  });

  // ── Solo mode billing (inline) ──────────────────────────────────────────
  const [showBillingInline, setShowBillingInline] = useState(false);
  const [billingAmount, setBillingAmount] = useState(0);

  // ── Pending billing quick forms ─────────────────────────────────────────
  const [pendingBillingAmounts, setPendingBillingAmounts] = useState({});

  // ── Processing flags ────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // ── Tick for live wait-time updates ─────────────────────────────────────
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Load reference data ─────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        const patientList = await api.patients.list();
        setPatients(patientList);
        if (patientList.length > 0) {
          setQueuePatientId(patientList[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load patients', err);
      }

      try {
        const mappingList = await api.mappings.list();
        const mappedNames = Array.from(
          new Set(mappingList.map((m) => m.procedureName))
        );
        const allNames = Array.from(
          new Set([
            ...mappedNames,
            ...STANDARD_PROCEDURES.map((p) => p.name),
          ])
        );
        setProcedureOptions(allNames);
        if (allNames.length > 0) {
          setProcedure(allNames[0]);
          const std = STANDARD_PROCEDURES.find((p) => p.name === allNames[0]);
          setCost(std ? std.defaultCost : 1500);
        }
      } catch {
        const fallback = STANDARD_PROCEDURES.map((p) => p.name);
        setProcedureOptions(fallback);
        if (fallback.length > 0) {
          setProcedure(fallback[0]);
          setCost(STANDARD_PROCEDURES[0].defaultCost);
        }
      }

      try {
        const inventoryList = await api.inventory.list();
        const meds = inventoryList.filter(
          (item) => (item.type || 'MATERIAL') === 'MEDICINE'
        );
        setMedicines(meds);
        if (meds.length > 0) {
          setNewMed((prev) => ({
            ...prev,
            medicineName: meds[0].materialName,
          }));
        }
      } catch {
        // silently fail
      }
    };
    loadData();
  }, []);

  // ── Grouped visits by status ────────────────────────────────────────────
  const visitsByStatus = useMemo(() => {
    const groups = {
      WAITING: [],
      WITH_DOCTOR: [],
      PENDING_BILLING: [],
      COMPLETED: [],
    };
    patientQueue.forEach((visit) => {
      if (groups[visit.status]) {
        groups[visit.status].push(visit);
      }
    });
    return groups;
  }, [patientQueue]);

  const totalQueueCount =
    visitsByStatus.WAITING.length +
    visitsByStatus.WITH_DOCTOR.length +
    visitsByStatus.PENDING_BILLING.length;

  // ── Daily Stats ─────────────────────────────────────────────────────────
  const dailyStats = useMemo(() => {
    const completed = visitsByStatus.COMPLETED;
    const totalRevenue = completed.reduce(
      (sum, v) => sum + (v.paidAmount || 0),
      0
    );

    const startedVisits = patientQueue.filter(
      (v) =>
        v.status !== VISIT_STATUS.WAITING && v.arrivalTime
    );
    let avgWait = 0;
    if (startedVisits.length > 0) {
      const totalMs = startedVisits.reduce((sum, v) => {
        const arrival = new Date(v.arrivalTime).getTime();
        const diff = Date.now() - arrival;
        return sum + diff;
      }, 0);
      avgWait = Math.round(totalMs / startedVisits.length / 60000);
    }

    return {
      patientsSeen: completed.length,
      totalRevenue,
      averageWaitMinutes: avgWait,
    };
  }, [patientQueue, visitsByStatus, VISIT_STATUS]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleAddToQueue = useCallback(
    (e) => {
      e.preventDefault();
      if (!queuePatientId) return;

      const pat = patients.find((p) => p.id === Number(queuePatientId));
      if (!pat) return;

      addToQueue(
        { id: pat.id, name: pat.name, phone: pat.phone },
        { id: 1, fullName: 'Dr. Mariyappan' },
        queueComplaint
      );

      setQueueComplaint('');
      flashSuccess('Patient added to queue');
    },
    [queuePatientId, queueComplaint, patients, addToQueue]
  );

  const handleStartVisit = useCallback(
    (visitId) => {
      callPatientToDoctor(visitId);
      // Reset consultation form
      setDiagnosis('');
      setNotes('');
      setShowBillingInline(false);
      setBillingAmount(0);
      setPrescriptions([]);
      if (procedureOptions.length > 0) {
        setProcedure(procedureOptions[0]);
        const std = STANDARD_PROCEDURES.find(
          (p) => p.name === procedureOptions[0]
        );
        setCost(std ? std.defaultCost : 1500);
      }
    },
    [callPatientToDoctor, procedureOptions]
  );

  const handleProcedureChange = useCallback(
    (procName) => {
      setProcedure(procName);
      const std = STANDARD_PROCEDURES.find((p) => p.name === procName);
      setCost(std ? std.defaultCost : 1500);
      setBillingAmount(std ? std.defaultCost : 1500);
    },
    []
  );

  const handleAddPrescription = useCallback(() => {
    if (!newMed.medicineName) return;
    setPrescriptions((prev) => [...prev, { ...newMed }]);
    setNewMed({
      medicineName: medicines.length > 0 ? medicines[0].materialName : '',
      dosage: '',
      duration: '',
      instructions: '',
    });
  }, [newMed, medicines]);

  const handleRemovePrescription = useCallback((index) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCompleteAndBill = useCallback(() => {
    setShowBillingInline(true);
    setBillingAmount(cost);
  }, [cost]);

  const handleFinalizeVisit = useCallback(
    async (visitId) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        // 1. Complete consultation in workflow store
        completeConsultation(visitId, {
          diagnosis,
          procedureCompleted: procedure,
          cost: parseFloat(cost) || 0,
          prescriptions,
          notes,
        });

        // 2. Create treatment record via API (handles inventory deduction + invoice)
        const activeVisit = patientQueue.find((v) => v.id === visitId);
        if (activeVisit) {
          await api.treatments.create({
            patientId: activeVisit.patient.id,
            dentistId: 1, // Dr. Mariyappan in solo mode
            chiefComplaint: activeVisit.chiefComplaint,
            diagnosis,
            procedureCompleted: procedure,
            cost: parseFloat(cost) || 0,
            paidAmount: parseFloat(billingAmount) || 0,
            prescriptions,
          });
        }

        // 3. Complete billing in workflow store
        completeBilling(visitId, parseFloat(billingAmount) || 0);

        // Reset form
        setDiagnosis('');
        setProcedure(procedureOptions[0] || '');
        setCost(
          STANDARD_PROCEDURES.find((p) => p.name === procedureOptions[0])
            ?.defaultCost || 1500
        );
        setNotes('');
        setPrescriptions([]);
        setShowBillingInline(false);
        setBillingAmount(0);

        flashSuccess('Visit finalized — treatment recorded, invoice generated!');
      } catch (err) {
        console.error('Failed to finalize visit:', err);
        alert('Error finalizing visit: ' + err.message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      diagnosis,
      procedure,
      cost,
      notes,
      prescriptions,
      billingAmount,
      patientQueue,
      procedureOptions,
      completeConsultation,
      completeBilling,
    ]
  );

  const handleQuickBilling = useCallback(
    async (visitId) => {
      const amount = parseFloat(pendingBillingAmounts[visitId]) || 0;
      const visit = patientQueue.find((v) => v.id === visitId);

      if (visit) {
        try {
          await api.treatments.create({
            patientId: visit.patient.id,
            dentistId: 1,
            chiefComplaint: visit.chiefComplaint,
            diagnosis: visit.diagnosis || 'As discussed',
            procedureCompleted: visit.procedureCompleted || 'Consultation Only',
            cost: visit.cost || amount,
            paidAmount: amount,
            prescriptions: visit.prescriptions || [],
          });
        } catch (err) {
          console.error('Quick billing API error:', err);
        }
      }

      completeBilling(visitId, amount);
      setPendingBillingAmounts((prev) => {
        const next = { ...prev };
        delete next[visitId];
        return next;
      });
      flashSuccess('Billing completed!');
    },
    [pendingBillingAmounts, patientQueue, completeBilling]
  );

  const flashSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // ── Active visit (WITH_DOCTOR) ──────────────────────────────────────────
  const activeVisit = visitsByStatus.WITH_DOCTOR[0] || null;

  // ────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
            <Activity className="w-6 h-6 text-primary-600" />
            <span>Solo Doctor Dashboard</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Queue, consult & bill — all in one place.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase">
            Active Queue
          </span>
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-black shadow-sm">
            {totalQueueCount}
          </span>
        </div>
      </div>

      {/* ─── Success Toast ────────────────────────────────────────────────── */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center space-x-2 shadow-sm animate-pulse">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">{successMsg}</p>
        </div>
      )}

      {/* ─── Quick Queue Add (Top Bar) ────────────────────────────────────── */}
      <form
        onSubmit={handleAddToQueue}
        className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4"
      >
        <div className="flex items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Patient
            </label>
            <select
              value={queuePatientId}
              onChange={(e) => setQueuePatientId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.phone})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-[2] min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Chief Complaint
            </label>
            <input
              type="text"
              value={queueComplaint}
              onChange={(e) => setQueueComplaint(e.target.value)}
              placeholder="e.g. toothache, cleaning, follow-up…"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
            />
          </div>
          <button
            type="submit"
            className="flex items-center space-x-1.5 bg-primary-700 hover:bg-primary-800 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add to Queue</span>
          </button>
        </div>
      </form>

      {/* ─── Visit Pipeline ───────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* ░░ WAITING Section ░░ */}
        <PipelineSection
          title="Waiting Room"
          icon={Clock}
          accentColor="blue"
          count={visitsByStatus.WAITING.length}
          defaultOpen={true}
        >
          {visitsByStatus.WAITING.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-2">
              No patients waiting.
            </p>
          ) : (
            <div className="space-y-2">
              {visitsByStatus.WAITING.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between bg-blue-50/40 rounded-lg px-4 py-3 border border-blue-100/60 group hover:bg-blue-50 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {visit.patient.name}
                      </p>
                      <p className="text-xs text-slate-500 italic">
                        {visit.chiefComplaint || 'No complaint noted'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatWaitTime(visit.arrivalTime)}</span>
                    </span>
                    <button
                      onClick={() => handleStartVisit(visit.id)}
                      disabled={activeVisit !== null}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all duration-200"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Start Visit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PipelineSection>

        {/* ░░ WITH_DOCTOR Section ░░ */}
        <PipelineSection
          title="Active Consultation"
          icon={Stethoscope}
          accentColor="green"
          count={visitsByStatus.WITH_DOCTOR.length}
          defaultOpen={true}
        >
          {!activeVisit ? (
            <p className="text-sm text-slate-400 italic py-2">
              No active consultation. Start a visit from the waiting room above.
            </p>
          ) : (
            <div className="space-y-5">
              {/* Patient info banner */}
              <div className="flex items-center space-x-3 bg-emerald-50/60 rounded-lg px-4 py-3 border border-emerald-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {activeVisit.patient.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Complaint: &ldquo;{activeVisit.chiefComplaint || '—'}&rdquo;
                    &nbsp;•&nbsp; Waiting:{' '}
                    {formatWaitTime(activeVisit.arrivalTime)}
                  </p>
                </div>
              </div>

              {/* Inline consultation form */}
              {!showBillingInline ? (
                <div className="space-y-4">
                  {/* Procedure + Cost */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Procedure
                      </label>
                      <select
                        value={procedure}
                        onChange={(e) =>
                          handleProcedureChange(e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      >
                        {procedureOptions.map((proc) => (
                          <option key={proc} value={proc}>
                            {proc}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Cost (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Diagnosis
                      </label>
                      <input
                        type="text"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="e.g. dental caries, pulpitis…"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Clinical Notes
                    </label>
                    <textarea
                      rows="2"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional observations, instructions…"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
                    />
                  </div>

                  {/* Prescription Builder */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Pill className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600 uppercase">
                        Prescriptions
                      </span>
                      {prescriptions.length > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                          {prescriptions.length}
                        </span>
                      )}
                    </div>

                    {/* Current prescriptions */}
                    {prescriptions.length > 0 && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                              <th className="px-3 py-2">Medicine</th>
                              <th className="px-3 py-2">Dosage</th>
                              <th className="px-3 py-2">Duration</th>
                              <th className="px-3 py-2">Instructions</th>
                              <th className="px-3 py-2 w-8"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {prescriptions.map((pres, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 font-medium text-slate-800">
                                  {pres.medicineName}
                                </td>
                                <td className="px-3 py-2 text-slate-600">
                                  {pres.dosage}
                                </td>
                                <td className="px-3 py-2 text-slate-600">
                                  {pres.duration}
                                </td>
                                <td className="px-3 py-2 text-slate-500 italic">
                                  {pres.instructions}
                                </td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={() =>
                                      handleRemovePrescription(idx)
                                    }
                                    className="text-red-400 hover:text-red-600 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Add new prescription row */}
                    <div className="flex items-end gap-2 bg-slate-50/60 p-3 rounded-lg border border-dashed border-slate-200">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                          Medicine
                        </label>
                        <select
                          value={newMed.medicineName}
                          onChange={(e) =>
                            setNewMed({
                              ...newMed,
                              medicineName: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
                        >
                          {medicines.length === 0 ? (
                            <option value="">No medicines</option>
                          ) : (
                            medicines.map((med) => (
                              <option key={med.id} value={med.materialName}>
                                {med.materialName} ({med.quantity}{' '}
                                {med.unit})
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                          Dosage
                        </label>
                        <input
                          type="text"
                          placeholder="500mg"
                          value={newMed.dosage}
                          onChange={(e) =>
                            setNewMed({ ...newMed, dosage: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                          Duration
                        </label>
                        <input
                          type="text"
                          placeholder="5 days"
                          value={newMed.duration}
                          onChange={(e) =>
                            setNewMed({
                              ...newMed,
                              duration: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                          Instructions
                        </label>
                        <input
                          type="text"
                          placeholder="After meals"
                          value={newMed.instructions}
                          onChange={(e) =>
                            setNewMed({
                              ...newMed,
                              instructions: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddPrescription}
                        className="p-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-md transition flex-shrink-0"
                        title="Add Prescription"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Complete & Bill button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleCompleteAndBill}
                      className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Complete &amp; Bill</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Inline Billing Step ── */
                <div className="bg-emerald-50/40 border border-emerald-200/60 rounded-xl p-5 space-y-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-800">
                      Collect Payment
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Total Cost (₹)
                      </label>
                      <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700">
                        ₹{parseFloat(cost) || 0}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Amount Collected (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={billingAmount}
                        onChange={(e) => setBillingAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Balance (₹)
                      </label>
                      <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700">
                        ₹{Math.max(0, (parseFloat(cost) || 0) - (parseFloat(billingAmount) || 0))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setShowBillingInline(false)}
                      className="text-sm text-slate-500 hover:text-slate-700 font-medium transition"
                    >
                      ← Back to Consultation
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFinalizeVisit(activeVisit.id)}
                      disabled={isSubmitting}
                      className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isSubmitting
                          ? 'Finalizing…'
                          : 'Finalize Visit'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </PipelineSection>

        {/* ░░ PENDING_BILLING Section ░░ */}
        <PipelineSection
          title="Pending Billing"
          icon={CreditCard}
          accentColor="amber"
          count={visitsByStatus.PENDING_BILLING.length}
          defaultOpen={true}
        >
          {visitsByStatus.PENDING_BILLING.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-2">
              No visits pending billing.
            </p>
          ) : (
            <div className="space-y-2">
              {visitsByStatus.PENDING_BILLING.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between bg-amber-50/40 rounded-lg px-4 py-3 border border-amber-100/60 hover:bg-amber-50 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {visit.patient.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {visit.procedureCompleted || visit.chiefComplaint} •
                        Cost: ₹{visit.cost || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="₹ Amount"
                      value={pendingBillingAmounts[visit.id] ?? visit.cost ?? ''}
                      onChange={(e) =>
                        setPendingBillingAmounts((prev) => ({
                          ...prev,
                          [visit.id]: e.target.value,
                        }))
                      }
                      className="w-28 px-2.5 py-1.5 border border-amber-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                    />
                    <button
                      onClick={() => handleQuickBilling(visit.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all duration-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PipelineSection>

        {/* ░░ COMPLETED Section ░░ */}
        <PipelineSection
          title="Completed Today"
          icon={CheckCircle2}
          accentColor="slate"
          count={visitsByStatus.COMPLETED.length}
          defaultOpen={false}
        >
          {visitsByStatus.COMPLETED.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-2">
              No completed visits yet today.
            </p>
          ) : (
            <div className="space-y-1.5">
              {visitsByStatus.COMPLETED.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between bg-slate-50/60 rounded-lg px-4 py-2.5 border border-slate-100"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {visit.patient.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {visit.procedureCompleted ||
                          visit.chiefComplaint ||
                          '—'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    ₹{visit.paidAmount || 0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </PipelineSection>
      </div>

      {/* ─── Stats Footer ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-6 py-4">
        <div className="flex items-center justify-between divide-x divide-slate-200">
          <div className="flex items-center space-x-3 pr-8">
            <div className="p-2 bg-primary-50 rounded-lg">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Patients Seen
              </p>
              <p className="text-lg font-black text-slate-800">
                {dailyStats.patientsSeen}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 px-8">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Revenue Today
              </p>
              <p className="text-lg font-black text-slate-800">
                ₹{dailyStats.totalRevenue.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 pl-8">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Avg Wait Time
              </p>
              <p className="text-lg font-black text-slate-800">
                {dailyStats.averageWaitMinutes}
                <span className="text-xs font-medium text-slate-400 ml-0.5">
                  min
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
