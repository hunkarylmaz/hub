"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Image as ImageIcon, Images, MapPin, Clock, Check, ShieldCheck, Trash2, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import type { Business, WorkingHour, PublicPageSettings, BusinessImage } from "@/lib/types";
import { SECTORS, WEEKDAY_LABELS } from "@/lib/types";
import {
  updateBusinessProfileAction,
  saveBusinessHoursAction,
  updateBookingSettingsAction,
  addBusinessImageAction,
  deleteBusinessImageAction,
  type BusinessHourInput,
  type BookingSettingsInput,
} from "./actions";

interface HourRow {
  weekday: number;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
  breakStart: string;
  breakEnd: string;
}

function hoursToRows(hours: WorkingHour[]): HourRow[] {
  const rows: HourRow[] = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    isClosed: weekday === 6,
    openTime: "09:00",
    closeTime: "19:00",
    breakStart: "",
    breakEnd: "",
  }));
  for (const h of hours) {
    rows[h.weekday] = {
      weekday: h.weekday,
      isClosed: h.isClosed,
      openTime: h.openTime ?? "",
      closeTime: h.closeTime ?? "",
      breakStart: h.breakStart ?? "",
      breakEnd: h.breakEnd ?? "",
    };
  }
  return rows;
}

export function SayfaAyarlariClient({
  business,
  workingHours,
  pageSettings,
  images,
}: {
  business: Business;
  workingHours: WorkingHour[];
  pageSettings: PublicPageSettings;
  images: BusinessImage[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: business.name,
    sector: business.sector,
    description: business.description ?? "",
    phone: business.phone ?? "",
    email: business.email ?? "",
    city: business.city ?? "",
    district: business.district ?? "",
    address: business.address ?? "",
    instagram: business.instagram ?? "",
    website: business.website ?? "",
    logoUrl: business.logoUrl ?? "",
    coverUrl: business.coverUrl ?? "",
    themeColor: business.themeColor,
  });
  const [hours, setHours] = useState<HourRow[]>(hoursToRows(workingHours));
  const [bookingForm, setBookingForm] = useState<BookingSettingsInput>({
    showAddress: pageSettings.showAddress,
    showPhone: pageSettings.showPhone,
    autoConfirm: pageSettings.autoConfirm,
    depositEnabled: pageSettings.depositEnabled,
    bookingWindowDays: pageSettings.bookingWindowDays,
    minNoticeHours: pageSettings.minNoticeHours,
    cancellationPolicy: pageSettings.cancellationPolicy ?? "",
    kvkkText: pageSettings.kvkkText ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);
  const [bookingSaved, setBookingSaved] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const [savingHours, startSaveHours] = useTransition();
  const [savingBooking, startSaveBooking] = useTransition();

  const [galleryImages, setGalleryImages] = useState<BusinessImage[]>(images);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [addingImage, startAddImage] = useTransition();
  const [removingImageId, setRemovingImageId] = useState<string | null>(null);

  function handleAddImage() {
    setGalleryError(null);
    const url = newImageUrl.trim();
    if (!url) {
      setGalleryError("Görsel adresi zorunludur.");
      return;
    }
    startAddImage(async () => {
      try {
        const updated = await addBusinessImageAction(url);
        setGalleryImages(updated);
        setNewImageUrl("");
      } catch (e) {
        setGalleryError(e instanceof Error ? e.message : "Görsel eklenemedi.");
      }
    });
  }

  async function handleRemoveImage(imageId: string) {
    setGalleryError(null);
    setRemovingImageId(imageId);
    try {
      const updated = await deleteBusinessImageAction(imageId);
      setGalleryImages(updated);
    } catch (e) {
      setGalleryError(e instanceof Error ? e.message : "Görsel silinemedi.");
    } finally {
      setRemovingImageId(null);
    }
  }

  function updateBookingForm(patch: Partial<BookingSettingsInput>) {
    setBookingForm((f) => ({ ...f, ...patch }));
  }

  function handleSaveBooking() {
    setBookingError(null);
    setBookingSaved(false);
    startSaveBooking(async () => {
      try {
        await updateBookingSettingsAction({
          ...bookingForm,
          cancellationPolicy: bookingForm.cancellationPolicy || null,
          kvkkText: bookingForm.kvkkText || null,
        });
        router.refresh();
        setBookingSaved(true);
      } catch (e) {
        setBookingError(e instanceof Error ? e.message : "Randevu kuralları kaydedilemedi.");
      }
    });
  }

  function updateForm(patch: Partial<typeof form>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function updateHourRow(weekday: number, patch: Partial<HourRow>) {
    setHours((rows) => rows.map((r) => (r.weekday === weekday ? { ...r, ...patch } : r)));
  }

  function handleSaveProfile() {
    setError(null);
    setSaved(false);
    if (!form.name.trim()) {
      setError("İşletme adı zorunludur.");
      return;
    }
    startSubmit(async () => {
      try {
        await updateBusinessProfileAction({
          name: form.name,
          sector: form.sector,
          description: form.description || null,
          phone: form.phone || null,
          email: form.email || null,
          city: form.city || null,
          district: form.district || null,
          address: form.address || null,
          instagram: form.instagram || null,
          website: form.website || null,
          logoUrl: form.logoUrl || null,
          coverUrl: form.coverUrl || null,
          themeColor: form.themeColor,
        });
        router.refresh();
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kaydedilemedi.");
      }
    });
  }

  function handleSaveHours() {
    setHoursError(null);
    setHoursSaved(false);
    startSaveHours(async () => {
      try {
        const payload: BusinessHourInput[] = hours.map((h) => ({
          weekday: h.weekday,
          isClosed: h.isClosed,
          openTime: h.isClosed ? null : h.openTime || null,
          closeTime: h.isClosed ? null : h.closeTime || null,
          breakStart: h.isClosed ? null : h.breakStart || null,
          breakEnd: h.isClosed ? null : h.breakEnd || null,
        }));
        await saveBusinessHoursAction(payload);
        router.refresh();
        setHoursSaved(true);
      } catch (e) {
        setHoursError(e instanceof Error ? e.message : "Çalışma saatleri kaydedilemedi.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>İşletme Bilgileri</CardTitle>
            <CardDescription>Müşterilerin online randevu sayfanda göreceği temel bilgiler</CardDescription>
          </div>
          <Globe className="h-5 w-5 shrink-0 text-navy-400" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Randevu Sayfası Adresi</Label>
            <div className="flex h-10 items-center rounded-xl border border-navy-100 bg-navy-50/60 px-3.5 text-sm text-navy-500">
              rezervasyo.com/{business.slug}
            </div>
            <p className="mt-1 text-xs text-navy-400">Adres (slug) işletme oluşturulduktan sonra değiştirilemez.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>İşletme Adı</Label>
              <Input value={form.name} onChange={(e) => updateForm({ name: e.target.value })} />
            </div>
            <div>
              <Label>Sektör</Label>
              <Select value={form.sector} onChange={(e) => updateForm({ sector: e.target.value })}>
                {SECTORS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Açıklama</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => updateForm({ description: e.target.value })}
              placeholder="İşletmeni müşterilerine kısaca tanıt."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>İletişim & Adres</CardTitle>
            <CardDescription>Müşterilerin sana ulaşabileceği bilgiler</CardDescription>
          </div>
          <MapPin className="h-5 w-5 shrink-0 text-navy-400" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={(e) => updateForm({ phone: e.target.value })} placeholder="05XX XXX XX XX" />
            </div>
            <div>
              <Label>E-posta</Label>
              <Input type="email" value={form.email} onChange={(e) => updateForm({ email: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Şehir</Label>
              <Input value={form.city} onChange={(e) => updateForm({ city: e.target.value })} />
            </div>
            <div>
              <Label>İlçe</Label>
              <Input value={form.district} onChange={(e) => updateForm({ district: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Adres</Label>
            <Textarea rows={2} value={form.address} onChange={(e) => updateForm({ address: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Instagram</Label>
              <Input value={form.instagram} onChange={(e) => updateForm({ instagram: e.target.value })} placeholder="@kullaniciadi" />
            </div>
            <div>
              <Label>Web Sitesi</Label>
              <Input value={form.website} onChange={(e) => updateForm({ website: e.target.value })} placeholder="https://..." />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Marka & Görseller</CardTitle>
            <CardDescription>Logo, kapak görseli ve marka rengi</CardDescription>
          </div>
          <ImageIcon className="h-5 w-5 shrink-0 text-navy-400" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Logo Görsel Adresi</Label>
              <Input value={form.logoUrl} onChange={(e) => updateForm({ logoUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Kapak Görsel Adresi</Label>
              <Input value={form.coverUrl} onChange={(e) => updateForm({ coverUrl: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <div>
            <Label>Marka Rengi</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.themeColor}
                onChange={(e) => updateForm({ themeColor: e.target.value })}
                className="h-10 w-14 cursor-pointer rounded-lg border border-navy-200 bg-white p-1"
              />
              <Input
                value={form.themeColor}
                onChange={(e) => updateForm({ themeColor: e.target.value })}
                className="w-32"
                placeholder="#5817B0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        {saved && !error && (
          <p className="flex items-center gap-1 text-sm font-medium text-emerald-600">
            <Check className="h-4 w-4" /> Kaydedildi
          </p>
        )}
        <Button loading={submitting} onClick={handleSaveProfile}>
          Bilgileri Kaydet
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Galeri</CardTitle>
            <CardDescription>Randevu sayfanda gösterilecek işletme fotoğrafları</CardDescription>
          </div>
          <Images className="h-5 w-5 shrink-0 text-navy-400" />
        </CardHeader>
        <CardContent className="space-y-4">
          {galleryImages.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {galleryImages.map((img) => (
                <div key={img.id} className="group relative h-28 overflow-hidden rounded-xl border border-navy-100 bg-navy-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    disabled={removingImageId === img.id}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-card transition-opacity hover:bg-white disabled:opacity-50"
                    aria-label="Görseli sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <Label>Görsel Adresi</Label>
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <Button type="button" variant="outline" loading={addingImage} onClick={handleAddImage}>
              <Plus className="h-4 w-4" /> Ekle
            </Button>
          </div>
          {galleryError && <p className="text-sm font-medium text-red-600">{galleryError}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Randevu Kuralları & Gizlilik</CardTitle>
            <CardDescription>Online randevu sayfasındaki rezervasyon davranışı ve KVKK metni</CardDescription>
          </div>
          <ShieldCheck className="h-5 w-5 shrink-0 text-navy-400" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-navy-50 px-3.5 py-3">
            <div>
              <p className="text-sm font-medium text-navy-900">Randevuları Otomatik Onayla</p>
              <p className="text-xs text-navy-400">Kapalıysa yeni randevular "beklemede" olarak oluşturulur, onayı sen verirsin.</p>
            </div>
            <Switch checked={bookingForm.autoConfirm} onChange={(v) => updateBookingForm({ autoConfirm: v })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-navy-50 px-3.5 py-3">
            <div>
              <p className="text-sm font-medium text-navy-900">Depozito İste</p>
              <p className="text-xs text-navy-400">Randevu sırasında müşteriden ön ödeme talep edildiğini belirtir.</p>
            </div>
            <Switch checked={bookingForm.depositEnabled} onChange={(v) => updateBookingForm({ depositEnabled: v })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-navy-50 px-3.5 py-3">
            <div>
              <p className="text-sm font-medium text-navy-900">Adresi Göster</p>
              <p className="text-xs text-navy-400">Randevu sayfasında işletme adresini görünür yapar.</p>
            </div>
            <Switch checked={bookingForm.showAddress} onChange={(v) => updateBookingForm({ showAddress: v })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-navy-50 px-3.5 py-3">
            <div>
              <p className="text-sm font-medium text-navy-900">Telefonu Göster</p>
              <p className="text-xs text-navy-400">Randevu sayfasında işletme telefon numarasını görünür yapar.</p>
            </div>
            <Switch checked={bookingForm.showPhone} onChange={(v) => updateBookingForm({ showPhone: v })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Randevu Penceresi (gün)</Label>
              <Input
                type="number"
                min="1"
                value={bookingForm.bookingWindowDays}
                onChange={(e) => updateBookingForm({ bookingWindowDays: Number(e.target.value) || 1 })}
              />
              <p className="mt-1 text-xs text-navy-400">Müşteriler en fazla kaç gün ileriye randevu alabilir.</p>
            </div>
            <div>
              <Label>Minimum Bildirim Süresi (saat)</Label>
              <Input
                type="number"
                min="0"
                value={bookingForm.minNoticeHours}
                onChange={(e) => updateBookingForm({ minNoticeHours: Number(e.target.value) || 0 })}
              />
              <p className="mt-1 text-xs text-navy-400">Randevu saatine en az kaç saat kala rezervasyon yapılabilir.</p>
            </div>
          </div>
          <div>
            <Label>İptal Politikası</Label>
            <Textarea
              rows={2}
              value={bookingForm.cancellationPolicy ?? ""}
              onChange={(e) => updateBookingForm({ cancellationPolicy: e.target.value })}
              placeholder="Örn. Randevular en az 4 saat öncesine kadar ücretsiz iptal edilebilir."
            />
          </div>
          <div>
            <Label>KVKK Metni</Label>
            <Textarea
              rows={3}
              value={bookingForm.kvkkText ?? ""}
              onChange={(e) => updateBookingForm({ kvkkText: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            {bookingError && <p className="text-sm font-medium text-red-600">{bookingError}</p>}
            {bookingSaved && !bookingError && (
              <p className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                <Check className="h-4 w-4" /> Kaydedildi
              </p>
            )}
            <Button loading={savingBooking} onClick={handleSaveBooking}>
              Randevu Kurallarını Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Çalışma Saatleri</CardTitle>
            <CardDescription>İşletmenin genel çalışma saatleri — özel saati olmayan çalışanlar bu saatleri kullanır</CardDescription>
          </div>
          <Clock className="h-5 w-5 shrink-0 text-navy-400" />
        </CardHeader>
        <CardContent className="space-y-2">
          {hours.map((row) => (
            <div key={row.weekday} className="flex flex-wrap items-center gap-2 rounded-lg border border-navy-50 px-3 py-2">
              <span className="w-20 shrink-0 text-sm font-medium text-navy-700">{WEEKDAY_LABELS[row.weekday]}</span>
              <label className="flex items-center gap-1.5 text-xs text-navy-500">
                <input
                  type="checkbox"
                  checked={!row.isClosed}
                  onChange={(e) => updateHourRow(row.weekday, { isClosed: !e.target.checked })}
                  className="h-4 w-4 rounded border-navy-300 text-violet-600 focus:ring-violet-200"
                />
                Açık
              </label>
              {!row.isClosed && (
                <>
                  <Input
                    type="time"
                    value={row.openTime}
                    onChange={(e) => updateHourRow(row.weekday, { openTime: e.target.value })}
                    className="h-8 w-28"
                  />
                  <span className="text-xs text-navy-400">—</span>
                  <Input
                    type="time"
                    value={row.closeTime}
                    onChange={(e) => updateHourRow(row.weekday, { closeTime: e.target.value })}
                    className="h-8 w-28"
                  />
                  <span className="ml-2 text-xs text-navy-400">Mola</span>
                  <Input
                    type="time"
                    value={row.breakStart}
                    onChange={(e) => updateHourRow(row.weekday, { breakStart: e.target.value })}
                    className="h-8 w-28"
                  />
                  <span className="text-xs text-navy-400">—</span>
                  <Input
                    type="time"
                    value={row.breakEnd}
                    onChange={(e) => updateHourRow(row.weekday, { breakEnd: e.target.value })}
                    className="h-8 w-28"
                  />
                </>
              )}
            </div>
          ))}
          <div className="flex items-center justify-end gap-3 pt-2">
            {hoursError && <p className="text-sm font-medium text-red-600">{hoursError}</p>}
            {hoursSaved && !hoursError && (
              <p className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                <Check className="h-4 w-4" /> Kaydedildi
              </p>
            )}
            <Button loading={savingHours} onClick={handleSaveHours}>
              Çalışma Saatlerini Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
