import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'sudha_workflow_queue';
const NURSE_MODE_KEY = 'sudha_nurse_mode';

const VISIT_STATUS = {
  WAITING: 'WAITING',
  WITH_DOCTOR: 'WITH_DOCTOR',
  PENDING_BILLING: 'PENDING_BILLING',
  COMPLETED: 'COMPLETED',
};

// ─── Seed Data ────────────────────────────────────────────────────────────────
const createSeedQueue = () => {
  const now = new Date();

  return [
    {
      id: 'visit_seed_1',
      patient: { id: 1, name: 'John Doe', phone: '9876543210' },
      dentist: { id: 1, fullName: 'Dr. Mariyappan' },
      chiefComplaint: 'Toothache in upper left molar',
      status: VISIT_STATUS.WAITING,
      arrivalTime: new Date(now.getTime() - 45 * 60000).toISOString(), // 45 min ago
      notes: '',
      diagnosis: '',
      procedureCompleted: '',
      cost: 0,
      paidAmount: 0,
      prescriptions: [],
    },
    {
      id: 'visit_seed_2',
      patient: { id: 2, name: 'Jane Smith', phone: '9876543211' },
      dentist: { id: 2, fullName: 'Dr. Suraj' },
      chiefComplaint: 'Routine dental cleanup',
      status: VISIT_STATUS.WITH_DOCTOR,
      arrivalTime: new Date(now.getTime() - 60 * 60000).toISOString(), // 1 hr ago
      notes: 'Patient is comfortable, proceeding with scaling.',
      diagnosis: '',
      procedureCompleted: '',
      cost: 0,
      paidAmount: 0,
      prescriptions: [],
    },
    {
      id: 'visit_seed_3',
      patient: { id: 3, name: 'Alice Johnson', phone: '9876543212' },
      dentist: { id: 1, fullName: 'Dr. Mariyappan' },
      chiefComplaint: 'Sensitivity to cold drinks',
      status: VISIT_STATUS.PENDING_BILLING,
      arrivalTime: new Date(now.getTime() - 90 * 60000).toISOString(), // 1.5 hrs ago
      notes: 'Applied desensitizing agent. Advised fluoride toothpaste.',
      diagnosis: 'Cervical abrasion with dentin hypersensitivity',
      procedureCompleted: 'Desensitizing Treatment',
      cost: 800,
      paidAmount: 0,
      prescriptions: [
        { medicineName: 'Sensodyne Toothpaste', dosage: 'Pea-sized', duration: '3 months', instructions: 'Use twice daily' },
      ],
    },
    {
      id: 'visit_seed_4',
      patient: { id: 1, name: 'John Doe', phone: '9876543210' },
      dentist: { id: 2, fullName: 'Dr. Suraj' },
      chiefComplaint: 'Follow-up for filling done last week',
      status: VISIT_STATUS.WAITING,
      arrivalTime: new Date(now.getTime() - 15 * 60000).toISOString(), // 15 min ago
      notes: '',
      diagnosis: '',
      procedureCompleted: '',
      cost: 0,
      paidAmount: 0,
      prescriptions: [],
    },
  ];
};

// ─── LocalStorage Helpers ─────────────────────────────────────────────────────
const loadQueueFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('WorkflowStore: Failed to parse localStorage queue, seeding fresh data.', err);
  }
  // Seed fresh data
  const seed = createSeedQueue();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
};

const loadNurseModeFromStorage = () => {
  try {
    const raw = localStorage.getItem(NURSE_MODE_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore parse errors
  }
  return true; // default: nurse is available
};

const persistQueue = (queue) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('WorkflowStore: Failed to persist queue to localStorage.', err);
  }
};

