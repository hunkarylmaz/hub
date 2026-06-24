"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Label } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/utils";
import type { Service, ServiceCategory, Staff } from "@/lib/types";
import { createServiceAction, updateServiceAction } from "./actions";

const COLOR_OPTIONS = ["#7C3AED", "#EC4899", "#3B82F6", "#F59E0B", "#10B981"];

interface FormState {
  name: string;
  categoryId: string;
  description: string;
  durationMinutes: string;
  bufferMinutes: string;
  price: string;
  color: string;
  isOnlineBookable: boolean;
  requiresDeposit: boolean;
  depositAmount: string;
  isActive: boolean;
  staffIds: string[];
}

function emptyForm(): FormState {
  return {
    name: "",
    categoryId: "",
    description: "",
    durationMinutes: "30",
    bufferMinutes: "0",
    price: "",
    color: COLOR_OPTIONS[0],
    isOnlineBookable: true,
    requiresDeposit: false,
    depositAmount: "",
    isActive: true,
    staffIds: [],
  };
}

export function ServiceModal({
  open,
  onClose,
  service,
  categories,
  staff,
  assignedStaffIds,
}: {
  open: boolean;
  onClose: () => void;
  service: Service | null;
  categories: ServiceCategory[];
  staff: Staff[];
  assignedStaffIds: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (service) {
      setForm({
        name: service.name,
        categoryId: service.categoryId ?? "",
        description: service.description ?? "",
        durationMinutes: String(service.durationMinutes),
        bufferMinutes: String(service.bufferMinutes),
        price: String(service.price),
        color: service.color,
        isOnlineBookable: service.isOnlineBookable,
        requiresDeposit: service.requiresDeposit,
        depositAmount: String(service.depositAmount || ""),
        isActive: service.isActive,
        staffIds: assignedStaffIds,
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, service, assignedStaffIds]);

  if (!open) return null;

  function toggleStaff(staffId: string) {
    setForm((f) => ({
      ...f,
      staffIds: f.staffIds.includes(staffId) ? f.staffIds.filter((id) => id !== staffId) : [...f.staffIds, staffId],
    }));
  }

  function handleSubmit() {
    setError(null);
    if (!form.name.trim()) {
      setError("Hizmet adı zorunludur.");
      return;
    }
    const duration = Number(form.durationMinutes);
    if (!duration || duration <= 0) {
      setError("Süre 0'dan büyük olmalıdır.");
      return;
    }
    const price = Number(form.price);
    if (Number.isNaN(price) || price < 0) {
      setError("Geçerli bir fiyat girin.");
      return;
    }

    const input = {
      name: form.name,
      categoryId: form.categoryId || null,
      description: form.description || null,
      durationMinutes: duration,
      bufferMinutes: Number(form.bufferMinutes) || 0,
      price,
      color: form.color,
      isOnlineBookable: form.isOnlineBookable,
      requiresDeposit: form.requiresDeposit,
      depositAmount: form.requiresDeposit ? Number(form.depositAmount) || 0 : 0,
      staffIds: form.staffIds,
    };

    startSubmit(async () => {
      try {
        if (service) {
          await updateServiceAction(service.id, { ...input, isActive: form.isActive });
        } else {
          await createServiceAction(input);
        }
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hizmet kaydedilemedi.");
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={service ? "Hizmeti Düzenle" : "Yeni Hizmet"} size="lg">
      <div className="space-y-4">
        <div>
          <Label>Hizmet Adı</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Cilt Bakımı" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Kategori</Label>
            <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Kategorisiz</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Renk</Label>
            <div className="flex h-10 items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  style={{ backgroundColor: c }}
                  className={cn(
                    "h-6 w-6 rounded-full transition-shadow",
                    form.color === c ? "ring-2 ring-navy-900 ring-offset-2" : "ring-1 ring-navy-200"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label>Açıklama</Label>
          <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Müşteriye gösterilecek kısa açıklama..." />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Süre (dk)</Label>
            <Input type="number" min={5} step={5} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
          </div>
          <div>
            <Label>Tampon Süre (dk)</Label>
            <Input type="number" min={0} step={5} value={form.bufferMinutes} onChange={(e) => setForm({ ...form, bufferMinutes: e.target.value })} />
          </div>
          <div>
            <Label>Fiyat (TRY)</Label>
            <Input type="number" min={0} step={50} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-navy-100 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-navy-900">Online Randevuda Görünsün</p>
            <p className="text-xs text-navy-400">Kapalıysa bu hizmet sadece panelden randevulanabilir.</p>
          </div>
          <Switch checked={form.isOnlineBookable} onChange={(v) => setForm({ ...form, isOnlineBookable: v })} />
        </div>

        <div className="rounded-xl border border-navy-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-navy-900">Kapora Gerektirsin</p>
              <p className="text-xs text-navy-400">Online randevuda ön ödeme istenir.</p>
            </div>
            <Switch checked={form.requiresDeposit} onChange={(v) => setForm({ ...form, requiresDeposit: v })} />
          </div>
          {form.requiresDeposit && (
            <div className="mt-3">
              <Label>Kapora Tutarı (TRY)</Label>
              <div className="w-40">
                <Input type="number" min={0} step={50} value={form.depositAmount} onChange={(e) => setForm({ ...form, depositAmount: e.target.value })} />
              </div>
            </div>
          )}
        </div>

        {service && (
          <div className="flex items-center justify-between rounded-xl border border-navy-100 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-navy-900">Hizmet Aktif</p>
              <p className="text-xs text-navy-400">Pasif hizmetler randevu oluştururken seçilemez.</p>
            </div>
            <Switch checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
          </div>
        )}

        <div>
          <Label>Bu Hizmeti Verebilen Çalışanlar</Label>
          {staff.length === 0 ? (
            <p className="text-sm text-navy-400">Henüz aktif çalışan yok.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {staff.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-2 rounded-xl border border-navy-100 px-3 py-2 text-sm text-navy-700"
                >
                  <input
                    type="checkbox"
                    checked={form.staffIds.includes(member.id)}
                    onChange={() => toggleStaff(member.id)}
                    className="h-4 w-4 rounded border-navy-300 text-violet-600 focus:ring-violet-200"
                  />
                  {member.fullName}
                </label>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            Hizmeti Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
}
