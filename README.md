# Sudha Dental Clinic Management System

A fully-functional Single-Tenant Dental Clinic Management SaaS application with advanced white-label capability and Role-Based Access Control (RBAC).

---

## 🚀 Features

1. **Patient & Appointment Dashboard**: Manage daily schedules and quickly onboard new patients. Features Meta Cloud API mock integration for automated WhatsApp reminders.
2. **Dentist EMR & Prescription Builder**: Log visit details, diagnose dental issues, log medical complaints, and prescribe medicines using functional components.
3. **Inventory Auto-Deduction & Alerts**: Save treatment records to automatically deduct materials (e.g. fillings deduct resins and syringes) and highlight low stock levels in red alerts.
4. **Ledgers & Billings Cash Flow**: Record general clinic expenses, generate patient invoices, and view dynamic bar charts comparison (Inflow vs. Outflow).

---

## 🛠️ White-Label & RBAC Configuration

- **Rebranding Configuration**: 
  - Backend clinic values are located in `backend/src/main/resources/tenant-config.yml` (clinic name, colors, email, phone).
  - Frontend clinic branding properties are loaded from `frontend/src/config.js` and custom style parameters map to CSS custom variables in `frontend/src/index.css`.
- **Role-Based Access Control (RBAC)**: Supports three roles:
  1. `ADMIN`: Full access to clinic ledger statements, inventory alerts, and configure thresholds.
  2. `DENTIST`: Read/write patient EMR records and create prescriptions.
  3. `RECEPTIONIST`: Patient onboarding, appointments booking, and billing collection.

*Note: For validation convenience, a Role Switcher dropdown is provided at the top-right of the dashboard navbar to easily test RBAC levels.*

---

## ⚙️ Running Locally

### Prerequisites
- Java JDK 17 (or higher)
- Maven 3.x
- Node.js 18.x (or higher)
- PostgreSQL Server 16+

### 1. Database Setup
Create a PostgreSQL database named `sudhadentaldb`. The Spring Boot app is configured by default to connect to:
- **Host**: `localhost:5432`
- **Username**: `postgres`
- **Password**: `admin`

*Note: The application includes a `DatabaseSeeder` that will automatically insert initial users, stock levels, patient lists, and transaction ledgers upon first boot.*

### 2. Run Backend API
```bash
cd backend
mvn spring-boot:run
```
The server will start listening on [http://localhost:8081](http://localhost:8081).

### 3. Run Frontend App
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5174](http://localhost:5174) in your browser.

*Note: The React frontend includes a simulated Mock Mode that falls back to LocalStorage if the backend server is offline, making it immediately testable by itself!*