const persistNurseMode = (value) => {
  try {
    localStorage.setItem(NURSE_MODE_KEY, JSON.stringify(value));
  } catch {
    // Ignore
  }
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
const ACTION_TYPES = {
  TOGGLE_NURSE_MODE: 'TOGGLE_NURSE_MODE',
  ADD_TO_QUEUE: 'ADD_TO_QUEUE',
  CALL_TO_DOCTOR: 'CALL_TO_DOCTOR',
  COMPLETE_CONSULTATION: 'COMPLETE_CONSULTATION',
  COMPLETE_BILLING: 'COMPLETE_BILLING',
};

function workflowReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.TOGGLE_NURSE_MODE: {
      const next = !state.isNurseAvailable;
      persistNurseMode(next);
      return { ...state, isNurseAvailable: next };
    }

    case ACTION_TYPES.ADD_TO_QUEUE: {
      const { patient, dentist, chiefComplaint } = action.payload;
      const newVisit = {
        id: `visit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        patient: {
          id: patient.id,
          name: patient.name,
          phone: patient.phone || '',
        },
        dentist: {
          id: dentist.id,
          fullName: dentist.fullName,
        },
        chiefComplaint: chiefComplaint || '',
        status: VISIT_STATUS.WAITING,
        arrivalTime: new Date().toISOString(),
        notes: '',
        diagnosis: '',
        procedureCompleted: '',
        cost: 0,
        paidAmount: 0,
        prescriptions: [],
      };
      const nextQueue = [...state.patientQueue, newVisit];
      persistQueue(nextQueue);
      return { ...state, patientQueue: nextQueue };
    }

    case ACTION_TYPES.CALL_TO_DOCTOR: {
      const { visitId } = action.payload;
      const nextQueue = state.patientQueue.map((visit) => {
        if (visit.id === visitId && visit.status === VISIT_STATUS.WAITING) {
          return { ...visit, status: VISIT_STATUS.WITH_DOCTOR };
        }
        return visit;
      });
      persistQueue(nextQueue);
      return { ...state, patientQueue: nextQueue };
    }

    case ACTION_TYPES.COMPLETE_CONSULTATION: {
      const { visitId, diagnosis, procedureCompleted, cost, prescriptions, notes } = action.payload;
      const nextQueue = state.patientQueue.map((visit) => {
        if (visit.id === visitId && visit.status === VISIT_STATUS.WITH_DOCTOR) {
          return {
            ...visit,
            status: VISIT_STATUS.PENDING_BILLING,
            diagnosis: diagnosis || visit.diagnosis,
            procedureCompleted: procedureCompleted || visit.procedureCompleted,
            cost: cost != null ? cost : visit.cost,
            prescriptions: prescriptions || visit.prescriptions,
            notes: notes != null ? notes : visit.notes,
          };
        }
        return visit;
      });
      persistQueue(nextQueue);
      return { ...state, patientQueue: nextQueue };
    }

    case ACTION_TYPES.COMPLETE_BILLING: {
      const { visitId, paidAmount } = action.payload;
      const nextQueue = state.patientQueue.map((visit) => {
        if (visit.id === visitId && visit.status === VISIT_STATUS.PENDING_BILLING) {
          return {
            ...visit,
            status: VISIT_STATUS.COMPLETED,
            paidAmount: paidAmount != null ? paidAmount : visit.paidAmount,
          };
        }
        return visit;
      });
      persistQueue(nextQueue);
      return { ...state, patientQueue: nextQueue };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const WorkflowContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function WorkflowProvider({ children }) {
  const [state, dispatch] = useReducer(workflowReducer, null, () => ({
    isNurseAvailable: loadNurseModeFromStorage(),
    patientQueue: loadQueueFromStorage(),
  }));

  // Re-persist queue whenever it changes (covers any edge cases the reducer might miss)
  useEffect(() => {
    persistQueue(state.patientQueue);
  }, [state.patientQueue]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const toggleNurseMode = useCallback(() => {
    dispatch({ type: ACTION_TYPES.TOGGLE_NURSE_MODE });
  }, []);

  const addToQueue = useCallback((patient, dentist, chiefComplaint) => {
    if (!patient || !patient.id || !dentist || !dentist.id) {
      console.warn('WorkflowStore: addToQueue requires valid patient and dentist objects.');
      return;
    }
    dispatch({
      type: ACTION_TYPES.ADD_TO_QUEUE,
      payload: { patient, dentist, chiefComplaint },
    });
  }, []);

  const callPatientToDoctor = useCallback((visitId) => {
    if (!visitId) {
      console.warn('WorkflowStore: callPatientToDoctor requires a visitId.');
      return;
    }
    dispatch({
      type: ACTION_TYPES.CALL_TO_DOCTOR,
      payload: { visitId },
    });
  }, []);

  const completeConsultation = useCallback((visitId, { diagnosis, procedureCompleted, cost, prescriptions, notes } = {}) => {
    if (!visitId) {
      console.warn('WorkflowStore: completeConsultation requires a visitId.');
      return;
    }
    dispatch({
      type: ACTION_TYPES.COMPLETE_CONSULTATION,
      payload: { visitId, diagnosis, procedureCompleted, cost, prescriptions, notes },
    });
  }, []);

  const completeBilling = useCallback((visitId, paidAmount) => {
    if (!visitId) {
      console.warn('WorkflowStore: completeBilling requires a visitId.');
      return;
    }
    dispatch({
      type: ACTION_TYPES.COMPLETE_BILLING,
      payload: { visitId, paidAmount },
    });
  }, []);

  // ── Query Helpers ─────────────────────────────────────────────────────────
  const getQueueByStatus = useCallback(
    (status) => {
      if (!status) return [];
      return state.patientQueue.filter((visit) => visit.status === status);
    },
    [state.patientQueue]
  );

  const getActiveVisit = useCallback(() => {
    return state.patientQueue.find((visit) => visit.status === VISIT_STATUS.WITH_DOCTOR) || null;
  }, [state.patientQueue]);

  // ── Memoized Context Value ────────────────────────────────────────────────
  const contextValue = useMemo(
    () => ({
      // State
      isNurseAvailable: state.isNurseAvailable,
      patientQueue: state.patientQueue,

      // Actions
      toggleNurseMode,
      addToQueue,
      callPatientToDoctor,
      completeConsultation,
      completeBilling,

      // Query Helpers
      getQueueByStatus,
      getActiveVisit,

      // Status enum for consumers
      VISIT_STATUS,
    }),
    [
      state.isNurseAvailable,
      state.patientQueue,
      toggleNurseMode,
      addToQueue,
      callPatientToDoctor,
      completeConsultation,
      completeBilling,
      getQueueByStatus,
      getActiveVisit,
    ]
  );

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a <WorkflowProvider>. Wrap your component tree with <WorkflowProvider>.');
  }
  return context;
}

// Re-export the status enum for convenience
export { VISIT_STATUS };
