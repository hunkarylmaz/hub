"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext } from "@/lib/session";
import {
  createStaff,
  updateStaff,
  findStaffById,
  setStaffUserId,
  listStaffWorkingHours,
  setStaffWorkingHours,
  calculateStaffEarnings,
  type StaffInput,
} from "@/lib/db/repo/staff";
import { listServiceIdsForStaff } from "@/lib/db/repo/services";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";
import { createUser, findUserByEmail, updateUserPassword } from "@/lib/db/repo/users";
import { addBusinessUser } from "@/lib/db/repo/businesses";
import { hashPassword, generateTempPassword } from "@/lib/password";

function revalidateStaffViews() {
  revalidatePath("/panel/calisanlar");
  revalidatePath("/panel/hizmetler");
  revalidatePath("/panel/takvim");
  revalidatePath("/panel/randevular");
}

export interface CreateStaffPayload extends StaffInput {
  createLogin?: boolean;
}

export async function createStaffAction(input: CreateStaffPayload) {
  const { user, business } = await requireBusinessContext();
  const fullName = input.fullName.trim();
  if (!fullName) throw new Error("Ad Soyad zorunludur.");

  const { createLogin, ...staffInput } = input;

  let staffUserId: string | null = null;
  let generatedPassword: string | null = null;

  if (createLogin) {
    const email = (staffInput.email ?? "").trim();
    if (!email) throw new Error("Giriş yetkisi için e-posta zorunludur.");
    if (findUserByEmail(email)) throw new Error("Bu e-posta adresi zaten kullanılıyor.");

    generatedPassword = generateTempPassword();
    const passwordHash = await hashPassword(generatedPassword);
    const newUser = createUser({ email, passwordHash, fullName, role: "STAFF" });
    addBusinessUser(business.id, newUser.id, "STAFF");
    staffUserId = newUser.id;
  }

  const staff = createStaff(business.id, { ...staffInput, fullName }, staffUserId);

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "staff.created",
    entityType: "staff",
    entityId: staff.id,
  });

  revalidateStaffViews();
  return { staff, generatedPassword };
}

export async function updateStaffAction(staffId: string, input: Partial<StaffInput> & { isActive?: boolean }) {
  const { user, business } = await requireBusinessContext();
  const existing = findStaffById(staffId);
  if (!existing || existing.businessId !== business.id) throw new Error("Çalışan bulunamadı.");

  const updated = updateStaff(staffId, input);

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "staff.updated",
    entityType: "staff",
    entityId: staffId,
  });

  revalidateStaffViews();
  return updated;
}

export async function toggleStaffActiveAction(staffId: string, isActive: boolean) {
  const { business } = await requireBusinessContext();
  const existing = findStaffById(staffId);
  if (!existing || existing.businessId !== business.id) throw new Error("Çalışan bulunamadı.");
  const updated = updateStaff(staffId, { isActive });
  revalidateStaffViews();
  return updated;
}

export async function grantStaffLoginAction(staffId: string, email: string) {
  const { user, business } = await requireBusinessContext();
  const existing = findStaffById(staffId);
  if (!existing || existing.businessId !== business.id) throw new Error("Çalışan bulunamadı.");
  if (existing.userId) throw new Error("Bu çalışanın zaten panel girişi var.");

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) throw new Error("Giriş yetkisi için e-posta zorunludur.");
  if (findUserByEmail(trimmedEmail)) throw new Error("Bu e-posta adresi zaten kullanılıyor.");

  const generatedPassword = generateTempPassword();
  const passwordHash = await hashPassword(generatedPassword);
  const newUser = createUser({ email: trimmedEmail, passwordHash, fullName: existing.fullName, role: "STAFF" });
  addBusinessUser(business.id, newUser.id, "STAFF");
  setStaffUserId(staffId, newUser.id);
  if (existing.email !== trimmedEmail) updateStaff(staffId, { email: trimmedEmail });

  recordAuditLog({ businessId: business.id, actorUserId: user.id, action: "staff.login_granted", entityType: "staff", entityId: staffId });
  revalidateStaffViews();
  return { generatedPassword };
}

export async function resetStaffPasswordAction(staffId: string) {
  const { user, business } = await requireBusinessContext();
  const existing = findStaffById(staffId);
  if (!existing || existing.businessId !== business.id) throw new Error("Çalışan bulunamadı.");
  if (!existing.userId) throw new Error("Bu çalışanın panel girişi yok.");

  const generatedPassword = generateTempPassword();
  const passwordHash = await hashPassword(generatedPassword);
  updateUserPassword(existing.userId, passwordHash);

  recordAuditLog({ businessId: business.id, actorUserId: user.id, action: "staff.password_reset", entityType: "staff", entityId: staffId });
  return { generatedPassword };
}

export async function fetchStaffDetailAction(staffId: string) {
  const { business } = await requireBusinessContext();
  const staff = findStaffById(staffId);
  if (!staff || staff.businessId !== business.id) throw new Error("Çalışan bulunamadı.");
  const workingHours = listStaffWorkingHours(staffId);
  const serviceIds = listServiceIdsForStaff(staffId);
  const earnings = calculateStaffEarnings(staffId);
  return { staff, workingHours, serviceIds, earnings };
}

export interface WorkingHourInput {
  weekday: number;
  isOff: boolean;
  startTime: string | null;
  endTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
}

export async function saveStaffWorkingHoursAction(staffId: string, hours: WorkingHourInput[]) {
  const { business } = await requireBusinessContext();
  const existing = findStaffById(staffId);
  if (!existing || existing.businessId !== business.id) throw new Error("Çalışan bulunamadı.");
  setStaffWorkingHours(staffId, hours);
  revalidateStaffViews();
}

export async function clearStaffWorkingHoursAction(staffId: string) {
  const { business } = await requireBusinessContext();
  const existing = findStaffById(staffId);
  if (!existing || existing.businessId !== business.id) throw new Error("Çalışan bulunamadı.");
  setStaffWorkingHours(staffId, []);
  revalidateStaffViews();
}
