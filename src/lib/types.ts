export type UserRole = "SUPER_ADMIN" | "OWNER" | "STAFF";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "arrived"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rescheduled";

export type PaymentStatus = "paid" | "pending" | "refunded" | "cancelled";
export type AppointmentSource = "public" | "panel" | "mobile";
export type PaymentMethod = "cash" | "card" | "transfer";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled" | "suspended";
export type BillingCycle = "monthly" | "yearly";
export type NotificationChannel = "inapp" | "email" | "sms" | "whatsapp" | "push";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SafeUser = Omit<User, "passwordHash">;

export interface Business {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  sector: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  instagram: string | null;
  website: string | null;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  themeColor: string;
  status: "active" | "inactive";
  onboardingStep: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessUser {
  id: string;
  businessId: string;
  userId: string;
  role: "OWNER" | "STAFF";
  permissions: Record<string, boolean>;
  createdAt: string;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  address: string | null;
  city: string | null;
  district: string | null;
  phone: string | null;
  isMain: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ServiceCategory {
  id: string;
  businessId: string;
  name: string;
  color: string;
  sortOrder: number;
  createdAt: string;
}

export interface Service {
  id: string;
  businessId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
  currency: string;
  color: string;
  isOnlineBookable: boolean;
  requiresDeposit: boolean;
  depositAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  businessId: string;
  branchId: string | null;
  userId: string | null;
  fullName: string;
  photoUrl: string | null;
  phone: string | null;
  email: string | null;
  title: string | null;
  isBookableOnline: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkingHour {
  id: string;
  businessId: string;
  branchId: string | null;
  weekday: number;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
}

export interface StaffWorkingHour {
  id: string;
  staffId: string;
  weekday: number;
  isOff: boolean;
  startTime: string | null;
  endTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
}

export interface BlockedTime {
  id: string;
  businessId: string;
  staffId: string | null;
  startAt: string;
  endAt: string;
  reason: string | null;
  createdAt: string;
}

export interface SpecialDay {
  id: string;
  businessId: string;
  staffId: string | null;
  date: string;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
  note: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  businessId: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  gender: string | null;
  tags: string[];
  kvkkConsent: boolean;
  kvkkConsentAt: string | null;
  noShowCount: number;
  warningNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  businessId: string;
  authorUserId: string | null;
  note: string;
  isWarning: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  businessId: string;
  branchId: string | null;
  customerId: string;
  staffId: string | null;
  serviceId: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  price: number;
  paymentStatus: PaymentStatus;
  customerNote: string | null;
  internalNote: string | null;
  source: AppointmentSource;
  cancellationReason: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentStatusHistoryEntry {
  id: string;
  appointmentId: string;
  businessId: string;
  fromStatus: string | null;
  toStatus: string;
  changedByUserId: string | null;
  note: string | null;
  createdAt: string;
}

export interface AccountingCategory {
  id: string;
  businessId: string;
  type: "income" | "expense";
  name: string;
  isDefault: boolean;
  createdAt: string;
}

export interface IncomeRecord {
  id: string;
  businessId: string;
  branchId: string | null;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string | null;
  customerId: string | null;
  appointmentId: string | null;
  serviceId: string | null;
  staffId: string | null;
  categoryId: string | null;
  status: "paid" | "pending" | "cancelled";
  createdByUserId: string | null;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  businessId: string;
  branchId: string | null;
  date: string;
  amount: number;
  categoryId: string | null;
  description: string | null;
  paymentMethod: PaymentMethod;
  receiptUrl: string | null;
  supplierName: string | null;
  createdByUserId: string | null;
  createdAt: string;
}

export interface CashRegister {
  id: string;
  businessId: string;
  branchId: string | null;
  date: string;
  openingBalance: number;
  closingBalance: number | null;
  totalIncome: number;
  totalExpense: number;
  cashTotal: number;
  cardTotal: number;
  transferTotal: number;
  note: string | null;
  closedAt: string | null;
  closedByUserId: string | null;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  businessId: string | null;
  userId: string | null;
  type: string;
  title: string;
  body: string | null;
  channel: NotificationChannel;
  isRead: boolean;
  relatedAppointmentId: string | null;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxStaff: number | null;
  maxBranches: number | null;
  maxMonthlyAppointments: number | null;
  hasAccounting: boolean;
  hasAdvancedReports: boolean;
  hasSmsWhatsapp: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface Subscription {
  id: string;
  businessId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicPageSettings {
  id: string;
  businessId: string;
  themeColor: string;
  descriptionOverride: string | null;
  showAddress: boolean;
  showPhone: boolean;
  autoConfirm: boolean;
  cancellationPolicy: string | null;
  kvkkText: string | null;
  bookingWindowDays: number;
  minNoticeHours: number;
  depositEnabled: boolean;
  socialLinks: Record<string, string>;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  businessId: string | null;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
}

export const SECTORS = [
  { value: "berber_kuafor", label: "Berber / Kuaför" },
  { value: "guzellik_salonu", label: "Güzellik Salonu" },
  { value: "psikolog", label: "Psikolog" },
  { value: "klinik", label: "Özel Klinik / Diş Kliniği" },
  { value: "diyetisyen", label: "Diyetisyen" },
  { value: "ayak_bakim", label: "Ayak Bakım Merkezi" },
  { value: "spa_masaj", label: "Spa & Masaj Salonu" },
  { value: "dugun_salonu", label: "Düğün Salonu" },
  { value: "etkinlik_mekani", label: "Etkinlik Mekanı" },
  { value: "spor_egitim", label: "Spor / Eğitim Stüdyosu" },
  { value: "danismanlik", label: "Danışmanlık" },
  { value: "diger", label: "Diğer" },
] as const;

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  arrived: "Geldi",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
  no_show: "Gelmedi",
  rescheduled: "Yeniden Planlandı",
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: "status-pending",
  confirmed: "status-confirmed",
  arrived: "status-arrived",
  completed: "status-completed",
  cancelled: "status-cancelled",
  no_show: "status-noshow",
  rescheduled: "status-rescheduled",
};

export const APPOINTMENT_STATUS_HEX: Record<AppointmentStatus, string> = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  arrived: "#06B6D4",
  completed: "#22C55E",
  cancelled: "#EF4444",
  no_show: "#9CA3AF",
  rescheduled: "#A855F7",
};

export const WEEKDAY_LABELS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
export const WEEKDAY_LABELS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Nakit",
  card: "Kart",
  transfer: "Havale/EFT",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial: "Deneme",
  active: "Aktif",
  past_due: "Ödeme Gecikti",
  cancelled: "İptal Edildi",
  suspended: "Askıya Alındı",
};
