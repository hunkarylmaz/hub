"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext } from "@/lib/session";
import {
  createStaff,
  updateStaff,
  findStaffById,
  listStaffWorkingHours,
  setStaffWorkingHours,
  type StaffInput,
} from "@/lib/db/repo/staff";
import { listServiceIdsForStaff } from "@/lib/db/repo/services";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";

function revalidateStaffViews() {
  revalidatePath("/panel/calisanlar");
  revalidatePath("/panel/hizmetler");
  revalidatePath("/panel/takvim");
  revalidatePath("/panel/randevular");
}

export async function createStaffAction(input: StaffInput) {
  const { user, business } = await requireBusinessContext();
  const fullName = input.fullName.trim();
  if (!fullName) throw new Error("Ad Soyad zorunludur.");

  const staff = createStaff(business.id, { ...input, fullName });

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "staff.created",
    entityType: "staff",
    entityId: staff.id,
  });

  revalidateStaffViews();
  return staff;
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

export async function fetchStaffDetailAction(staffId: string) {
  const { business } = await requireBusinessContext();
  const staff = findStaffById(staffId);
  if (!staff || staff.businessId !== business.id) throw new Error("Çalışan bulunamadı.");
  const workingHours = listStaffWorkingHours(staffId);
  const serviceIds = listServiceIdsForStaff(staffId);
  return { staff, workingHours, serviceIds };
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
