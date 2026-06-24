"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Building2,
  Sparkles,
  Users,
  Clock,
  Rocket,
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { LogoMark } from "@/components/brand/Logo";
import { cn, formatCurrencyTRY } from "@/lib/utils";
import { normalizeSlug } from "@/lib/slug";
import { SECTORS, WEEKDAY_LABELS } from "@/lib/types";
import {
  checkSlugAvailability,
  completeOnboardingAction,
  type OnboardingPayload,
  type OnboardingServiceInput,
  type OnboardingStaffInput,
  type OnboardingHourInput,
} from "./actions";

const DRAFT_KEY = "rezervasyo.onboarding.draft.v1";

const STEPS = [
  { title: "İşletme Bilgileri", description: "Temel bilgileriniz ve adresiniz", icon: Building2 },
  { title: "Hizmetler", description: "Müşterilerinizin randevu alabileceği hizmetler", icon: Sparkles },
  { title: "Çalışanlar", description: "Ekibiniz (isteğe bağlı, atlayabilirsiniz)", icon: Users },
  { title: "Çalışma Saatleri", description: "Haftalık çalışma takviminiz", icon: Clock },
  { title: "Önizleme & Yayınla", description: "Son kontrol ve randevu sayfanızı yayınlayın", icon: Rocket },
] as const;

type BusinessForm = OnboardingPayload["business"];

const DEFAULT_BUSINESS: BusinessForm = {
  name: "",
  slug: "",
  sector: SECTORS[0].value,
  phone: "",
  email: "",
  city: "",
  district: "",
  address: "",
  description: "",
};

const emptyService = (): OnboardingServiceInput => ({ name: "", durationMinutes: 30, bufferMinutes: 0, price: 0 });
const emptyStaff = (): OnboardingStaffInput => ({ fullName: "", title: "", phone: "" });

const DEFAULT_HOURS: OnboardingHourInput[] = WEEKDAY_LABELS.map((_, weekday) => ({
  weekday,
  isClosed: weekday === 6,
  openTime: weekday === 6 ? null : "09:00",
  closeTime: weekday === 6 ? null : "19:00",
}));

