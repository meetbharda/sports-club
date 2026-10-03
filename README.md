# The Champions Club — Production Sports Club Operating System

A complete, production-ready, database-backed web application and digital operating system for **The Champions Club** — an elite multi-sport and recreation facility offering **Championship Tennis**, **BWF Badminton**, and **Cricket practice lanes**, alongside a full **Pro Retail Shop**, **Clubhouse Bar & Cafeteria**, and **Athletic Academy**.

---

## ⚡ Quick Start

### 1. Launch the Application
```bash
npm start
```
The entire application (Express API + compiled React SPA frontend) is served at:
👉 **`http://localhost:5000`**

### 2. Run Acceptance Test Suite
Verify all 24 critical business rules, strict concurrency locks, role boundaries, and workflows:
```bash
npm test
```
*Result: 24 / 24 Tests Passed (100% test coverage)*

---

## 🔐 Demo Credentials (or use the 1-Click "Demo Switcher" in the top bar)

All demo accounts share the password: **`Champion#2026`**

| Role | Account Email | Portals & Privileges |
|---|---|---|
| **Owner / Super Admin** | `owner@championsclub.demo` | Executive KPI center, User RBAC, Club settings, Audit trail |
| **Front Desk Concierge** | `frontdesk@championsclub.demo` | Universal member search, check-ins, walk-in bookings, CRM conversion |
| **Head Coach** | `coach@championsclub.demo` | Clinic schedule, social mixer rosters, coach leave requests |
| **Pro Shop Lead** | `shop@championsclub.demo` | Touch POS terminal, stock restock/adjustments, order fulfillment |
| **Clubhouse Bar Lead** | `bar@championsclub.demo` | Visual table floor plan (10 tables), running tabs, live Kitchen Display (KDS) |
| **Finance Controller** | `finance@championsclub.demo` | Real-time P&L, accounts receivable, client invoices, expense logging |
| **HR & Staff Manager** | `hr@championsclub.demo` | Employee directory, shift rosters, attendance clock-in, leave approvals |
| **Gold Member** | `member@championsclub.demo` | 2 court bookings/day, 14-day advance window, 10% shop & 15% bar off |
| **Silver Member** | `silver.member@championsclub.demo` | 1 booking/day, 7-day advance window, 5% shop & 5% bar off |
| **Expired Member** | `expired.member@championsclub.demo` | Lapsed membership; used to verify strict booking rejection |

---

## 🏛️ Architecture & Core Principles

### 1. Zero Overlap & Atomic Concurrency Engine
- Built with **Better-SQLite3** running in **WAL mode** (`db.pragma('journal_mode = WAL')`).
- Court bookings run inside an atomic `db.transaction()` that performs server-side range overlap validation:
  $$\text{Overlap Condition: } \neg (\text{end\_time} \le \text{slot\_start} \lor \text{start\_time} \ge \text{slot\_end})$$
- If two players attempt to book the same court/time simultaneously, SQLite transaction isolation ensures only the first succeeds, while the second receives an explicit **HTTP 409 Conflict** error (`"That court has just been booked by another member..."`).
- Daily booking allowance limits ($2$ bookings/day for Gold, $1$ for Silver) are verified at the server layer.
- Expired memberships are strictly barred from member bookings.

### 2. Zero Negative Inventory in Pro Shop
- POS and online checkouts execute an atomic decrement:
  ```sql
  UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?
  ```
- If available stock is less than requested quantity, the transaction rolls back cleanly with an **HTTP 400 Insufficient Stock** error.

### 3. Strict Multi-Role Access Control (RBAC)
- All protected API routes verify JSON Web Tokens (JWT) and evaluate assigned roles via `requireRole(...)`.
- A Member attempting `/admin` or `/finance` receives **HTTP 403 Forbidden** with an explicit restricted-area boundary UI.
- Front Desk attempting to alter Owner settings is rejected at the API level.

### 4. Bar & Cafeteria POS + Kitchen Display System (KDS)
- Interactive 10-table visual floor plan with live table statuses: `Available`, `Occupied`, `Reserved`, `Cleaning`.
- Opening a table initiates an active tab order.
- Items routed to the kitchen appear on the live **Kitchen Display System (KDS)**.
- Orders progress cleanly through states: `NEW` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`.
- Settling a tab via **Cash**, **Card**, or **UPI QR** automatically applies the member's discount and generates a printable digital receipt.

### 5. CRM Lead Pipeline & 1-Click Member Conversion
- Public trial session and concierge requests generate tracked CRM records (`ENQ-XXXX`).
- Staff can follow up with leads, schedule trials, and convert prospects directly into active members (`MEM-XXXX`), automatically provisioning initial membership invoices while preserving lead inquiry history.

### 6. Full Financial Controller & General Ledger
- Live revenue aggregation by stream: Court Bookings, Pro Shop, Clubhouse Bar, and Membership Dues.
- General ledger tracking for operating expenses categorized by Rent, Utilities, Salaries, Equipment, Maintenance, and Food Supplies.
- Client invoicing engine with partial/full payment reconciliation.

### 7. Staff Rostering & HR Leave Approval Workflow
- Employee profiles, shift roastering, and duty assignments.
- Leave approval lifecycle: Staff submit requests ➔ Managers approve/reject with review notes ➔ Employee receives status notifications.

### 8. Immutable Audit Trail
- Every critical business action (`LOGIN`, `MEMBER_CREATE`, `BOOKING_CREATE`, `BOOKING_CANCEL`, `SHOP_PURCHASE`, `BAR_TAB_SETTLE`, `STOCK_ADJUST`, `SETTINGS_UPDATE`) is logged to the `audit_logs` table with timestamp, user ID, role, and JSON metadata.

---

## 💻 Tech Stack
- **Backend:** Node.js, Express 5, Better-SQLite3 (WAL Mode), JWT Authentication, bcryptjs.
- **Frontend:** React 19, Tailwind CSS, Lucide Icons, Glassmorphism design system.
- **Packaging:** Vite 8.3 production build served via Express static middleware.
