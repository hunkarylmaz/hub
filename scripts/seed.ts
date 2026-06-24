/**
 * Demo veri tohumlama betiği: npm run db:seed
 * Süper admin, abonelik planları ve 5 örnek işletmeyi (hizmet, çalışan, çalışma saati,
 * müşteri, randevu, gelir/gider, bildirim) gerçekçi ve birbirinden izole şekilde oluşturur.
 */
import { hashPassword } from "../src/lib/password";
import { createUser, findUserByEmail } from "../src/lib/db/repo/users";
import { createBusiness, findBusinessBySlug } from "../src/lib/db/repo/businesses";
import { addBusinessUser } from "../src/lib/db/repo/businesses";
import { createPlan, createSubscription } from "../src/lib/db/repo/plans";
import { createService, setStaffServices } from "../src/lib/db/repo/services";
import { createStaff, setWorkingHours, setStaffWorkingHours } from "../src/lib/db/repo/staff";
import { createCustomer } from "../src/lib/db/repo/customers";
import { createAppointment } from "../src/lib/db/repo/appointments";
import {
  seedDefaultAccountingCategories,
  listAccountingCategories,
  createIncomeRecord,
  createExpenseRecord,
} from "../src/lib/db/repo/accounting";
import { createNotification, markNotificationRead } from "../src/lib/db/repo/notifications";
import { getOrCreatePublicPageSettings, updatePublicPageSettings } from "../src/lib/db/repo/publicPageSettings";
import { recordAuditLog } from "../src/lib/db/repo/auditLogs";
import { getDb } from "../src/lib/db/client";
import { combineDateTime, addDaysKey, todayKey, addMinutesIso, isoWeekday, minutesToTime } from "../src/lib/date";
import type { Service, Staff, Customer, AppointmentStatus, PaymentStatus, PaymentMethod } from "../src/lib/types";

const DEMO_PASSWORD = "Rezervasyo2024!";
const ADMIN_PASSWORD = "Admin2024!";
const PAYMENT_METHODS: PaymentMethod[] = ["cash", "card", "transfer"];

function hoursFor(openTime: string, closeTime: string, closedWeekdays: number[]) {
  return Array.from({ length: 7 }, (_, weekday) => {
    const closed = closedWeekdays.includes(weekday);
    return { weekday, isClosed: closed, openTime: closed ? null : openTime, closeTime: closed ? null : closeTime, breakStart: null, breakEnd: null };
  });
}

function staffHoursFor(openTime: string, closeTime: string, closedWeekdays: number[]) {
  return Array.from({ length: 7 }, (_, weekday) => {
    const off = closedWeekdays.includes(weekday);
    return { weekday, isOff: off, startTime: off ? null : openTime, endTime: off ? null : closeTime, breakStart: null, breakEnd: null };
  });
}

