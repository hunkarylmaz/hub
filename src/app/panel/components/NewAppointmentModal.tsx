"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Label } from "@/components/ui/Input";
import { cn, formatCurrencyTRY } from "@/lib/utils";
import type { Service, Staff, Customer } from "@/lib/types";
import type { AvailableSlot } from "@/lib/availability";
import { createAppointmentAction, fetchAvailableSlotsAction } from "@/app/panel/randevular/actions";

export function NewAppointmentModal({
  open,
  onClose,
  services,
  staff,
  customers,
  serviceStaffMap,
  defaultDateKey,
  defaultStaffId,
  defaultTime,
}: {
  open: boolean;
  onClose: () => void;
  services: Service[];
  staff: Staff[];
  customers: Customer[];
  serviceStaffMap: Record<string, string[]>;
  defaultDateKey: string;
  defaultStaffId?: string | null;
  defaultTime?: string | null;
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [staffChoice, setStaffChoice] = useState<string>(defaultStaffId ?? "any");
  const [dateKey, setDateKey] = useState(defaultDateKey);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [customerId, setCustomerId] = useState<string>("new");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [price, setPrice] = useState<number>(services[0]?.price ?? 0);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  useEffect(() => {
    if (!open) return;
    const firstService = services[0];
    setServiceId(firstService?.id ?? "");
    setStaffChoice(defaultStaffId ?? "any");
    setDateKey(defaultDateKey);
    setSelectedSlot(null);
    setCustomerId("new");
    setNewName("");
    setNewPhone("");
    setPrice(firstService?.price ?? 0);
    setNote("");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDateKey, defaultStaffId]);

  useEffect(() => {
    const service = services.find((s) => s.id === serviceId);
    if (service) setPrice(service.price);
  }, [serviceId, services]);

  useEffect(() => {
    if (!open || !serviceId) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSelectedSlot(null);
    fetchAvailableSlotsAction({ serviceId, staffId: staffChoice === "any" ? null : staffChoice, dateKey })
      .then((result) => {
        if (cancelled) return;
        setSlots(result);
        if (defaultTime) {
          const match = result.find((s) => s.time === defaultTime);
          if (match) setSelectedSlot(match);
        }
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, serviceId, staffChoice, dateKey, defaultTime]);

  if (!open) return null;

  const eligibleStaffIds = new Set(serviceStaffMap[serviceId] ?? []);
  const eligibleStaff = staff.filter((s) => eligibleStaffIds.has(s.id));

  function handleSubmit() {
    setError(null);
    if (!serviceId) {
      setError("Lütfen bir hizmet seçin.");
      return;
    }
    if (!selectedSlot) {
      setError("Lütfen bir saat seçin.");
      return;
    }
    if (customerId === "new" && (!newName.trim() || !newPhone.trim())) {
      setError("Yeni müşteri için ad ve telefon zorunludur.");
      return;
    }

    startSubmit(async () => {
      try {
        await createAppointmentAction({
          serviceId,
          staffId: selectedSlot.staffId,
          startAt: selectedSlot.startAt,
          endAt: selectedSlot.endAt,
          price,
          customerId: customerId === "new" ? null : customerId,
          newCustomer: customerId === "new" ? { fullName: newName, phone: newPhone } : null,
          internalNote: note || null,
        });
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Randevu oluşturulamadı.");
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Yeni Randevu" description="Müşteri için manuel randevu oluştur" size="lg">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Hizmet</Label>
            <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.durationMinutes} dk
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Personel</Label>
            <Select value={staffChoice} onChange={(e) => setStaffChoice(e.target.value)}>
              <option value="any">Farketmez (en uygun)</option>
              {eligibleStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Tarih</Label>
            <Input type="date" value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
          </div>
          <div>
            <Label>Tutar (₺)</Label>
            <Input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            <p className="mt-1 text-xs text-navy-400">{formatCurrencyTRY(price)}</p>
          </div>
        </div>

        <div>
          <Label>Uygun Saatler</Label>
          {loadingSlots ? (
            <div className="flex items-center gap-2 py-4 text-sm text-navy-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Saatler yükleniyor...
            </div>
          ) : slots.length === 0 ? (
            <p className="rounded-xl border border-dashed border-navy-200 bg-navy-50/40 px-4 py-3 text-sm text-navy-500">
              Bu tarihte uygun saat bulunamadı.
            </p>
          ) : (
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto panel-scrollbar">
              {slots.map((slot) => (
                <button
                  key={`${slot.time}-${slot.staffId ?? "venue"}`}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    selectedSlot?.startAt === slot.startAt && selectedSlot?.staffId === slot.staffId
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-navy-200 text-navy-700 hover:border-violet-300 hover:bg-violet-50"
                  )}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label>Müşteri</Label>
          <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="new">+ Yeni müşteri</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} {c.phone ? `· ${c.phone}` : ""}
              </option>
            ))}
          </Select>
        </div>

        {customerId === "new" && (
          <div className="grid gap-4 rounded-xl border border-navy-100 bg-navy-50/40 p-4 sm:grid-cols-2">
            <div>
              <Label>Ad Soyad</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ayşe Yılmaz" />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="05XX XXX XX XX" />
            </div>
          </div>
        )}

        <div>
          <Label>Not (opsiyonel)</Label>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Dahili not..." />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            Randevuyu Oluştur
          </Button>
        </div>
      </div>
    </Modal>
  );
}
