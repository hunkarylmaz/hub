"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Phone, Mail, Clock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { Service, Staff, StaffWorkingHour } from "@/lib/types";
import { WEEKDAY_LABELS } from "@/lib/types";
import {
  fetchStaffDetailAction,
  updateStaffAction,
  saveStaffWorkingHoursAction,
  clearStaffWorkingHoursAction,
  type WorkingHourInput,
} from "./actions";

interface Detail {
  staff: Staff;
  workingHours: StaffWorkingHour[];
  serviceIds: string[];
}

interface HourRow {
  weekday: number;
  isOff: boolean;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
}

function defaultHours(): HourRow[] {
  return Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    isOff: weekday === 6,
    startTime: "09:00",
    endTime: "18:00",
    breakStart: "",
    breakEnd: "",
  }));
}

export function StaffDetailModal({
  staffId,
  services,
  onClose,
}: {
  staffId: string | null;
  services: Service[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", title: "", phone: "", email: "" });
  const [useCustomHours, setUseCustomHours] = useState(false);
  const [hours, setHours] = useState<HourRow[]>(defaultHours());
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const [savingHours, startSaveHours] = useTransition();

  useEffect(() => {
    if (!staffId) {
      setDetail(null);
      setEditing(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchStaffDetailAction(staffId)
      .then((result) => {
        if (cancelled) return;
        setDetail(result);
        setEditForm({
          fullName: result.staff.fullName,
          title: result.staff.title ?? "",
          phone: result.staff.phone ?? "",
          email: result.staff.email ?? "",
        });
        if (result.workingHours.length > 0) {
          const rows = defaultHours();
          for (const wh of result.workingHours) {
            rows[wh.weekday] = {
              weekday: wh.weekday,
              isOff: wh.isOff,
              startTime: wh.startTime ?? "",
              endTime: wh.endTime ?? "",
              breakStart: wh.breakStart ?? "",
              breakEnd: wh.breakEnd ?? "",
            };
          }
          setUseCustomHours(true);
          setHours(rows);
        } else {
          setUseCustomHours(false);
          setHours(defaultHours());
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [staffId]);

  function refreshDetail() {
    if (!staffId) return;
    fetchStaffDetailAction(staffId).then(setDetail);
  }

  function handleSaveEdit() {
    if (!staffId) return;
    setError(null);
    if (!editForm.fullName.trim()) {
      setError("Ad Soyad zorunludur.");
      return;
    }
    startSubmit(async () => {
      try {
        await updateStaffAction(staffId, {
          fullName: editForm.fullName,
          title: editForm.title || null,
          phone: editForm.phone || null,
          email: editForm.email || null,
        });
        refreshDetail();
        router.refresh();
        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Güncellenemedi.");
      }
    });
  }

  function handleToggleField(field: "isActive" | "isBookableOnline", checked: boolean) {
    if (!staffId) return;
    startSubmit(async () => {
      try {
        await updateStaffAction(staffId, { [field]: checked });
        refreshDetail();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Güncellenemedi.");
      }
    });
  }

  function updateRow(weekday: number, patch: Partial<HourRow>) {
    setHours((rows) => rows.map((r) => (r.weekday === weekday ? { ...r, ...patch } : r)));
  }

  function handleSaveHours() {
    if (!staffId) return;
    setError(null);
    startSaveHours(async () => {
      try {
        if (useCustomHours) {
          const payload: WorkingHourInput[] = hours.map((h) => ({
            weekday: h.weekday,
            isOff: h.isOff,
            startTime: h.isOff ? null : h.startTime || null,
            endTime: h.isOff ? null : h.endTime || null,
            breakStart: h.isOff ? null : h.breakStart || null,
            breakEnd: h.isOff ? null : h.breakEnd || null,
          }));
          await saveStaffWorkingHoursAction(staffId, payload);
        } else {
          await clearStaffWorkingHoursAction(staffId);
        }
        refreshDetail();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Çalışma saatleri kaydedilemedi.");
      }
    });
  }

  const assignedServices = detail ? services.filter((s) => detail.serviceIds.includes(s.id)) : [];

  return (
    <Modal open={!!staffId} onClose={onClose} title="Çalışan Detayı" size="lg">
      {loading || !detail ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-navy-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={detail.staff.fullName} size="lg" />
              <div>
                <p className="font-semibold text-navy-900">{detail.staff.fullName}</p>
                {detail.staff.title && <p className="text-sm text-navy-500">{detail.staff.title}</p>}
                {detail.staff.phone && (
                  <p className="flex items-center gap-1 text-sm text-navy-500">
                    <Phone className="h-3.5 w-3.5" /> {detail.staff.phone}
                  </p>
                )}
                {detail.staff.email && (
                  <p className="flex items-center gap-1 text-sm text-navy-500">
                    <Mail className="h-3.5 w-3.5" /> {detail.staff.email}
                  </p>
                )}
              </div>
            </div>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" /> Düzenle
              </Button>
            )}
          </div>

          {editing && (
            <div className="space-y-3 rounded-xl border border-navy-100 bg-navy-50/40 p-4">
              <div>
                <Label>Ad Soyad</Label>
                <Input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
              </div>
              <div>
                <Label>Unvan</Label>
                <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Telefon</Label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div>
                  <Label>E-posta</Label>
                  <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Vazgeç
                </Button>
                <Button variant="primary" size="sm" loading={submitting} onClick={handleSaveEdit}>
                  Kaydet
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-navy-100 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-navy-900">Çalışan Aktif</p>
              <p className="text-xs text-navy-400">Pasif çalışanlara yeni randevu atanamaz.</p>
            </div>
            <Switch checked={detail.staff.isActive} onChange={(v) => handleToggleField("isActive", v)} disabled={submitting} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-navy-100 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-navy-900">Online Randevuda Görünsün</p>
              <p className="text-xs text-navy-400">Kapalıysa müşteriler online randevuda bu çalışanı seçemez.</p>
            </div>
            <Switch checked={detail.staff.isBookableOnline} onChange={(v) => handleToggleField("isBookableOnline", v)} disabled={submitting} />
          </div>

          <div>
            <Label>Verebileceği Hizmetler</Label>
            {assignedServices.length === 0 ? (
              <p className="text-sm text-navy-400">Henüz hizmet atanmamış. Hizmetler sayfasından düzenleyebilirsiniz.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {assignedServices.map((s) => (
                  <Badge key={s.id}>{s.name}</Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-navy-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-navy-400" />
                <p className="text-sm font-medium text-navy-900">Özel Çalışma Saatleri</p>
              </div>
              <Switch checked={useCustomHours} onChange={setUseCustomHours} />
            </div>
            {!useCustomHours ? (
              <p className="text-xs text-navy-400">İşletmenin genel çalışma saatlerini kullanıyor.</p>
            ) : (
              <div className="space-y-2">
                {hours.map((row) => (
                  <div key={row.weekday} className="flex flex-wrap items-center gap-2 rounded-lg border border-navy-50 px-3 py-2">
                    <span className="w-20 shrink-0 text-sm font-medium text-navy-700">{WEEKDAY_LABELS[row.weekday]}</span>
                    <label className="flex items-center gap-1.5 text-xs text-navy-500">
                      <input
                        type="checkbox"
                        checked={!row.isOff}
                        onChange={(e) => updateRow(row.weekday, { isOff: !e.target.checked })}
                        className="h-4 w-4 rounded border-navy-300 text-violet-600 focus:ring-violet-200"
                      />
                      Çalışıyor
                    </label>
                    {!row.isOff && (
                      <>
                        <Input
                          type="time"
                          value={row.startTime}
                          onChange={(e) => updateRow(row.weekday, { startTime: e.target.value })}
                          className="h-8 w-28"
                        />
                        <span className="text-xs text-navy-400">—</span>
                        <Input
                          type="time"
                          value={row.endTime}
                          onChange={(e) => updateRow(row.weekday, { endTime: e.target.value })}
                          className="h-8 w-28"
                        />
                        <span className="ml-2 text-xs text-navy-400">Mola</span>
                        <Input
                          type="time"
                          value={row.breakStart}
                          onChange={(e) => updateRow(row.weekday, { breakStart: e.target.value })}
                          className="h-8 w-28"
                        />
                        <span className="text-xs text-navy-400">—</span>
                        <Input
                          type="time"
                          value={row.breakEnd}
                          onChange={(e) => updateRow(row.weekday, { breakEnd: e.target.value })}
                          className="h-8 w-28"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button size="sm" loading={savingHours} onClick={handleSaveHours}>
                Çalışma Saatlerini Kaydet
              </Button>
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
