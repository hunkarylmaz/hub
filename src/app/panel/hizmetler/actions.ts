"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext } from "@/lib/session";
import {
  createCategory,
  createService,
  updateService,
  findServiceById,
  setServiceStaff,
  type ServiceInput,
} from "@/lib/db/repo/services";
import { recordAuditLog } from "@/lib/db/repo/auditLogs";

function revalidateServiceViews() {
  revalidatePath("/panel/hizmetler");
  revalidatePath("/panel/takvim");
  revalidatePath("/panel/randevular");
}

export async function createCategoryAction(name: string, color?: string) {
  const { business } = await requireBusinessContext();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Kategori adı zorunludur.");
  const category = createCategory(business.id, trimmed, color);
  revalidateServiceViews();
  return category;
}

export interface ServiceFormInput extends ServiceInput {
  staffIds: string[];
}

export async function createServiceAction(input: ServiceFormInput) {
  const { user, business } = await requireBusinessContext();
  const name = input.name.trim();
  if (!name) throw new Error("Hizmet adı zorunludur.");
  if (input.durationMinutes <= 0) throw new Error("Süre 0'dan büyük olmalıdır.");

  const { staffIds, ...serviceInput } = input;
  const service = createService(business.id, { ...serviceInput, name });
  setServiceStaff(service.id, staffIds);

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "service.created",
    entityType: "service",
    entityId: service.id,
  });

  revalidateServiceViews();
  return service;
}

export async function updateServiceAction(serviceId: string, input: Partial<ServiceFormInput> & { isActive?: boolean }) {
  const { user, business } = await requireBusinessContext();
  const existing = findServiceById(serviceId);
  if (!existing || existing.businessId !== business.id) throw new Error("Hizmet bulunamadı.");

  const { staffIds, ...serviceInput } = input;
  const updated = updateService(serviceId, serviceInput);
  if (staffIds) setServiceStaff(serviceId, staffIds);

  recordAuditLog({
    businessId: business.id,
    actorUserId: user.id,
    action: "service.updated",
    entityType: "service",
    entityId: serviceId,
  });

  revalidateServiceViews();
  return updated;
}

export async function toggleServiceActiveAction(serviceId: string, isActive: boolean) {
  const { business } = await requireBusinessContext();
  const existing = findServiceById(serviceId);
  if (!existing || existing.businessId !== business.id) throw new Error("Hizmet bulunamadı.");
  const updated = updateService(serviceId, { isActive });
  revalidateServiceViews();
  return updated;
}