function timeToMinutesLocal(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

type Bucket = "past" | "today" | "future";

function statusForBucket(bucket: Bucket, idx: number): { status: AppointmentStatus; paymentStatus: PaymentStatus } {
  if (bucket === "past") {
    const pattern: AppointmentStatus[] = ["completed", "completed", "completed", "no_show", "cancelled"];
    const status = pattern[idx % pattern.length];
    return { status, paymentStatus: status === "completed" ? "paid" : status === "cancelled" ? "cancelled" : "pending" };
  }
  if (bucket === "today") {
    const pattern: AppointmentStatus[] = ["completed", "arrived", "confirmed", "pending"];
    const status = pattern[idx % pattern.length];
    return { status, paymentStatus: status === "completed" ? "paid" : "pending" };
  }
  const pattern: AppointmentStatus[] = ["confirmed", "pending"];
  const status = pattern[idx % pattern.length];
  return { status, paymentStatus: "pending" };
}

const CUSTOMER_NAMES = [
  "Ayşe Yıldız", "Mehmet Demir", "Fatma Şahin", "Ahmet Kaya", "Zeynep Çelik",
  "Mustafa Aydın", "Elif Arslan", "Emre Doğan", "Büşra Korkmaz", "Can Özdemir",
  "Selin Polat", "Burak Yılmaz",
];

function buildCustomers(businessId: string, count: number): Customer[] {
  const list: Customer[] = [];
  for (let i = 0; i < count; i++) {
    const name = CUSTOMER_NAMES[i % CUSTOMER_NAMES.length];
    const phone = `+90 5${String(30 + i).padStart(2, "0")} ${String(100 + i * 7).padStart(3, "0")} ${String(10 + i).padStart(2, "0")} ${String(20 + i).padStart(2, "0")}`;
    list.push(
      createCustomer(businessId, {
        fullName: name,
        phone,
        email: `${name.toLowerCase().replace(/[^a-zçğıöşü ]/g, "").replace(/\s+/g, ".")}${i}@ornek.com`,
        tags: i % 4 === 0 ? ["vip"] : i % 5 === 0 ? ["yeni"] : [],
        kvkkConsent: true,
      })
    );
  }
  return list;
}

interface StaffSeedDef {
  fullName: string;
  title: string;
  phone: string;
  email: string;
  serviceIndexes: number[];
}

async function seedBusiness(opts: {
  ownerEmail: string;
  ownerFullName: string;
  ownerPhone: string;
  businessName: string;
  slug: string;
  sector: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  description: string;
  openTime: string;
  closeTime: string;
  closedWeekdays: number[];
  services: { name: string; durationMinutes: number; bufferMinutes?: number; price: number; color: string }[];
  staffDefs: StaffSeedDef[];
  customerCount: number;
  pastDays: number;
  futureDays: number;
  perDay: number;
  rentAmount: number;
  supplyAmount: number;
  planId: string;
  subscriptionStatus: "trial" | "active" | "past_due";
  superAdminId: string;
}) {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const owner = createUser({ email: opts.ownerEmail, passwordHash, fullName: opts.ownerFullName, phone: opts.ownerPhone, role: "OWNER" });

  const business = createBusiness({
    ownerUserId: owner.id,
    name: opts.businessName,
    slug: opts.slug,
    sector: opts.sector,
    phone: opts.phone,
    email: opts.ownerEmail,
    city: opts.city,
    district: opts.district,
    address: opts.address,
    description: opts.description,
  });

  recordAuditLog({ actorUserId: opts.superAdminId, action: "business.created", entityType: "business", entityId: business.id, meta: { name: business.name } });

  const trialEndsAt = opts.subscriptionStatus === "trial" ? addMinutesIso(new Date().toISOString(), 14 * 24 * 60) : null;
  createSubscription({ businessId: business.id, planId: opts.planId, status: opts.subscriptionStatus, trialEndsAt });

  setWorkingHours(business.id, hoursFor(opts.openTime, opts.closeTime, opts.closedWeekdays));

  const services: Service[] = opts.services.map((s) =>
    createService(business.id, { name: s.name, durationMinutes: s.durationMinutes, bufferMinutes: s.bufferMinutes ?? 10, price: s.price, color: s.color })
  );

  const staff: Staff[] = [];
  const staffServiceMap = new Map<string, Service[]>();
  for (const def of opts.staffDefs) {
    const member = createStaff(business.id, { fullName: def.fullName, title: def.title, phone: def.phone, email: def.email });
    staff.push(member);
    const allowed = def.serviceIndexes.map((i) => services[i]);
    staffServiceMap.set(member.id, allowed);
    setStaffServices(member.id, allowed.map((s) => s.id));
    setStaffWorkingHours(member.id, staffHoursFor(opts.openTime, opts.closeTime, opts.closedWeekdays));
  }

  const customers = buildCustomers(business.id, opts.customerCount);

  seedDefaultAccountingCategories(business.id);
  const incomeCategories = listAccountingCategories(business.id, "income");
  const expenseCategories = listAccountingCategories(business.id, "expense");
  const serviceIncomeCategoryId = incomeCategories.find((c) => c.name === "Hizmet Geliri")?.id ?? null;
  const rentCategoryId = expenseCategories.find((c) => c.name === "Kira")?.id ?? null;
  const supplyCategoryId = expenseCategories.find((c) => c.name === "Ürün / Malzeme")?.id ?? null;

  const today = todayKey();
  const openMinutes = timeToMinutesLocal(opts.openTime);
  const closeMinutes = timeToMinutesLocal(opts.closeTime);
  let paymentRotation = 0;
  let appointmentCount = 0;

  for (let dayOffset = -opts.pastDays; dayOffset <= opts.futureDays; dayOffset++) {
    const dateK = addDaysKey(today, dayOffset);
    const weekdayNum = isoWeekday(new Date(combineDateTime(dateK, "12:00")));
    if (opts.closedWeekdays.includes(weekdayNum)) continue;

    const cursors: Record<string, number> = {};
    const bucket: Bucket = dayOffset < 0 ? "past" : dayOffset === 0 ? "today" : "future";

    for (let i = 0; i < opts.perDay; i++) {
      const staffMember = staff[i % staff.length];
      const allowedServices = staffServiceMap.get(staffMember.id)!;
      const service = allowedServices[i % allowedServices.length];
      const customer = customers[(dayOffset + i + customers.length * 3) % customers.length];

      const startMinute = cursors[staffMember.id] ?? openMinutes;
      const totalSpan = service.durationMinutes + service.bufferMinutes;
      if (startMinute + totalSpan > closeMinutes) continue;
      cursors[staffMember.id] = startMinute + totalSpan;

      const startIso = combineDateTime(dateK, minutesToTime(startMinute));
      const endIso = addMinutesIso(startIso, service.durationMinutes);
      const { status, paymentStatus } = statusForBucket(bucket, i + Math.abs(dayOffset));

      const appointment = createAppointment({
        businessId: business.id,
        customerId: customer.id,
        staffId: staffMember.id,
        serviceId: service.id,
        startAt: startIso,
        endAt: endIso,
        price: service.price,
        status,
        paymentStatus,
        source: i % 2 === 0 ? "public" : "panel",
        createdByUserId: owner.id,
      });
      appointmentCount++;

      if (status === "completed") {
        const method = PAYMENT_METHODS[paymentRotation % PAYMENT_METHODS.length];
        paymentRotation++;
        createIncomeRecord(business.id, owner.id, {
          date: dateK,
          amount: service.price,
          paymentMethod: method,
          description: `${service.name} – ${customer.fullName}`,
          customerId: customer.id,
          appointmentId: appointment.id,
          serviceId: service.id,
          staffId: staffMember.id,
          categoryId: serviceIncomeCategoryId,
          status: "paid",
        });
      }
    }
  }

  if (rentCategoryId) {
    createExpenseRecord(business.id, owner.id, {
      date: addDaysKey(today, -28),
      amount: opts.rentAmount,
      categoryId: rentCategoryId,
      description: "Aylık kira ödemesi",
      paymentMethod: "transfer",
    });
  }
  if (supplyCategoryId) {
    createExpenseRecord(business.id, owner.id, {
      date: addDaysKey(today, -18),
      amount: opts.supplyAmount,
      categoryId: supplyCategoryId,
      description: "Sarf malzeme alımı",
      paymentMethod: "card",
    });
    createExpenseRecord(business.id, owner.id, {
      date: addDaysKey(today, -6),
      amount: Math.round(opts.supplyAmount * 0.6),
      categoryId: supplyCategoryId,
      description: "Sarf malzeme alımı",
      paymentMethod: "cash",
    });
  }

  const n1 = createNotification({ businessId: business.id, type: "appointment_created", title: "Yeni randevu oluşturuldu", body: `${customers[0].fullName} için yeni bir randevu eklendi.`, channel: "inapp" });
  const n2 = createNotification({ businessId: business.id, type: "payment_received", title: "Ödeme alındı", body: "Bir randevu için ödeme kaydedildi.", channel: "inapp" });
  createNotification({ businessId: business.id, type: "subscription", title: opts.subscriptionStatus === "trial" ? "Deneme süreniz başladı" : "Aboneliğiniz aktif", body: "Abonelik durumunuzu Abonelik sayfasından takip edebilirsiniz.", channel: "inapp" });
  createNotification({ businessId: business.id, type: "reminder", title: "Yarının randevularını gözden geçirin", body: "Yarın için planlanmış randevularınız var.", channel: "inapp" });
  markNotificationRead(n1.id);
  markNotificationRead(n2.id);

  getOrCreatePublicPageSettings(business.id);

  console.log(`  ✓ ${business.name} (${business.slug}) — ${staff.length} çalışan, ${customers.length} müşteri, ${appointmentCount} randevu`);

  return { business, owner, staff };
}

async function main() {
  if (findBusinessBySlug("nova-guzellik-salonu")) {
    console.log("Seed verisi zaten mevcut görünüyor, çıkılıyor.");
    return;
  }

  console.log("Süper admin oluşturuluyor...");
  let superAdmin = findUserByEmail("admin@rezervasyo.com");
  if (!superAdmin) {
    superAdmin = createUser({
      email: "admin@rezervasyo.com",
      passwordHash: await hashPassword(ADMIN_PASSWORD),
      fullName: "Rezervasyo Yönetici",
      role: "SUPER_ADMIN",
    });
  }

  console.log("Abonelik planları oluşturuluyor...");
  const starter = createPlan({
    name: "Başlangıç", slug: "baslangic", monthlyPrice: 299, yearlyPrice: 2990,
    originalMonthlyPrice: null, originalYearlyPrice: null,
    maxStaff: 2, maxBranches: 1, maxMonthlyAppointments: 150,
    hasAccounting: false, hasAdvancedReports: false, hasSmsWhatsapp: false, isActive: true, sortOrder: 0,
  });
  const pro = createPlan({
    name: "Profesyonel", slug: "profesyonel", monthlyPrice: 599, yearlyPrice: 5990,
    originalMonthlyPrice: 799, originalYearlyPrice: 7990,
    maxStaff: 8, maxBranches: 3, maxMonthlyAppointments: 1000,
    hasAccounting: true, hasAdvancedReports: true, hasSmsWhatsapp: false, isActive: true, sortOrder: 1,
  });
  const premium = createPlan({
    name: "Premium", slug: "premium", monthlyPrice: 999, yearlyPrice: 9990,
    originalMonthlyPrice: 1299, originalYearlyPrice: 12990,
    maxStaff: null, maxBranches: null, maxMonthlyAppointments: null,
    hasAccounting: true, hasAdvancedReports: true, hasSmsWhatsapp: true, isActive: true, sortOrder: 2,
  });
  for (const plan of [starter, pro, premium]) {
    recordAuditLog({ actorUserId: superAdmin.id, action: "plan.created", entityType: "plan", entityId: plan.id, meta: { name: plan.name } });
  }

  console.log("Demo işletmeler oluşturuluyor...");

  const nova = await seedBusiness({
    ownerEmail: "elif@novaguzellik.com",
    ownerFullName: "Elif Yılmaz",
    ownerPhone: "+90 532 111 22 33",
    businessName: "Nova Güzellik Salonu",
    slug: "nova-guzellik-salonu",
    sector: "guzellik_salonu",
    city: "İstanbul",
    district: "Kadıköy",
    address: "Bahariye Cd. No:24, Kadıköy/İstanbul",
    phone: "+90 216 333 44 55",
    description: "Kadıköy'de cilt bakımı, lazer epilasyon ve kalıcı makyaj hizmetleri sunan butik güzellik salonu.",
    openTime: "09:00",
    closeTime: "19:00",
    closedWeekdays: [6],
    services: [
      { name: "Cilt Bakımı", durationMinutes: 60, price: 800, color: "#7C3AED" },
      { name: "Lazer Epilasyon", durationMinutes: 45, price: 600, color: "#EC4899" },
      { name: "Manikür & Pedikür", durationMinutes: 50, price: 350, color: "#3B82F6" },
      { name: "Saç Boyama", durationMinutes: 90, price: 950, color: "#F59E0B" },
      { name: "Kalıcı Makyaj", durationMinutes: 120, price: 1500, color: "#10B981" },
    ],
    staffDefs: [
      { fullName: "Elif Yılmaz", title: "Kurucu / Estetisyen", phone: "+90 532 111 22 33", email: "elif@novaguzellik.com", serviceIndexes: [0, 3, 4] },
      { fullName: "Zeynep Kara", title: "Cilt Uzmanı", phone: "+90 532 222 33 44", email: "zeynep@novaguzellik.com", serviceIndexes: [0, 1] },
      { fullName: "Merve Demir", title: "Manikürist", phone: "+90 532 333 44 55", email: "merve@novaguzellik.com", serviceIndexes: [2] },
    ],
    customerCount: 10,
    pastDays: 14,
    futureDays: 7,
    perDay: 5,
    rentAmount: 18000,
    supplyAmount: 3200,
    planId: pro.id,
    subscriptionStatus: "active",
    superAdminId: superAdmin.id,
  });

  const zeynepUser = createUser({
    email: "zeynep@novaguzellik.com",
    passwordHash: await hashPassword(DEMO_PASSWORD),
    fullName: "Zeynep Kara",
    phone: "+90 532 222 33 44",
    role: "STAFF",
  });
  addBusinessUser(nova.business.id, zeynepUser.id, "STAFF", {});
  getDb().prepare("UPDATE staff SET user_id = ? WHERE id = ?").run(zeynepUser.id, nova.staff[1].id);

  await seedBusiness({
    ownerEmail: "ali@alibarberstudio.com",
    ownerFullName: "Ali Çelik",
    ownerPhone: "+90 533 222 11 00",
    businessName: "Ali Barber Studio",
    slug: "ali-barber-studio",
    sector: "berber_kuafor",
    city: "İstanbul",
    district: "Beşiktaş",
    address: "Spor Cd. No:8, Beşiktaş/İstanbul",
    phone: "+90 212 444 55 66",
    description: "Beşiktaş'ta klasik ve modern erkek bakımı sunan usta berber stüdyosu.",
    openTime: "10:00",
    closeTime: "20:00",
    closedWeekdays: [6],
    services: [
      { name: "Saç Kesimi", durationMinutes: 30, price: 250, color: "#3B82F6" },
      { name: "Sakal Tıraşı", durationMinutes: 20, price: 150, color: "#10B981" },
      { name: "Saç + Sakal", durationMinutes: 45, price: 350, color: "#7C3AED" },
      { name: "Cilt Bakımı (Erkek)", durationMinutes: 40, price: 300, color: "#F59E0B" },
    ],
    staffDefs: [
      { fullName: "Ali Çelik", title: "Usta Berber", phone: "+90 533 222 11 00", email: "ali@alibarberstudio.com", serviceIndexes: [0, 1, 2, 3] },
      { fullName: "Kerem Şahin", title: "Berber", phone: "+90 533 333 22 11", email: "kerem@alibarberstudio.com", serviceIndexes: [0, 1, 2] },
    ],
    customerCount: 10,
    pastDays: 14,
    futureDays: 7,
    perDay: 6,
    rentAmount: 12000,
    supplyAmount: 1500,
    planId: starter.id,
    subscriptionStatus: "trial",
    superAdminId: superAdmin.id,
  });

  await seedBusiness({
    ownerEmail: "arya@klinikarya.com",
    ownerFullName: "Dr. Arya Korkmaz",
    ownerPhone: "+90 542 444 55 66",
    businessName: "Klinik Arya",
    slug: "klinik-arya",
    sector: "klinik",
    city: "Ankara",
    district: "Çankaya",
    address: "Tunalı Hilmi Cd. No:45, Çankaya/Ankara",
    phone: "+90 312 555 66 77",
    description: "Çankaya'da diş sağlığı ve estetik diş tedavileri sunan özel diş kliniği.",
    openTime: "09:00",
    closeTime: "18:00",
    closedWeekdays: [6],
    services: [
      { name: "Diş Muayenesi", durationMinutes: 30, price: 400, color: "#3B82F6" },
      { name: "Diş Beyazlatma", durationMinutes: 60, price: 1800, color: "#10B981" },
      { name: "Dolgu", durationMinutes: 45, price: 900, color: "#F59E0B" },
      { name: "İmplant Konsültasyonu", durationMinutes: 30, price: 500, color: "#7C3AED" },
    ],
    staffDefs: [
      { fullName: "Dr. Arya Korkmaz", title: "Diş Hekimi", phone: "+90 542 444 55 66", email: "arya@klinikarya.com", serviceIndexes: [0, 1, 2, 3] },
      { fullName: "Dr. Burak Aydın", title: "Diş Hekimi", phone: "+90 542 555 66 77", email: "burak@klinikarya.com", serviceIndexes: [0, 1, 2] },
    ],
    customerCount: 12,
    pastDays: 14,
    futureDays: 7,
    perDay: 6,
    rentAmount: 22000,
    supplyAmount: 4500,
    planId: premium.id,
    subscriptionStatus: "active",
    superAdminId: superAdmin.id,
  });

  await seedBusiness({
    ownerEmail: "deniz@lotuspsikoloji.com",
    ownerFullName: "Psk. Deniz Aksoy",
    ownerPhone: "+90 555 666 77 88",
    businessName: "Lotus Psikoloji",
    slug: "lotus-psikoloji",
    sector: "psikolog",
    city: "İzmir",
    district: "Karşıyaka",
    address: "Bostanlı Mah. Cemal Gürsel Cd. No:12, Karşıyaka/İzmir",
    phone: "+90 232 777 88 99",
    description: "Karşıyaka'da bireysel ve çift terapisi hizmeti veren psikolojik danışmanlık merkezi.",
    openTime: "10:00",
    closeTime: "19:00",
    closedWeekdays: [6],
    services: [
      { name: "Bireysel Terapi", durationMinutes: 50, price: 700, color: "#7C3AED" },
      { name: "Çift Terapisi", durationMinutes: 60, price: 900, color: "#EC4899" },
      { name: "Online Terapi", durationMinutes: 50, price: 650, color: "#3B82F6" },
    ],
    staffDefs: [
      { fullName: "Psk. Deniz Aksoy", title: "Klinik Psikolog", phone: "+90 555 666 77 88", email: "deniz@lotuspsikoloji.com", serviceIndexes: [0, 1, 2] },
      { fullName: "Psk. Selin Arslan", title: "Uzman Psikolog", phone: "+90 555 777 88 99", email: "selin@lotuspsikoloji.com", serviceIndexes: [0, 2] },
    ],
    customerCount: 9,
    pastDays: 14,
    futureDays: 7,
    perDay: 4,
    rentAmount: 9000,
    supplyAmount: 800,
    planId: pro.id,
    subscriptionStatus: "past_due",
    superAdminId: superAdmin.id,
  });

  await seedBusiness({
    ownerEmail: "cem@elitdugun.com",
    ownerFullName: "Cem Aydoğan",
    ownerPhone: "+90 544 888 99 00",
    businessName: "Elit Düğün Salonu",
    slug: "elit-dugun-salonu",
    sector: "dugun_salonu",
    city: "İstanbul",
    district: "Sarıyer",
    address: "Boğaz Cd. No:101, Sarıyer/İstanbul",
    phone: "+90 212 999 00 11",
    description: "Sarıyer'de boğaz manzaralı, davet ve düğün organizasyonları için özel mekan.",
    openTime: "10:00",
    closeTime: "22:00",
    closedWeekdays: [0],
    services: [
      { name: "Düğün Görüşmesi", durationMinutes: 60, price: 0, color: "#7C3AED" },
      { name: "Salon Kiralama (Tam Gün)", durationMinutes: 480, bufferMinutes: 60, price: 45000, color: "#F59E0B" },
      { name: "Nişan Organizasyonu", durationMinutes: 240, bufferMinutes: 60, price: 18000, color: "#EC4899" },
    ],
    staffDefs: [
      { fullName: "Cem Aydoğan", title: "Etkinlik Yöneticisi", phone: "+90 544 888 99 00", email: "cem@elitdugun.com", serviceIndexes: [0, 1, 2] },
      { fullName: "Aylin Tunç", title: "Organizasyon Uzmanı", phone: "+90 544 999 00 11", email: "aylin@elitdugun.com", serviceIndexes: [0, 2] },
    ],
    customerCount: 8,
    pastDays: 10,
    futureDays: 10,
    perDay: 2,
    rentAmount: 35000,
    supplyAmount: 6000,
    planId: starter.id,
    subscriptionStatus: "trial",
    superAdminId: superAdmin.id,
  });

  console.log("\nSeed tamamlandı.");
  console.log(`Süper admin: admin@rezervasyo.com / ${ADMIN_PASSWORD}`);
  console.log(`İşletme sahipleri (tümü): ${DEMO_PASSWORD}`);
  console.log(`Çalışan girişi örneği: zeynep@novaguzellik.com / ${DEMO_PASSWORD}`);
}

main()
  .then(() => {
    getDb();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed sırasında hata oluştu:", err);
    process.exit(1);
  });