export function OnboardingWizard({ ownerName }: { ownerName: string }) {
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(0);
  const [business, setBusiness] = useState<BusinessForm>(DEFAULT_BUSINESS);
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugCheck, setSlugCheck] = useState<{ checking: boolean; available: boolean | null; reason: string | null }>({
    checking: false,
    available: null,
    reason: null,
  });
  const [services, setServices] = useState<OnboardingServiceInput[]>([emptyService()]);
  const [staff, setStaff] = useState<OnboardingStaffInput[]>([emptyStaff()]);
  const [hours, setHours] = useState<OnboardingHourInput[]>(DEFAULT_HOURS);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.business) setBusiness(draft.business);
        if (draft.services?.length) setServices(draft.services);
        if (draft.staff?.length) setStaff(draft.staff);
        if (draft.hours?.length) setHours(draft.hours);
        if (typeof draft.step === "number") setStep(draft.step);
        if (typeof draft.slugTouched === "boolean") setSlugTouched(draft.slugTouched);
      }
    } catch {
      // corrupt draft, ignore and start fresh
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ business, services, staff, hours, step, slugTouched }));
    } catch {
      // storage unavailable, ignore
    }
  }, [hydrated, business, services, staff, hours, step, slugTouched]);

  useEffect(() => {
    if (slugTouched) return;
    setBusiness((b) => (b.name ? { ...b, slug: normalizeSlug(b.name) } : b));
  }, [business.name, slugTouched]);

  useEffect(() => {
    if (!business.slug) {
      setSlugCheck({ checking: false, available: null, reason: null });
      return;
    }
    setSlugCheck((s) => ({ ...s, checking: true }));
    const handle = setTimeout(() => {
      checkSlugAvailability(business.slug).then((result) => {
        setSlugCheck({ checking: false, available: result.available, reason: result.reason ?? null });
      });
    }, 450);
    return () => clearTimeout(handle);
  }, [business.slug]);

  function updateService(index: number, patch: Partial<OnboardingServiceInput>) {
    setServices((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function updateStaffRow(index: number, patch: Partial<OnboardingStaffInput>) {
    setStaff((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function updateHour(weekday: number, patch: Partial<OnboardingHourInput>) {
    setHours((rows) => rows.map((row) => (row.weekday === weekday ? { ...row, ...patch } : row)));
  }

  const hasValidName = business.name.trim().length > 0;
  const slugReady = business.slug.length > 0 && slugCheck.available === true;
  const hasService = services.some((s) => s.name.trim().length > 0);
  const stepValid = [hasValidName && slugReady, hasService, true, true, true][step];

  function goNext() {
    if (step < STEPS.length - 1 && stepValid) setStep((s) => s + 1);
  }
  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  function handlePublish() {
    setSubmitError(null);
    const payload: OnboardingPayload = {
      business,
      services: services.filter((s) => s.name.trim()),
      staff: staff.filter((s) => s.fullName.trim()),
      hours,
    };
    startTransition(async () => {
      try {
        await completeOnboardingAction(payload);
        sessionStorage.removeItem(DRAFT_KEY);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Bir hata oluştu, lütfen tekrar deneyin.";
        setSubmitError(message);
        toast.error(message);
      }
    });
  }

  return (
    <div className="min-h-screen bg-surface-subtle">
      <header className="border-b border-navy-100 bg-white">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold text-navy-900">
            <LogoMark className="h-7 w-7" />
            Rezervasyo
          </Link>
          <p className="hidden text-sm text-navy-500 sm:block">Hoş geldin, {ownerName.split(" ")[0]}</p>
        </div>
      </header>

      <main className="container max-w-3xl py-10">
        <div className="mb-8 flex items-center justify-center">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  i < step ? "bg-violet-600 text-white" : i === step ? "bg-navy-900 text-white" : "bg-navy-100 text-navy-400"
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("h-px w-6 sm:w-12", i < step ? "bg-violet-300" : "bg-navy-200")} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-navy-900 sm:text-2xl">{STEPS[step].title}</h1>
              <p className="mt-1 text-sm text-navy-500">{STEPS[step].description}</p>
            </div>

            {step === 0 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="biz-name">İşletme Adı</Label>
                    <Input
                      id="biz-name"
                      value={business.name}
                      onChange={(e) => setBusiness((b) => ({ ...b, name: e.target.value }))}
                      placeholder="Örn. Nova Güzellik Salonu"
                    />
                  </div>
                  <div>
                    <Label htmlFor="biz-sector">Sektör</Label>
                    <Select
                      id="biz-sector"
                      value={business.sector}
                      onChange={(e) => setBusiness((b) => ({ ...b, sector: e.target.value }))}
                    >
                      {SECTORS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="biz-slug">Randevu Adresiniz</Label>
                  <div className="flex h-10 items-center rounded-xl border border-navy-200 bg-white pl-3.5 pr-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
                    <span className="select-none text-sm text-navy-400">rezervasyo.com/</span>
                    <input
                      id="biz-slug"
                      value={business.slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setBusiness((b) => ({ ...b, slug: normalizeSlug(e.target.value) }));
                      }}
                      placeholder="isletme-adiniz"
                      className="h-full w-full bg-transparent text-sm text-navy-900 outline-none placeholder:text-navy-400"
                    />
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                      {slugCheck.checking && <Loader2 className="h-4 w-4 animate-spin text-navy-400" />}
                      {!slugCheck.checking && slugCheck.available === true && <Check className="h-4 w-4 text-emerald-600" />}
                      {!slugCheck.checking && slugCheck.available === false && <X className="h-4 w-4 text-red-500" />}
                    </span>
                  </div>
                  {slugCheck.available === false && slugCheck.reason ? (
                    <FieldError>{slugCheck.reason}</FieldError>
                  ) : slugCheck.available === true ? (
                    <p className="mt-1.5 text-xs font-medium text-emerald-600">Bu adres kullanılabilir.</p>
                  ) : (
                    <p className="mt-1.5 text-xs text-navy-400">Müşterileriniz randevu sayfanıza bu adresten ulaşacak.</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="biz-phone">Telefon</Label>
                    <Input
                      id="biz-phone"
                      type="tel"
                      value={business.phone}
                      onChange={(e) => setBusiness((b) => ({ ...b, phone: e.target.value }))}
                      placeholder="05XX XXX XX XX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="biz-email">E-posta</Label>
                    <Input
                      id="biz-email"
                      type="email"
                      value={business.email}
                      onChange={(e) => setBusiness((b) => ({ ...b, email: e.target.value }))}
                      placeholder="isletme@ornek.com"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="biz-city">Şehir</Label>
                    <Input
                      id="biz-city"
                      value={business.city}
                      onChange={(e) => setBusiness((b) => ({ ...b, city: e.target.value }))}
                      placeholder="İstanbul"
                    />
                  </div>
                  <div>
                    <Label htmlFor="biz-district">İlçe</Label>
                    <Input
                      id="biz-district"
                      value={business.district}
                      onChange={(e) => setBusiness((b) => ({ ...b, district: e.target.value }))}
                      placeholder="Kadıköy"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="biz-address">Açık Adres</Label>
                  <Textarea
                    id="biz-address"
                    rows={2}
                    value={business.address}
                    onChange={(e) => setBusiness((b) => ({ ...b, address: e.target.value }))}
                    placeholder="Mahalle, cadde, kapı no..."
                  />
                </div>

                <div>
                  <Label htmlFor="biz-description">Tanıtım Yazısı</Label>
                  <Textarea
                    id="biz-description"
                    rows={3}
                    value={business.description}
                    onChange={(e) => setBusiness((b) => ({ ...b, description: e.target.value }))}
                    placeholder="İşletmeniz hakkında müşterilerinizin göreceği kısa bir tanıtım yazısı"
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                {services.map((service, i) => (
                  <div key={i} className="flex flex-wrap items-end gap-3 rounded-xl border border-navy-100 p-3 sm:flex-nowrap">
                    <div className="min-w-[180px] flex-1">
                      <Label>Hizmet Adı</Label>
                      <Input
                        value={service.name}
                        onChange={(e) => updateService(i, { name: e.target.value })}
                        placeholder="Örn. Saç Kesimi"
                      />
                    </div>
                    <div className="w-28">
                      <Label>Süre (dk)</Label>
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        value={service.durationMinutes}
                        onChange={(e) => updateService(i, { durationMinutes: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="w-28">
                      <Label>Tampon (dk)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={5}
                        value={service.bufferMinutes}
                        onChange={(e) => updateService(i, { bufferMinutes: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="w-32">
                      <Label>Fiyat (₺)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={10}
                        value={service.price}
                        onChange={(e) => updateService(i, { price: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setServices((rows) => (rows.length <= 1 ? rows : rows.filter((_, idx) => idx !== i)))}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-navy-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Hizmeti sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setServices((rows) => [...rows, emptyService()])}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50"
                >
                  <Plus className="h-4 w-4" /> Hizmet ekle
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-navy-500">
                  Hizmetleri siz tek başınıza veriyorsanız bu adımı boş geçebilir, ileride çalışanlarınızı panelden ekleyebilirsiniz.
                </p>
                {staff.map((member, i) => (
                  <div key={i} className="flex flex-wrap items-end gap-3 rounded-xl border border-navy-100 p-3 sm:flex-nowrap">
                    <div className="min-w-[180px] flex-1">
                      <Label>Ad Soyad</Label>
                      <Input
                        value={member.fullName}
                        onChange={(e) => updateStaffRow(i, { fullName: e.target.value })}
                        placeholder="Örn. Ayşe Yılmaz"
                      />
                    </div>
                    <div className="w-40">
                      <Label>Unvan</Label>
                      <Input
                        value={member.title}
                        onChange={(e) => updateStaffRow(i, { title: e.target.value })}
                        placeholder="Örn. Kuaför"
                      />
                    </div>
                    <div className="w-40">
                      <Label>Telefon</Label>
                      <Input
                        type="tel"
                        value={member.phone}
                        onChange={(e) => updateStaffRow(i, { phone: e.target.value })}
                        placeholder="05XX XXX XX XX"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setStaff((rows) => (rows.length <= 1 ? rows : rows.filter((_, idx) => idx !== i)))}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-navy-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Çalışanı sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setStaff((rows) => [...rows, emptyStaff()])}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50"
                >
                  <Plus className="h-4 w-4" /> Çalışan ekle
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2">
                {hours.map((hour) => (
                  <div key={hour.weekday} className="flex flex-wrap items-center gap-4 rounded-xl border border-navy-100 px-4 py-3">
                    <span className="w-24 text-sm font-medium text-navy-900">{WEEKDAY_LABELS[hour.weekday]}</span>
                    <Switch
                      checked={!hour.isClosed}
                      onChange={(checked) =>
                        updateHour(hour.weekday, {
                          isClosed: !checked,
                          openTime: checked ? hour.openTime ?? "09:00" : null,
                          closeTime: checked ? hour.closeTime ?? "19:00" : null,
                        })
                      }
                      label={hour.isClosed ? "Kapalı" : "Açık"}
                    />
                    {hour.isClosed ? (
                      <span className="text-sm text-navy-400">Kapalı</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={hour.openTime ?? "09:00"}
                          onChange={(e) => updateHour(hour.weekday, { openTime: e.target.value })}
                          className="h-9 rounded-lg border border-navy-200 px-2.5 text-sm text-navy-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                        />
                        <span className="text-sm text-navy-400">—</span>
                        <input
                          type="time"
                          value={hour.closeTime ?? "19:00"}
                          onChange={(e) => updateHour(hour.weekday, { closeTime: e.target.value })}
                          className="h-9 rounded-lg border border-navy-200 px-2.5 text-sm text-navy-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div className="rounded-xl border border-navy-100 p-4">
                  <h3 className="text-sm font-semibold text-navy-900">{business.name}</h3>
                  <p className="mt-0.5 text-sm text-navy-500">rezervasyo.com/{business.slug}</p>
                  <p className="mt-2 text-sm text-navy-600">
                    {[business.district, business.city].filter(Boolean).join(", ") || "Adres belirtilmedi"}
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-semibold text-navy-900">Hizmetler ({services.filter((s) => s.name.trim()).length})</h4>
                  <div className="space-y-1.5">
                    {services
                      .filter((s) => s.name.trim())
                      .map((s, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-navy-50/60 px-3 py-2 text-sm">
                          <span className="text-navy-700">
                            {s.name} <span className="text-navy-400">· {s.durationMinutes} dk</span>
                          </span>
                          <span className="font-medium text-navy-900">{formatCurrencyTRY(s.price)}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {staff.some((s) => s.fullName.trim()) && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-navy-900">Çalışanlar ({staff.filter((s) => s.fullName.trim()).length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {staff
                        .filter((s) => s.fullName.trim())
                        .map((s, i) => (
                          <span key={i} className="rounded-full bg-navy-50/60 px-3 py-1.5 text-sm text-navy-700">
                            {s.fullName}
                            {s.title ? ` · ${s.title}` : ""}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="mb-2 text-sm font-semibold text-navy-900">Çalışma Saatleri</h4>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {hours.map((h) => (
                      <div key={h.weekday} className="rounded-lg bg-navy-50/60 px-2.5 py-1.5 text-xs text-navy-600">
                        <span className="font-medium text-navy-800">{WEEKDAY_LABELS[h.weekday]}</span>
                        <br />
                        {h.isClosed ? "Kapalı" : `${h.openTime}–${h.closeTime}`}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="rounded-xl bg-violet-50 px-4 py-3 text-xs text-violet-700">
                  Yayınla butonuna bastığınızda işletmeniz oluşturulacak, 14 günlük ücretsiz deneme süreniz başlayacak ve randevu
                  sayfanız hemen kullanıma açılacaktır.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          {step === 0 ? (
            <span />
          ) : (
            <Button variant="outline" onClick={goBack} disabled={isPending}>
              <ArrowLeft className="h-4 w-4" /> Geri
            </Button>
          )}
          <span className="text-xs font-medium text-navy-400">
            Adım {step + 1} / {STEPS.length}
          </span>
          {step < STEPS.length - 1 ? (
            <Button onClick={goNext} disabled={!stepValid}>
              İleri <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handlePublish} loading={isPending} disabled={isPending}>
              <Rocket className="h-4 w-4" /> Yayınla
            </Button>
          )}
        </div>
        {submitError && <p className="mt-3 text-center text-sm font-medium text-red-600">{submitError}</p>}
      </main>
    </div>
  );
}
