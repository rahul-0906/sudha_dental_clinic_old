import { CLINIC_CONFIG } from './config';

const BASE_URL = 'http://localhost:8081/api';

// LocalStorage mock state keys
const KEYS = {
  PATIENTS: 'sudha_patients',
  APPOINTMENTS: 'sudha_appointments',
  INVENTORY: 'sudha_inventory',
  INVOICES: 'sudha_invoices',
  LEDGER: 'sudha_ledger',
  TREATMENTS: 'sudha_treatments',
};

// Seed mock data if localStorage is empty
const seedMockData = () => {
  if (!localStorage.getItem(KEYS.PATIENTS)) {
    localStorage.setItem(KEYS.PATIENTS, JSON.stringify([
      { id: 1, name: 'John Doe', phone: '9876543210', email: 'john.doe@example.com', age: 35, gender: 'Male', medicalHistory: 'Hypertension' },
      { id: 2, name: 'Jane Smith', phone: '9876543211', email: 'jane.smith@example.com', age: 28, gender: 'Female', medicalHistory: 'None' },
      { id: 3, name: 'Alice Johnson', phone: '9876543212', email: 'alice.j@example.com', age: 42, gender: 'Female', medicalHistory: 'Penicillin Allergy' }
    ]));
  }
  
  if (!localStorage.getItem(KEYS.INVENTORY)) {
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify([
      { id: 1, materialName: 'Composite Resin', quantity: 15, lowStockThreshold: 5, unit: 'tubes' },
      { id: 2, materialName: 'Dental Anesthetic', quantity: 8, lowStockThreshold: 10, unit: 'cartridges' }, // low stock
      { id: 3, materialName: 'Syringe Needle', quantity: 45, lowStockThreshold: 15, unit: 'pcs' },
      { id: 4, materialName: 'Gutta Percha Points', quantity: 30, lowStockThreshold: 10, unit: 'pcs' },
      { id: 5, materialName: 'Suture Thread', quantity: 4, lowStockThreshold: 5, unit: 'pcs' }, // low stock
      { id: 6, materialName: 'Prophy Paste', quantity: 12, lowStockThreshold: 4, unit: 'tubes' },
      { id: 7, materialName: 'Saliva Ejector', quantity: 50, lowStockThreshold: 15, unit: 'pcs' }
    ]));
  }

  if (!localStorage.getItem(KEYS.APPOINTMENTS)) {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify([
      {
        id: 1,
        patient: { id: 1, name: 'John Doe', phone: '9876543210', email: 'john.doe@example.com' },
        dentist: { id: 2, fullName: 'Dr. Sarah Jenkins' },
        appointmentTime: new Date(today.setHours(10, 0, 0)).toISOString(),
        status: 'CONFIRMED',
        chiefComplaint: 'Toothache in upper molar',
        whatsappReminderSent: true
      },
      {
        id: 2,
        patient: { id: 2, name: 'Jane Smith', phone: '9876543211', email: 'jane.smith@example.com' },
        dentist: { id: 2, fullName: 'Dr. Sarah Jenkins' },
        appointmentTime: new Date(today.setHours(14, 30, 0)).toISOString(),
        status: 'PENDING',
        chiefComplaint: 'Routine dental cleanup',
        whatsappReminderSent: false
      },
      {
        id: 3,
        patient: { id: 3, name: 'Alice Johnson', phone: '9876543212', email: 'alice.j@example.com' },
        dentist: { id: 2, fullName: 'Dr. Sarah Jenkins' },
        appointmentTime: new Date(tomorrow.setHours(11, 0, 0)).toISOString(),
        status: 'PENDING',
        chiefComplaint: 'Root canal follow-up',
        whatsappReminderSent: false
      }
    ]));
  }

  if (!localStorage.getItem(KEYS.LEDGER)) {
    localStorage.setItem(KEYS.LEDGER, JSON.stringify([
      { id: 1, type: 'OUTFLOW', amount: 250, description: 'Office supplies & cleaning kits purchase', date: new Date(Date.now() - 86400000).toISOString() },
      { id: 2, type: 'INFLOW', amount: 500, description: 'Consultation fees', date: new Date(Date.now() - 86400000).toISOString() }
    ]));
  }

  if (!localStorage.getItem(KEYS.INVOICES)) {
    localStorage.setItem(KEYS.INVOICES, JSON.stringify([
      {
        id: 1,
        patient: { id: 1, name: 'John Doe', phone: '9876543210' },
        totalAmount: 150,
        paidAmount: 150,
        status: 'PAID',
        billingDate: new Date().toISOString()
      }
    ]));
  }

  if (!localStorage.getItem(KEYS.TREATMENTS)) {
    localStorage.setItem(KEYS.TREATMENTS, JSON.stringify([]));
  }
};

