import { CLINIC_CONFIG } from './config';

const BASE_URL = 'http://localhost:8081/api';

// Check if we are running in development mode
const IS_DEV = import.meta.env.MODE === 'development';

// LocalStorage mock state keys (Development Only)
const KEYS = {
  PATIENTS: 'sudha_patients',
  APPOINTMENTS: 'sudha_appointments',
  INVENTORY: 'sudha_inventory',
  INVOICES: 'sudha_invoices',
  LEDGER: 'sudha_ledger',
  TREATMENTS: 'sudha_treatments',
  MAPPINGS: 'sudha_mappings',
};

// Seed mock data if localStorage is empty (Development Only)
const seedMockData = () => {
  if (!IS_DEV) return; // Completely skipped in production

  if (!localStorage.getItem(KEYS.PATIENTS)) {
    localStorage.setItem(KEYS.PATIENTS, JSON.stringify([
      { id: 1, name: 'John Doe', phone: '9876543210', email: 'john.doe@example.com', age: 35, gender: 'Male', medicalHistory: 'Hypertension' },
      { id: 2, name: 'Jane Smith', phone: '9876543211', email: 'jane.smith@example.com', age: 28, gender: 'Female', medicalHistory: 'None' },
      { id: 3, name: 'Alice Johnson', phone: '9876543212', email: 'alice.j@example.com', age: 42, gender: 'Female', medicalHistory: 'Penicillin Allergy' }
    ]));
  }
  
  if (!localStorage.getItem(KEYS.INVENTORY) || !JSON.parse(localStorage.getItem(KEYS.INVENTORY)).some(item => item.type === 'MEDICINE')) {
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify([
      { id: 1, materialName: 'Composite Resin', quantity: 15, lowStockThreshold: 5, unit: 'tubes', type: 'MATERIAL' },
      { id: 2, materialName: 'Dental Anesthetic', quantity: 8, lowStockThreshold: 10, unit: 'cartridges', type: 'MATERIAL' },
      { id: 3, materialName: 'Syringe Needle', quantity: 45, lowStockThreshold: 15, unit: 'pcs', type: 'MATERIAL' },
      { id: 4, materialName: 'Gutta Percha Points', quantity: 30, lowStockThreshold: 10, unit: 'pcs', type: 'MATERIAL' },
      { id: 5, materialName: 'Suture Thread', quantity: 4, lowStockThreshold: 5, unit: 'pcs', type: 'MATERIAL' },
      { id: 6, materialName: 'Prophy Paste', quantity: 12, lowStockThreshold: 4, unit: 'tubes', type: 'MATERIAL' },
      { id: 7, materialName: 'Saliva Ejector', quantity: 50, lowStockThreshold: 15, unit: 'pcs', type: 'MATERIAL' },
      { id: 8, materialName: 'Amoxicillin 500mg', quantity: 100, lowStockThreshold: 20, unit: 'tablets', type: 'MEDICINE' },
      { id: 9, materialName: 'Ibuprofen 400mg', quantity: 150, lowStockThreshold: 30, unit: 'tablets', type: 'MEDICINE' },
      { id: 10, materialName: 'Paracetamol 500mg', quantity: 200, lowStockThreshold: 45, unit: 'tablets', type: 'MEDICINE' },
      { id: 11, materialName: 'Chlorhexidine Mouthwash', quantity: 25, lowStockThreshold: 8, unit: 'bottles', type: 'MEDICINE' }
    ]));
  }

  if (!localStorage.getItem(KEYS.MAPPINGS)) {
    localStorage.setItem(KEYS.MAPPINGS, JSON.stringify([
      { id: 1, procedureName: 'Filling', inventoryItem: { id: 1, materialName: 'Composite Resin', unit: 'tubes' }, quantityRequired: 1 },
      { id: 2, procedureName: 'Filling', inventoryItem: { id: 3, materialName: 'Syringe Needle', unit: 'pcs' }, quantityRequired: 1 },
      { id: 3, procedureName: 'Root Canal', inventoryItem: { id: 4, materialName: 'Gutta Percha Points', unit: 'pcs' }, quantityRequired: 2 },
      { id: 4, procedureName: 'Root Canal', inventoryItem: { id: 2, materialName: 'Dental Anesthetic', unit: 'cartridges' }, quantityRequired: 1 },
      { id: 5, procedureName: 'Extraction', inventoryItem: { id: 2, materialName: 'Dental Anesthetic', unit: 'cartridges' }, quantityRequired: 1 },
      { id: 6, procedureName: 'Extraction', inventoryItem: { id: 5, materialName: 'Suture Thread', unit: 'pcs' }, quantityRequired: 2 },
      { id: 7, procedureName: 'Teeth Cleaning', inventoryItem: { id: 6, materialName: 'Prophy Paste', unit: 'tubes' }, quantityRequired: 1 },
      { id: 8, procedureName: 'Teeth Cleaning', inventoryItem: { id: 7, materialName: 'Saliva Ejector', unit: 'pcs' }, quantityRequired: 1 }
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
      { id: 1, debit: 0.0, credit: 250.0, description: 'Office supplies & cleaning kits purchase', createdBy: 'System', createdDate: new Date(Date.now() - 86400000).toISOString() },
      { id: 2, debit: 500.0, credit: 0.0, description: 'Opening balance / Consultation fees', createdBy: 'System', createdDate: new Date(Date.now() - 86400000).toISOString() }
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

// Helper to determine if we use API or local mock fallback
let useMock = false;

async function request(endpoint, options = {}) {
  // Read current context from Session for HTTP header auditing
  const defaultUser = '{"username":"admin", "role":"ADMIN"}';
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || defaultUser);

  const headers = {
    'Content-Type': 'application/json',
    'X-User-Name': currentUser.username,
    'X-Role': currentUser.role,
    ...options.headers,
  };

  // Skip actual HTTP request if mocks are enabled (Development Only)
  if (IS_DEV && useMock) {
    return mockRequest(endpoint, { ...options, headers });
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'API request failed');
    }
    return await res.json();
  } catch (error) {
    if (IS_DEV) {
      console.warn(`API connection to ${BASE_URL} failed, falling back to LocalStorage simulation:`, error.message);
      useMock = true; // Switch to mock mode dynamically
      return mockRequest(endpoint, { ...options, headers });
    }
    // In production, mock fallback is stripped. Propagate error.
    throw error;
  }
}

// Local mock processor (Development Only)
function mockRequest(endpoint, options = {}) {
  if (!IS_DEV) return Promise.reject(new Error('Mocks disabled in production'));

  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : null;
  const username = options.headers['X-User-Name'] || 'System';

  if (endpoint.startsWith('/patients')) {
    let list = JSON.parse(localStorage.getItem(KEYS.PATIENTS));
    if (method === 'GET') {
      return Promise.resolve(list);
    }
    if (method === 'POST') {
      const newPatient = { 
        ...body, 
        id: Date.now(), 
        createdBy: username, 
        createdDate: new Date().toISOString() 
      };
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
        whatsappReminderSent: false,
        createdBy: username,
        createdDate: new Date().toISOString()
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
        app.lastModifiedBy = username;
        app.lastModifiedDate = new Date().toISOString();
        localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(list));
      }
      return Promise.resolve(app);
    }

    if (endpoint.includes('/send-reminder') && method === 'POST') {
      const id = Number(endpoint.split('/')[2]);
      const app = list.find(a => a.id === id);
      if (app) {
        app.whatsappReminderSent = true;
        app.lastModifiedBy = username;
        app.lastModifiedDate = new Date().toISOString();
        localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(list));
      }
      return Promise.resolve({ message: 'WhatsApp reminder sent successfully (Mocked)' });
    }
  }

  if (endpoint.startsWith('/inventory')) {
    let list = JSON.parse(localStorage.getItem(KEYS.INVENTORY));
    if (endpoint === '/inventory' && method === 'GET') {
      return Promise.resolve(list);
    }
    if (endpoint === '/inventory' && method === 'POST') {
      const newItem = {
        ...body,
        id: Date.now(),
        createdBy: username,
        createdDate: new Date().toISOString()
      };
      list.push(newItem);
      localStorage.setItem(KEYS.INVENTORY, JSON.stringify(list));
      return Promise.resolve(newItem);
    }
    if (endpoint === '/inventory/alerts' && method === 'GET') {
      return Promise.resolve(list.filter(item => item.quantity < item.lowStockThreshold));
    }
    if (endpoint.includes('/stock') && method === 'PATCH') {
      const id = Number(endpoint.split('/')[2]);
      const item = list.find(i => i.id === id);
      if (item) {
        item.quantity += body.quantity;
        item.lastModifiedBy = username;
        item.lastModifiedDate = new Date().toISOString();
        localStorage.setItem(KEYS.INVENTORY, JSON.stringify(list));
      }
      return Promise.resolve(item);
    }
    if (method === 'PUT') {
      const id = Number(endpoint.split('/')[2]);
      const itemIndex = list.findIndex(i => i.id === id);
      if (itemIndex > -1) {
        list[itemIndex] = { 
          ...body, 
          id, 
          lastModifiedBy: username, 
          lastModifiedDate: new Date().toISOString() 
        };
        localStorage.setItem(KEYS.INVENTORY, JSON.stringify(list));
        return Promise.resolve(list[itemIndex]);
      }
    }
  }

  if (endpoint.startsWith('/mappings')) {
    let list = JSON.parse(localStorage.getItem(KEYS.MAPPINGS) || '[]');
    if (method === 'GET') {
      return Promise.resolve(list);
    }
    if (method === 'POST') {
      const materials = JSON.parse(localStorage.getItem(KEYS.INVENTORY));
      const mat = materials.find(m => m.id === Number(body.inventoryId));
      
      const newMapping = {
        id: Date.now(),
        procedureName: body.procedureName,
        inventoryItem: mat || { id: body.inventoryId, materialName: 'Consumable ' + body.inventoryId, unit: 'pcs' },
        quantityRequired: body.quantityRequired,
        createdBy: username,
        createdDate: new Date().toISOString()
      };
      
      list.push(newMapping);
      localStorage.setItem(KEYS.MAPPINGS, JSON.stringify(list));
      return Promise.resolve(newMapping);
    }
    if (method === 'DELETE') {
      const id = Number(endpoint.split('/')[2]);
      list = list.filter(m => m.id !== id);
      localStorage.setItem(KEYS.MAPPINGS, JSON.stringify(list));
      return Promise.resolve({ success: true });
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
      const totalInflow = list.reduce((sum, e) => sum + e.debit, 0);
      const totalOutflow = list.reduce((sum, e) => sum + e.credit, 0);
      return Promise.resolve({
        totalInflow,
        totalOutflow,
        netCashFlow: totalInflow - totalOutflow
      });
    }
    if (endpoint.includes('/ledger') && method === 'POST') {
      let list = JSON.parse(localStorage.getItem(KEYS.LEDGER));
      const entry = { 
        id: Date.now(), 
        debit: body.type === 'INFLOW' ? body.amount : 0.0,
        credit: body.type === 'OUTFLOW' ? body.amount : 0.0,
        description: body.description,
        createdBy: username, 
        createdDate: new Date().toISOString() 
      };
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
        inv.lastModifiedBy = username;
        inv.lastModifiedDate = new Date().toISOString();
        localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));

        // update double entry ledger
        const ledgerEntry = {
          id: Date.now(),
          debit: body.amount,
          credit: 0.0,
          description: `Invoice payment received for Invoice ID: ${inv.id}`,
          createdBy: username,
          createdDate: new Date().toISOString()
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
        createdBy: username,
        createdDate: new Date().toISOString()
      };
      list.push(newRecord);
      localStorage.setItem(KEYS.TREATMENTS, JSON.stringify(list));

      // Auto deduct materials dynamically based on seeded mock mappings
      let mappings = JSON.parse(localStorage.getItem(KEYS.MAPPINGS) || '[]');
      let materials = JSON.parse(localStorage.getItem(KEYS.INVENTORY));
      
      const relevantMappings = mappings.filter(m => m.procedureName.toLowerCase() === body.procedureCompleted.trim().toLowerCase());
      relevantMappings.forEach(mapping => {
        const item = materials.find(m => m.id === mapping.inventoryItem.id);
        if (item) {
          item.quantity = Math.max(0, item.quantity - mapping.quantityRequired);
          item.lastModifiedBy = username;
          item.lastModifiedDate = new Date().toISOString();
        }
      });
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
        createdBy: username,
        createdDate: new Date().toISOString()
      };
      invoices.push(newInv);
      localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));

      // Add to double entry ledger
      if (paid > 0) {
        let ledgers = JSON.parse(localStorage.getItem(KEYS.LEDGER));
        ledgers.push({
          id: Date.now() + 1,
          debit: paid,
          credit: 0.0,
          description: `Payment received for treatment record (${body.procedureCompleted})`,
          createdBy: username,
          createdDate: new Date().toISOString()
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
  theme: {
    config: () => request('/theme/config'),
  },
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
    create: (data) => request('/inventory', { method: 'POST', body: JSON.stringify(data) }),
    addStock: (id, quantity) => request(`/inventory/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
    updateThreshold: (id, data) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  mappings: {
    list: () => request('/mappings'),
    create: (data) => request('/mappings', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/mappings/${id}`, { method: 'DELETE' }),
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
