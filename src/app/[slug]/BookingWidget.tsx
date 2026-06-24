"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, ChevronLeft, Clock, Loader2, ShieldCheck, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { cn, formatCurrencyTRY } from "@/lib/utils";
import { addDaysKey, combineDateTime, formatDateShortTR, formatDateTimeTR, isoWeekday, todayKey } from "@/lib/date";
import { WEEKDAY_LABELS_SHORT } from "@/lib/types";
import type { PublicPageSettings, Service, ServiceCategory, Staff } from "@/lib/types";
import type { AvailableSlot } from "@/lib/availability";
import { createPublicAppointmentAction, fetchPublicSlotsAction, type CreatePublicAppointmentResult } from "./actions";

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: "Hizmet",
  2: "Personel",
  3: "Tarih & Saat",
  4: "Bilgilerin",
};

function dateChipLabel(dateKey: string): { weekday: string; day: string } {
  const d = new Date(combineDateTime(dateKey, "12:00"));
  return { weekday: WEEKDAY_LABELS_SHORT[isoWeekday(d)], day: formatDateShortTR(combineDateTime(dateKey, "12:00")) };
}

export function BookingWidget({
  slug,
  services,
  categories,
  staff,
  serviceStaffMap,
  settings,
}: {
  slug: string;
  services: Service[];
  categories: ServiceCategory[];
  staff: Staff[];
  serviceStaffMap: Record<string, string[]>;
  settings: PublicPageSettings;
}) {
  const [step, setStep] = useState<Step>(1);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [dateKey, setDateKey] = useState(() => todayKey());
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [kvkkConsent, setKvkkConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatePublicAppointmentResult | null>(null);
  const [submitting, startSubmit] = useTransition();

  const service = useMemo(() => services.find((s) => s.id === serviceId) ?? null, [services, serviceId]);
  const eligibleStaff = useMemo(() => {
    if (!serviceId) return [];
    const ids = new Set(serviceStaffMap[serviceId] ?? []);
    return staff.filter((s) => ids.has(s.id));
  }, [serviceId, serviceStaffMap, staff]);
  const dateOptions = useMemo(() => {
    const today = todayKey();
    return Array.from({ length: settings.bookingWindowDays + 1 }, (_, i) => addDaysKey(today, i));
  }, [settings.bookingWindowDays]);

  useEffect(() => {
    if (step !== 3 || !serviceId) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSelectedSlot(null);
    fetchPublicSlotsAction({ slug, serviceId, staffId, dateKey })
      .then((res) => {
        if (!cancelled) setSlots(res);
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
  }, [step, slug, serviceId, staffId, dateKey]);

  function handleSelectService(id: string) {
    setServiceId(id);
    setError(null);
    const ids = serviceStaffMap[id] ?? [];
    if (ids.length <= 1) {
      setStaffId(ids[0] ?? null);
      setStep(3);
    } else {
      setStaffId(null);
      setStep(2);
    }
  }

  function handleSelectStaff(id: string | null) {
    setStaffId(id);
    setStep(3);
  }

  function goBack() {
    setError(null);
    if (step === 4) {
      setStep(3);
    } else if (step === 3) {
      const ids = serviceId ? serviceStaffMap[serviceId] ?? [] : [];
      setStep(ids.length <= 1 ? 1 : 2);
    } else if (step === 2) {
      setStep(1);
    }
  }

  function handleSubmit() {
    setError(null);
    if (!service || !selectedSlot) return;
    if (!fullName.trim() || !phone.trim()) {
      setError("Ad Soyad ve telefon numarası zorunludur.");
      return;
    }
    if (!kvkkConsent) {
      setError("Devam etmek için KVKK metnini onaylamalısın.");
      return;
    }
    startSubmit(async () => {
      try {
        const res = await createPublicAppointmentAction({
          slug,
          serviceId: service.id,
          staffId: selectedSlot.staffId,
          startAt: selectedSlot.startAt,
          endAt: selectedSlot.endAt,
          fullName,
          phone,
          customerNote: note || null,
          kvkkConsent,
        });
        setResult(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Randevu oluşturulamadı.");
      }
    });
  }

  function handleReset() {
    setStep(1);
    setServiceId(null);
    setStaffId(null);
    setDateKey(todayKey());
    setSlots([]);
    setSelectedSlot(null);
    setFullName("");
    setPhone("");
    setNote("");
    setKvkkConsent(false);
    setError(null);
    setResult(null);
  }

  if (result) {
    const slotStaff = staff.find((s) => s.id === selectedSlot?.staffId);
    return (
      <div className="rounded-2xl border border-navy-100 bg-white p-6 text-center shadow-card sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <Check className="h-7 w-7 text-emerald-600" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-navy-900">
          {result.status === "confirmed" ? "Randevunuz Onaylandı!" : "Randevu Talebiniz Alındı"}
        </h2>
        <p className="mt-1.5 text-sm text-navy-500">
          {result.status === "confirmed"
            ? "Randevunuz oluşturuldu, sizi bekliyoruz."
            : "İşletme onayladığında size bilgi verilecek."}
        </p>
        <div className="mx-auto mt-5 max-w-sm space-y-1.5 rounded-xl border border-navy-50 bg-navy-50/40 p-4 text-left text-sm">
          <p className="font-medium text-navy-900">{service?.name}</p>
          <p className="text-navy-600">{formatDateTimeTR(result.startAt)}</p>
          <p className="text-navy-600">{slotStaff ? slotStaff.fullName : "Personel işletme tarafından atanacak"}</p>
        </div>
        <Button className="mt-6" onClick={handleReset}>
          Yeni Randevu Oluştur
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-navy-100 bg-white shadow-card">
      <div className="flex items-center gap-2 overflow-x-auto border-b border-navy-50 px-5 py-3.5 text-xs font-medium">
        {([1, 2, 3, 4] as Step[]).map((s, i) => (
          <span key={s} className="flex items-center gap-2 whitespace-nowrap">
            {i > 0 && <span className="text-navy-200">›</span>}
            <span className={cn(s === step ? "text-violet-600" : s < step ? "text-navy-500" : "text-navy-300")}>
              {s}. {STEP_LABELS[s]}
            </span>
          </span>
        ))}
      </div>

      <div className="p-5 sm:p-6">
        {step > 1 && (
          <button
            type="button"
            onClick={goBack}
            className="mb-4 flex items-center gap-1 text-sm font-medium text-navy-500 hover:text-navy-700"
          >
            <ChevronLeft className="h-4 w-4" /> Geri
          </button>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-navy-900">Bir hizmet seçin</h2>
            {categories.length > 0 ? (
              categories.map((cat) => {
                const catServices = services.filter((s) => s.categoryId === cat.id);
                if (catServices.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">{cat.name}</p>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {catServices.map((s) => (
                        <ServiceCard key={s.id} service={s} onSelect={() => handleSelectService(s.id)} />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {services
                  .filter((s) => !s.categoryId)
                  .map((s) => (
                    <ServiceCard key={s.id} service={s} onSelect={() => handleSelectService(s.id)} />
                  ))}
              </div>
            )}
            {categories.length > 0 && services.filter((s) => !s.categoryId).length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">Diğer</p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {services
                    .filter((s) => !s.categoryId)
                    .map((s) => (
                      <ServiceCard key={s.id} service={s} onSelect={() => handleSelectService(s.id)} />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-navy-900">Personel tercihin</h2>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleSelectStaff(null)}
                className="flex items-center gap-3 rounded-xl border border-navy-200 px-4 py-3 text-left transition-colors hover:border-violet-300 hover:bg-violet-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy-500">
                  <Users className="h-4.5 w-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-navy-900">Farketmez</span>
                  <span className="block text-xs text-navy-400">En uygun personel atanır</span>
                </span>
              </button>
              {eligibleStaff.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectStaff(s.id)}
                  className="flex items-center gap-3 rounded-xl border border-navy-200 px-4 py-3 text-left transition-colors hover:border-violet-300 hover:bg-violet-50"
                >
                  <Avatar name={s.fullName} />
                  <span>
                    <span className="block text-sm font-medium text-navy-900">{s.fullName}</span>
                    {s.title && <span className="block text-xs text-navy-400">{s.title}</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-navy-900">Tarih ve saat seç</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dateOptions.map((key) => {
                const { weekday, day } = dateChipLabel(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDateKey(key)}
                    className={cn(
                      "flex shrink-0 flex-col items-center rounded-xl border px-3.5 py-2 text-center transition-colors",
                      dateKey === key
                        ? "border-violet-600 bg-violet-600 text-white"
                        : "border-navy-200 text-navy-700 hover:border-violet-300 hover:bg-violet-50"
                    )}
                  >
                    <span className="text-[11px] font-medium uppercase opacity-80">{weekday}</span>
                    <span className="text-sm font-semibold">{day}</span>
                  </button>
                );
              })}
            </div>

            {loadingSlots ? (
              <div className="flex items-center gap-2 py-6 text-sm text-navy-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Uygun saatler yükleniyor...
              </div>
            ) : slots.length === 0 ? (
              <p className="rounded-xl border border-dashed border-navy-200 bg-navy-50/40 px-4 py-6 text-center text-sm text-navy-500">
                Bu tarihte uygun saat bulunamadı, başka bir tarih seçmeyi dene.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={`${slot.time}-${slot.staffId ?? "venue"}`}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slot);
                      setStep(4);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-navy-200 px-3.5 py-2 text-sm font-medium text-navy-700 transition-colors hover:border-violet-300 hover:bg-violet-50"
                  >
                    <Clock className="h-3.5 w-3.5 text-navy-400" /> {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && service && selectedSlot && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-navy-900">Bilgilerini gir</h2>
            <div className="rounded-xl border border-navy-50 bg-navy-50/40 p-3.5 text-sm text-navy-600">
              <p className="font-medium text-navy-900">{service.name}</p>
              <p>
                {formatDateTimeTR(selectedSlot.startAt)} &middot; {formatCurrencyTRY(service.price)}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Ad Soyad</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Adınız Soyadınız" />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XX XXX XX XX" />
              </div>
            </div>
            <div>
              <Label>Not (opsiyonel)</Label>
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="İşletmeye iletmek istediğin bir not var mı?" />
            </div>

            {settings.depositEnabled && (
              <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-700">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Bu hizmet için işletme randevu sırasında depozito talep edebilir.</span>
              </div>
            )}

            {settings.cancellationPolicy && (
              <p className="text-xs text-navy-400">{settings.cancellationPolicy}</p>
            )}

            <label className="flex items-start gap-2.5 rounded-xl border border-navy-100 px-3.5 py-3 text-xs text-navy-500">
              <input
                type="checkbox"
                checked={kvkkConsent}
                onChange={(e) => setKvkkConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-navy-300 text-violet-600 focus:ring-violet-200"
              />
              <span className="flex items-start gap-1.5">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy-400" />
                {settings.kvkkText}
              </span>
            </label>

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}

            <Button className="w-full" size="lg" loading={submitting} onClick={handleSubmit}>
              Randevuyu Onayla
            </Button>
          </div>
        )}

        {error && step !== 4 && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      </div>
    </div>
  );
}

function ServiceCard({ service, onSelect }: { service: Service; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex items-center justify-between gap-3 rounded-xl border border-navy-200 px-4 py-3.5 text-left transition-colors hover:border-violet-300 hover:bg-violet-50"
    >
      <span>
        <span className="block text-sm font-medium text-navy-900">{service.name}</span>
        <span className="block text-xs text-navy-400">{service.durationMinutes} dk</span>
      </span>
      <span className="shrink-0 text-sm font-semibold text-navy-900">{formatCurrencyTRY(service.price)}</span>
    </button>
  );
}