seedMockData();

// Helper to determine if we use API or mock fallback
let useMock = false;

async function request(endpoint, options = {}) {
  if (useMock) {
    return mockRequest(endpoint, options);
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'API request failed');
    }
    return await res.json();
  } catch (error) {
    console.warn(`API connection to ${BASE_URL} failed, falling back to local simulation:`, error.message);
    useMock = true; // Switch to mock mode automatically
    return mockRequest(endpoint, options);
  }
}

// Local mock processor
function mockRequest(endpoint, options = {}) {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : null;

  if (endpoint.startsWith('/patients')) {
    let list = JSON.parse(localStorage.getItem(KEYS.PATIENTS));
    if (method === 'GET') {
      return Promise.resolve(list);
    }
    if (method === 'POST') {
      const newPatient = { ...body, id: Date.now(), registeredAt: new Date().toISOString() };
      list.push(newPatient);
      localStorage.setItem(KEYS.PATIENTS, JSON.stringify(list));
      return Promise.resolve(newPatient);
    }
  }

  if (endpoint.startsWith('/appointments')) {
    let list = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS));
    
    if (endpoint === '/appointments/today' && method === 'GET') {
      const todayStr = new Date().toDateString();
      const filtered = list.filter(app => new Date(app.appointmentTime).toDateString() === todayStr);
      return Promise.resolve(filtered);
    }
    
    if (endpoint === '/appointments' && method === 'GET') {
      return Promise.resolve(list);
    }

    if (endpoint === '/appointments' && method === 'POST') {
      const patients = JSON.parse(localStorage.getItem(KEYS.PATIENTS));
      const pat = patients.find(p => p.id === Number(body.patientId));
      
      const newApp = {
        id: Date.now(),
        patient: pat || { id: body.patientId, name: 'Patient ' + body.patientId },
        dentist: { id: body.dentistId, fullName: body.dentistId === 1 ? 'Dr. Sudha' : 'Dr. Sarah Jenkins' },
        appointmentTime: body.appointmentTime,
        status: 'PENDING',
        chiefComplaint: body.chiefComplaint || '',
        whatsappReminderSent: false
      };
      
      list.push(newApp);
      localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(list));
      return Promise.resolve(newApp);
    }

    if (endpoint.includes('/status') && method === 'PATCH') {
      const id = Number(endpoint.split('/')[2]);
      const app = list.find(a => a.id === id);
      if (app) {
        app.status = body.status;
        localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(list));
      }
      return Promise.resolve(app);
    }

    if (endpoint.includes('/send-reminder') && method === 'POST') {
      const id = Number(endpoint.split('/')[2]);
      const app = list.find(a => a.id === id);
      if (app) {
        app.whatsappReminderSent = true;
        localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(list));
        console.log(`[MOCK WHATSAPP] Notification dispatched to ${app.patient.phone} for ${app.patient.name}`);
      }
      return Promise.resolve({ message: 'WhatsApp reminder sent successfully (Mocked)' });
    }
  }

  if (endpoint.startsWith('/inventory')) {
    let list = JSON.parse(localStorage.getItem(KEYS.INVENTORY));
    if (endpoint === '/inventory' && method === 'GET') {
      return Promise.resolve(list);
    }
    if (endpoint === '/inventory/alerts' && method === 'GET') {
      return Promise.resolve(list.filter(item => item.quantity < item.lowStockThreshold));
    }
    if (endpoint.includes('/stock') && method === 'PATCH') {
      const id = Number(endpoint.split('/')[2]);
      const item = list.find(i => i.id === id);
      if (item) {
        item.quantity += body.quantity;
        localStorage.setItem(KEYS.INVENTORY, JSON.stringify(list));
      }
      return Promise.resolve(item);
    }
    if (method === 'PUT') {
      const id = Number(endpoint.split('/')[2]);
      const itemIndex = list.findIndex(i => i.id === id);
      if (itemIndex > -1) {
        list[itemIndex] = { ...body, id };
        localStorage.setItem(KEYS.INVENTORY, JSON.stringify(list));
        return Promise.resolve(list[itemIndex]);
      }
    }
  }

  if (endpoint.startsWith('/billing')) {
    if (endpoint.includes('/invoices') && method === 'GET') {
      const list = JSON.parse(localStorage.getItem(KEYS.INVOICES));
      return Promise.resolve(list);
    }
    if (endpoint.includes('/ledger') && method === 'GET') {
      const list = JSON.parse(localStorage.getItem(KEYS.LEDGER));
      return Promise.resolve(list);
    }
    if (endpoint.includes('/summary') && method === 'GET') {
      const list = JSON.parse(localStorage.getItem(KEYS.LEDGER));
      const totalInflow = list.filter(e => e.type === 'INFLOW').reduce((sum, e) => sum + e.amount, 0);
      const totalOutflow = list.filter(e => e.type === 'OUTFLOW').reduce((sum, e) => sum + e.amount, 0);
      return Promise.resolve({
        totalInflow,
        totalOutflow,
        netCashFlow: totalInflow - totalOutflow
      });
    }
    if (endpoint.includes('/ledger') && method === 'POST') {
      let list = JSON.parse(localStorage.getItem(KEYS.LEDGER));
      const entry = { ...body, id: Date.now(), date: new Date().toISOString() };
      list.push(entry);
      localStorage.setItem(KEYS.LEDGER, JSON.stringify(list));
      return Promise.resolve(entry);
    }
    if (endpoint.includes('/pay') && method === 'POST') {
      const id = Number(endpoint.split('/')[3]);
      let invoices = JSON.parse(localStorage.getItem(KEYS.INVOICES));
      let ledgers = JSON.parse(localStorage.getItem(KEYS.LEDGER));

      const inv = invoices.find(i => i.id === id);
      if (inv) {
        inv.paidAmount += body.amount;
        if (inv.paidAmount >= inv.totalAmount) {
          inv.status = 'PAID';
        } else {
          inv.status = 'PARTIALLY_PAID';
        }
        localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));

        // update ledger
        const ledgerEntry = {
          id: Date.now(),
          type: 'INFLOW',
          amount: body.amount,
          description: `Invoice payment received for Invoice ID: ${inv.id}`,
          date: new Date().toISOString()
        };
        ledgers.push(ledgerEntry);
        localStorage.setItem(KEYS.LEDGER, JSON.stringify(ledgers));
      }
      return Promise.resolve(inv);
    }
  }

  if (endpoint.startsWith('/treatments')) {
    let list = JSON.parse(localStorage.getItem(KEYS.TREATMENTS));
    
    if (method === 'GET') {
      return Promise.resolve(list);
    }

    if (method === 'POST') {
      const patients = JSON.parse(localStorage.getItem(KEYS.PATIENTS));
      const p = patients.find(pat => pat.id === Number(body.patientId));
      
      const newRecord = {
        id: Date.now(),
        patient: p || { id: body.patientId, name: 'Patient ' + body.patientId },
        dentist: { id: body.dentistId, fullName: body.dentistId === 1 ? 'Dr. Sudha' : 'Dr. Sarah Jenkins' },
        chiefComplaint: body.chiefComplaint,
        diagnosis: body.diagnosis,
        procedureCompleted: body.procedureCompleted,
        cost: body.cost,
        date: new Date().toISOString()
      };
      list.push(newRecord);
      localStorage.setItem(KEYS.TREATMENTS, JSON.stringify(list));

      // Auto deduct materials rules
      let materials = JSON.parse(localStorage.getItem(KEYS.INVENTORY));
      const deduct = (name, qty) => {
        const item = materials.find(m => m.materialName.toLowerCase() === name.toLowerCase());
        if (item) {
          item.quantity = Math.max(0, item.quantity - qty);
        }
      };
      
      const proc = body.procedureCompleted.trim().toLowerCase();
      if (proc === 'filling') {
        deduct('Composite Resin', 1);
        deduct('Syringe Needle', 1);
      } else if (proc === 'root canal') {
        deduct('Gutta Percha Points', 2);
        deduct('Dental Anesthetic', 1);
      } else if (proc === 'extraction') {
        deduct('Dental Anesthetic', 1);
        deduct('Suture Thread', 2);
      } else if (proc === 'teeth cleaning' || proc === 'cleaning') {
        deduct('Prophy Paste', 1);
        deduct('Saliva Ejector', 1);
      }
      localStorage.setItem(KEYS.INVENTORY, JSON.stringify(materials));

      // Generate invoice
      let invoices = JSON.parse(localStorage.getItem(KEYS.INVOICES));
      const paid = body.paidAmount || 0;
      let status = 'UNPAID';
      if (paid >= body.cost) status = 'PAID';
      else if (paid > 0) status = 'PARTIALLY_PAID';

      const newInv = {
        id: Date.now(),
        patient: p || { id: body.patientId, name: 'Patient ' + body.patientId },
        totalAmount: body.cost,
        paidAmount: paid,
        status,
        billingDate: new Date().toISOString()
      };
      invoices.push(newInv);
      localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));

      // Add to ledger
      if (paid > 0) {
        let ledgers = JSON.parse(localStorage.getItem(KEYS.LEDGER));
        ledgers.push({
          id: Date.now() + 1,
          type: 'INFLOW',
          amount: paid,
          description: `Payment received for treatment record (${body.procedureCompleted})`,
          date: new Date().toISOString()
        });
        localStorage.setItem(KEYS.LEDGER, JSON.stringify(ledgers));
      }

      return Promise.resolve(newRecord);
    }
  }

  return Promise.reject(new Error('Mock endpoint handler not found'));
}

// Core API Wrapper methods
export const api = {
  patients: {
    list: (search = '') => request(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    create: (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) }),
  },
  appointments: {
    list: () => request('/appointments'),
    today: () => request('/appointments/today'),
    create: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, status) => request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    sendReminder: (id) => request(`/appointments/${id}/send-reminder`, { method: 'POST' }),
  },
  inventory: {
    list: () => request('/inventory'),
    alerts: () => request('/inventory/alerts'),
    addStock: (id, quantity) => request(`/inventory/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
    updateThreshold: (id, data) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  billing: {
    invoices: () => request('/billing/invoices'),
    ledger: () => request('/billing/ledger'),
    summary: () => request('/billing/summary'),
    addLedger: (data) => request('/billing/ledger', { method: 'POST', body: JSON.stringify(data) }),
    payInvoice: (id, amount) => request(`/billing/invoices/${id}/pay`, { method: 'POST', body: JSON.stringify({ amount }) }),
  },
  treatments: {
    list: () => request('/treatments'),
    create: (data) => request('/treatments', { method: 'POST', body: JSON.stringify(data) }),
    byPatient: (patientId) => request(`/treatments/patient/${patientId}`),
  }
};
