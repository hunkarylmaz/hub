-- Rezervasyo veritabani semasi
-- Not: Gelistirme ortaminda node:sqlite (built-in, native binary indirme gerektirmez) kullanilir.
-- Sema Postgres'e tasinabilir sekilde tasarlandi (her tenant tablosunda business_id, RLS'e hazir).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN','OWNER','STAFF')),
  avatar_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sector TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  city TEXT,
  district TEXT,
  address TEXT,
  instagram TEXT,
  website TEXT,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  theme_color TEXT DEFAULT '#5817B0',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  onboarding_step TEXT NOT NULL DEFAULT 'business_info',
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_user_id);

CREATE TABLE IF NOT EXISTS business_users (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('OWNER','STAFF')),
  permissions TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  UNIQUE(business_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_business_users_business ON business_users(business_id);
CREATE INDEX IF NOT EXISTS idx_business_users_user ON business_users(user_id);

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  district TEXT,
  phone TEXT,
  is_main INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_branches_business ON branches(business_id);

CREATE TABLE IF NOT EXISTS service_categories (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#7C3AED',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_service_categories_business ON service_categories(business_id);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  category_id TEXT REFERENCES service_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_minutes INTEGER NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'TRY',
  color TEXT NOT NULL DEFAULT '#3B82F6',
  is_online_bookable INTEGER NOT NULL DEFAULT 1,
  requires_deposit INTEGER NOT NULL DEFAULT 0,
  deposit_amount REAL NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_services_business ON services(business_id);

CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  branch_id TEXT REFERENCES branches(id),
  user_id TEXT REFERENCES users(id),
  full_name TEXT NOT NULL,
  photo_url TEXT,
  phone TEXT,
  email TEXT,
  title TEXT,
  is_bookable_online INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_staff_business ON staff(business_id);

CREATE TABLE IF NOT EXISTS staff_services (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL REFERENCES staff(id),
  service_id TEXT NOT NULL REFERENCES services(id),
  UNIQUE(staff_id, service_id)
);
CREATE INDEX IF NOT EXISTS idx_staff_services_staff ON staff_services(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_services_service ON staff_services(service_id);

CREATE TABLE IF NOT EXISTS working_hours (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  branch_id TEXT REFERENCES branches(id),
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  is_closed INTEGER NOT NULL DEFAULT 0,
  open_time TEXT,
  close_time TEXT,
  break_start TEXT,
  break_end TEXT
);
CREATE INDEX IF NOT EXISTS idx_working_hours_business ON working_hours(business_id);

CREATE TABLE IF NOT EXISTS staff_working_hours (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL REFERENCES staff(id),
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  is_off INTEGER NOT NULL DEFAULT 0,
  start_time TEXT,
  end_time TEXT,
  break_start TEXT,
  break_end TEXT
);
CREATE INDEX IF NOT EXISTS idx_staff_working_hours_staff ON staff_working_hours(staff_id);

CREATE TABLE IF NOT EXISTS blocked_times (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  staff_id TEXT REFERENCES staff(id),
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_blocked_times_business ON blocked_times(business_id);
CREATE INDEX IF NOT EXISTS idx_blocked_times_staff ON blocked_times(staff_id);

CREATE TABLE IF NOT EXISTS special_days (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  staff_id TEXT REFERENCES staff(id),
  date TEXT NOT NULL,
  is_closed INTEGER NOT NULL DEFAULT 1,
  open_time TEXT,
  close_time TEXT,
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_special_days_business ON special_days(business_id);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birth_date TEXT,
  gender TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  kvkk_consent INTEGER NOT NULL DEFAULT 0,
  kvkk_consent_at TEXT,
  no_show_count INTEGER NOT NULL DEFAULT 0,
  warning_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(business_id, phone);

CREATE TABLE IF NOT EXISTS customer_notes (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  author_user_id TEXT REFERENCES users(id),
  note TEXT NOT NULL,
  is_warning INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON customer_notes(customer_id);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  branch_id TEXT REFERENCES branches(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  staff_id TEXT REFERENCES staff(id),
  service_id TEXT NOT NULL REFERENCES services(id),
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','arrived','completed','cancelled','no_show','rescheduled')),
  price REAL NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid','pending','refunded','cancelled')),
  customer_note TEXT,
  internal_note TEXT,
  source TEXT NOT NULL DEFAULT 'panel' CHECK (source IN ('public','panel','mobile')),
  cancellation_reason TEXT,
  created_by_user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_appointments_business ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments(business_id, start_at);

CREATE TABLE IF NOT EXISTS appointment_status_history (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL REFERENCES appointments(id),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by_user_id TEXT REFERENCES users(id),
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_status_history_appointment ON appointment_status_history(appointment_id);

CREATE TABLE IF NOT EXISTS accounting_categories (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  name TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_accounting_categories_business ON accounting_categories(business_id);

CREATE TABLE IF NOT EXISTS income_records (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  branch_id TEXT REFERENCES branches(id),
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','card','transfer')),
  description TEXT,
  customer_id TEXT REFERENCES customers(id),
  appointment_id TEXT REFERENCES appointments(id),
  service_id TEXT REFERENCES services(id),
  staff_id TEXT REFERENCES staff(id),
  category_id TEXT REFERENCES accounting_categories(id),
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid','pending','cancelled')),
  created_by_user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_income_business_date ON income_records(business_id, date);

CREATE TABLE IF NOT EXISTS expense_records (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  branch_id TEXT REFERENCES branches(id),
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  category_id TEXT REFERENCES accounting_categories(id),
  description TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','card','transfer')),
  receipt_url TEXT,
  supplier_name TEXT,
  created_by_user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_expense_business_date ON expense_records(business_id, date);

CREATE TABLE IF NOT EXISTS cash_registers (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  branch_id TEXT REFERENCES branches(id),
  date TEXT NOT NULL,
  opening_balance REAL NOT NULL DEFAULT 0,
  closing_balance REAL,
  total_income REAL NOT NULL DEFAULT 0,
  total_expense REAL NOT NULL DEFAULT 0,
  cash_total REAL NOT NULL DEFAULT 0,
  card_total REAL NOT NULL DEFAULT 0,
  transfer_total REAL NOT NULL DEFAULT 0,
  note TEXT,
  closed_at TEXT,
  closed_by_user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE(business_id, branch_id, date)
);
CREATE INDEX IF NOT EXISTS idx_cash_registers_business ON cash_registers(business_id, date);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  business_id TEXT REFERENCES businesses(id),
  user_id TEXT REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  channel TEXT NOT NULL DEFAULT 'inapp' CHECK (channel IN ('inapp','email','sms','whatsapp','push')),
  is_read INTEGER NOT NULL DEFAULT 0,
  related_appointment_id TEXT REFERENCES appointments(id),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_business ON notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  monthly_price REAL NOT NULL,
  yearly_price REAL NOT NULL,
  max_staff INTEGER,
  max_branches INTEGER,
  max_monthly_appointments INTEGER,
  has_accounting INTEGER NOT NULL DEFAULT 0,
  has_advanced_reports INTEGER NOT NULL DEFAULT 0,
  has_sms_whatsapp INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) UNIQUE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial','active','past_due','cancelled','suspended')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  trial_ends_at TEXT,
  current_period_start TEXT,
  current_period_end TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_business ON subscriptions(business_id);

CREATE TABLE IF NOT EXISTS public_page_settings (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) UNIQUE,
  theme_color TEXT NOT NULL DEFAULT '#5817B0',
  description_override TEXT,
  show_address INTEGER NOT NULL DEFAULT 1,
  show_phone INTEGER NOT NULL DEFAULT 1,
  auto_confirm INTEGER NOT NULL DEFAULT 1,
  cancellation_policy TEXT,
  kvkk_text TEXT,
  booking_window_days INTEGER NOT NULL DEFAULT 30,
  min_notice_hours INTEGER NOT NULL DEFAULT 2,
  deposit_enabled INTEGER NOT NULL DEFAULT 0,
  social_links TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  business_id TEXT REFERENCES businesses(id),
  actor_user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  meta TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business ON audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
