const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'club.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'member', -- primary role
      avatar_url TEXT,
      status TEXT NOT NULL DEFAULT 'active', -- active, inactive, suspended
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- User Roles (supports multi-role assignments)
    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, role)
    );

    -- Membership Plans
    CREATE TABLE IF NOT EXISTS membership_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      monthly_price REAL NOT NULL,
      annual_price REAL NOT NULL,
      court_discount_pct REAL NOT NULL DEFAULT 0,
      shop_discount_pct REAL NOT NULL DEFAULT 0,
      bar_discount_pct REAL NOT NULL DEFAULT 0,
      daily_booking_limit INTEGER NOT NULL DEFAULT 2,
      peak_access INTEGER NOT NULL DEFAULT 1, -- 1=yes, 0=no
      priority_days_advance INTEGER NOT NULL DEFAULT 7,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Members profile
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      member_code TEXT UNIQUE NOT NULL,
      plan_id INTEGER,
      status TEXT NOT NULL DEFAULT 'Active', -- Active, Expiring Soon, Expired, Suspended, Cancelled
      start_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      dob DATE,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      address TEXT,
      discount_shop_override REAL,
      discount_bar_override REAL,
      booking_allowance_daily INTEGER DEFAULT 2,
      loyalty_points INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES membership_plans(id)
    );

    -- Sports
    CREATE TABLE IF NOT EXISTS sports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT,
      icon TEXT
    );

    -- Facilities
    CREATE TABLE IF NOT EXISTS facilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sport_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      location TEXT,
      opening_time TEXT DEFAULT '06:00',
      closing_time TEXT DEFAULT '23:00',
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (sport_id) REFERENCES sports(id)
    );

    -- Courts
    CREATE TABLE IF NOT EXISTS courts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      facility_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      court_type TEXT NOT NULL, -- e.g. Clay, Hard, Synthetic Turf, BWF Mat
      hourly_rate_member REAL NOT NULL DEFAULT 20.0,
      hourly_rate_walkin REAL NOT NULL DEFAULT 35.0,
      status TEXT NOT NULL DEFAULT 'Available', -- Available, Maintenance, Blocked
      image_url TEXT,
      FOREIGN KEY (facility_id) REFERENCES facilities(id)
    );

    -- Court Bookings
    CREATE TABLE IF NOT EXISTS court_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_code TEXT UNIQUE NOT NULL,
      court_id INTEGER NOT NULL,
      user_id INTEGER,
      member_id INTEGER,
      guest_name TEXT,
      guest_phone TEXT,
      booking_type TEXT NOT NULL DEFAULT 'member', -- member, walk-in, coaching, social, maintenance
      date DATE NOT NULL,
      start_time TEXT NOT NULL, -- e.g. '09:00'
      end_time TEXT NOT NULL,   -- e.g. '10:00'
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      price REAL NOT NULL DEFAULT 0.0,
      payment_method TEXT DEFAULT 'cash', -- cash, card, upi, online, member_balance, waived
      payment_status TEXT NOT NULL DEFAULT 'Paid', -- Pending, Paid, Refunded, Waived
      status TEXT NOT NULL DEFAULT 'Confirmed', -- Pending, Confirmed, Checked In, Completed, Cancelled, No Show
      notes TEXT,
      created_by_user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (court_id) REFERENCES courts(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (member_id) REFERENCES members(id)
    );

    -- Social Sessions
    CREATE TABLE IF NOT EXISTS social_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      court_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      sport TEXT NOT NULL,
      date DATE NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 12,
      price_per_person REAL NOT NULL DEFAULT 15.0,
      organizer_name TEXT NOT NULL DEFAULT 'Club Coach',
      status TEXT NOT NULL DEFAULT 'Open', -- Open, Full, In Progress, Completed, Cancelled
      notes TEXT,
      FOREIGN KEY (court_id) REFERENCES courts(id)
    );

    -- Social Participants
    CREATE TABLE IF NOT EXISTS social_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      user_id INTEGER,
      member_id INTEGER,
      name TEXT NOT NULL,
      phone TEXT,
      payment_status TEXT NOT NULL DEFAULT 'Paid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES social_sessions(id) ON DELETE CASCADE,
      UNIQUE(session_id, phone),
      UNIQUE(session_id, user_id)
    );

    -- Product Categories
    CREATE TABLE IF NOT EXISTS product_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );

    -- Products (Shop)
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      brand TEXT,
      description TEXT,
      image_url TEXT,
      selling_price REAL NOT NULL,
      cost_price REAL NOT NULL,
      tax_pct REAL NOT NULL DEFAULT 5.0,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 5,
      supplier_name TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES product_categories(id)
    );

    -- Inventory Transactions
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      change_qty INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      transaction_type TEXT NOT NULL, -- sale, restock, adjustment, refund
      reference_id TEXT,
      notes TEXT,
      created_by_user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Shop Orders
    CREATE TABLE IF NOT EXISTS shop_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_type TEXT NOT NULL DEFAULT 'member', -- member, guest
      user_id INTEGER,
      member_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      order_type TEXT NOT NULL DEFAULT 'pickup', -- pickup, delivery
      delivery_address TEXT,
      subtotal REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0.0,
      tax_amount REAL NOT NULL DEFAULT 0.0,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'card', -- cash, card, upi, online
      payment_status TEXT NOT NULL DEFAULT 'Paid',
      order_status TEXT NOT NULL DEFAULT 'Confirmed', -- Pending, Confirmed, Preparing, Ready for Pickup, Out for Delivery, Delivered, Cancelled, Refunded
      staff_user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (member_id) REFERENCES members(id)
    );

    -- Shop Order Items
    CREATE TABLE IF NOT EXISTS shop_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES shop_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Bar / Cafeteria Tables
    CREATE TABLE IF NOT EXISTS bar_tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 4,
      status TEXT NOT NULL DEFAULT 'Available', -- Available, Occupied, Reserved, Cleaning
      current_tab_id INTEGER
    );

    -- Bar Orders / Tabs
    CREATE TABLE IF NOT EXISTS bar_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      table_id INTEGER NOT NULL,
      user_id INTEGER,
      member_id INTEGER,
      customer_name TEXT NOT NULL DEFAULT 'Guest Table',
      is_tab INTEGER NOT NULL DEFAULT 1,
      subtotal REAL NOT NULL DEFAULT 0.0,
      discount_amount REAL NOT NULL DEFAULT 0.0,
      tax_amount REAL NOT NULL DEFAULT 0.0,
      total_amount REAL NOT NULL DEFAULT 0.0,
      payment_method TEXT, -- cash, card, upi
      payment_status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Settled, Cancelled
      kitchen_status TEXT NOT NULL DEFAULT 'NEW', -- NEW, PREPARING, READY, COMPLETED
      status TEXT NOT NULL DEFAULT 'Open', -- Open, Settled, Cancelled
      notes TEXT,
      staff_user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      FOREIGN KEY (table_id) REFERENCES bar_tables(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (member_id) REFERENCES members(id)
    );

    -- Bar Order Items
    CREATE TABLE IF NOT EXISTS bar_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bar_order_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      kitchen_status TEXT NOT NULL DEFAULT 'NEW',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bar_order_id) REFERENCES bar_orders(id) ON DELETE CASCADE
    );

    -- Bar Menu Items
    CREATE TABLE IF NOT EXISTS bar_menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL, -- Coffee, Cold Drinks, Smoothies, Sandwiches, Mains, Snacks
      price REAL NOT NULL,
      description TEXT,
      image_url TEXT,
      is_available INTEGER NOT NULL DEFAULT 1
    );

    -- Invoices
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT,
      member_id INTEGER,
      invoice_type TEXT NOT NULL DEFAULT 'membership', -- membership, corporate, coaching, event, other
      issue_date DATE NOT NULL,
      due_date DATE NOT NULL,
      subtotal REAL NOT NULL,
      tax_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      paid_amount REAL NOT NULL DEFAULT 0.0,
      status TEXT NOT NULL DEFAULT 'Paid', -- Draft, Sent, Partially Paid, Paid, Overdue, Cancelled
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    -- Expenses
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_number TEXT UNIQUE NOT NULL,
      vendor_name TEXT NOT NULL,
      category TEXT NOT NULL, -- Rent, Utilities, Salaries, Equipment, Maintenance, Inventory, Marketing, Food supplies, Other
      amount REAL NOT NULL,
      tax_amount REAL NOT NULL DEFAULT 0.0,
      payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
      date DATE NOT NULL,
      notes TEXT,
      created_by_user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Employees (HR)
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      emp_code TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      department TEXT NOT NULL, -- Front Desk, Coaching, Shop, Bar/Cafeteria, Finance, HR, Operations, Maintenance
      role TEXT NOT NULL,
      joining_date DATE NOT NULL,
      salary REAL NOT NULL,
      employment_status TEXT NOT NULL DEFAULT 'Active', -- Active, On Leave, Terminated
      emergency_contact TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Shifts
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date DATE NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      clock_in TEXT,
      clock_out TEXT,
      status TEXT NOT NULL DEFAULT 'Scheduled', -- Scheduled, Active, Completed, Absent
      notes TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    -- Leave Requests
    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      leave_type TEXT NOT NULL, -- Sick, Casual, Paid, Unpaid
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Approved, Rejected
      reviewed_by_user_id INTEGER,
      review_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    -- CRM / Enquiries
    CREATE TABLE IF NOT EXISTS customer_enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enquiry_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'Website Trial', -- Website Trial, Website Contact, Walk-in, Phone, Referral
      interested_sport TEXT,
      membership_interest TEXT,
      preferred_date DATE,
      preferred_time TEXT,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'New', -- New, Contacted, Trial Scheduled, Quote Sent, Converted, Lost
      assigned_staff_id INTEGER,
      follow_up_date DATE,
      converted_member_id INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_staff_id) REFERENCES users(id),
      FOREIGN KEY (converted_member_id) REFERENCES members(id)
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER, -- NULL means broadcast to role
      role_target TEXT, -- 'admin', 'frontdesk', 'coach', 'shop', 'bar', 'finance', 'hr', 'member', 'all'
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info', -- info, warning, success, booking, order, expiry, alert
      is_read INTEGER NOT NULL DEFAULT 0,
      link_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_email TEXT,
      role TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Club Settings
    CREATE TABLE IF NOT EXISTS club_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = {
  db,
  initSchema
};
