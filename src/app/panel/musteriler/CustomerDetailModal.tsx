"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, AlertTriangle, Phone, Mail } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Label } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrencyTRY } from "@/lib/utils";
import { formatDateShortTR, formatDateTimeTR } from "@/lib/date";
import type { Customer, CustomerNote } from "@/lib/types";
import type { CustomerStats } from "@/lib/db/repo/customers";
import type { AppointmentWithDetails } from "@/lib/db/repo/appointments";
import { fetchCustomerDetailAction, updateCustomerAction, addCustomerNoteAction } from "./actions";

const GENDER_LABELS: Record<string, string> = { female: "Kadın", male: "Erkek" };

interface Detail {
  customer: Customer;
  stats: CustomerStats;
  notes: CustomerNote[];
  appointments: AppointmentWithDetails[];
}

export function CustomerDetailModal({ customerId, onClose }: { customerId: string | null; onClose: () => void }) {
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", phone: "", email: "", birthDate: "", gender: "", tagsInput: "" });
  const [noteText, setNoteText] = useState("");
  const [noteIsWarning, setNoteIsWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  useEffect(() => {
    if (!customerId) {
      setDetail(null);
      setEditing(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchCustomerDetailAction(customerId)
      .then((result) => {
        if (cancelled) return;
        setDetail(result);
        setEditForm({
          fullName: result.customer.fullName,
          phone: result.customer.phone ?? "",
          email: result.customer.email ?? "",
          birthDate: result.customer.birthDate ?? "",
          gender: result.customer.gender ?? "",
          tagsInput: result.customer.tags.join(", "),
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  function refreshDetail() {
    if (!customerId) return;
    fetchCustomerDetailAction(customerId).then(setDetail);
  }

  function handleSaveEdit() {
    if (!customerId) return;
    setError(null);
    if (!editForm.fullName.trim()) {
      setError("Ad Soyad zorunludur.");
      return;
    }
    startSubmit(async () => {
      try {
        await updateCustomerAction(customerId, {
          fullName: editForm.fullName,
          phone: editForm.phone || null,
          email: editForm.email || null,
          birthDate: editForm.birthDate || null,
          gender: editForm.gender || null,
          tags: editForm.tagsInput
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
        });
        refreshDetail();
        router.refresh();
        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Güncellenemedi.");
      }
    });
  }

  function handleToggleKvkk(checked: boolean) {
    if (!customerId) return;
    startSubmit(async () => {
      try {
        await updateCustomerAction(customerId, { kvkkConsent: checked });
        refreshDetail();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Güncellenemedi.");
      }
    });
  }

  function handleAddNote() {
    if (!customerId) return;
    setError(null);
    if (!noteText.trim()) {
      setError("Not boş olamaz.");
      return;
    }
    startSubmit(async () => {
      try {
        await addCustomerNoteAction(customerId, noteText, noteIsWarning);
        setNoteText("");
        setNoteIsWarning(false);
        refreshDetail();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Not eklenemedi.");
      }
    });
  }

  return (
    <Modal open={!!customerId} onClose={onClose} title="Müşteri Detayı" size="lg">
      {loading || !detail ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-navy-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={detail.customer.fullName} size="lg" />
              <div>
                <p className="font-semibold text-navy-900">{detail.customer.fullName}</p>
                {detail.customer.phone && (
                  <p className="flex items-center gap-1 text-sm text-navy-500">
                    <Phone className="h-3.5 w-3.5" /> {detail.customer.phone}
                  </p>
                )}
                {detail.customer.email && (
                  <p className="flex items-center gap-1 text-sm text-navy-500">
                    <Mail className="h-3.5 w-3.5" /> {detail.customer.email}
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

          {editing ? (
            <div className="space-y-3 rounded-xl border border-navy-100 bg-navy-50/40 p-4">
              <div>
                <Label>Ad Soyad</Label>
                <Input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Doğum Tarihi</Label>
                  <Input type="date" value={editForm.birthDate} onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })} />
                </div>
                <div>
                  <Label>Cinsiyet</Label>
                  <Select value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
                    <option value="">Belirtilmemiş</option>
                    <option value="female">Kadın</option>
                    <option value="male">Erkek</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Etiketler (virgülle ayırın)</Label>
                <Input value={editForm.tagsInput} onChange={(e) => setEditForm({ ...editForm, tagsInput: e.target.value })} placeholder="vip, yeni" />
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
          ) : (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-navy-100 bg-navy-50/40 p-4 text-sm">
              <div>
                <p className="text-navy-400">Doğum Tarihi</p>
                <p className="font-medium text-navy-900">{detail.customer.birthDate ? formatDateShortTR(detail.customer.birthDate) : "—"}</p>
              </div>
              <div>
                <p className="text-navy-400">Cinsiyet</p>
                <p className="font-medium text-navy-900">{detail.customer.gender ? GENDER_LABELS[detail.customer.gender] ?? detail.customer.gender : "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-navy-400">Etiketler</p>
                <p className="font-medium text-navy-900">{detail.customer.tags.length > 0 ? detail.customer.tags.join(", ") : "—"}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-navy-100 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-navy-900">KVKK Onayı</p>
              <p className="text-xs text-navy-400">
                {detail.customer.kvkkConsent && detail.customer.kvkkConsentAt
                  ? `Onaylandı · ${formatDateShortTR(detail.customer.kvkkConsentAt)}`
                  : "Onay alınmadı"}
              </p>
            </div>
            <Switch checked={detail.customer.kvkkConsent} onChange={handleToggleKvkk} disabled={submitting} />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-navy-100 p-3">
              <p className="text-lg font-semibold text-navy-900">{formatCurrencyTRY(detail.stats.totalSpent)}</p>
              <p className="text-xs text-navy-400">Toplam Harcama</p>
            </div>
            <div className="rounded-xl border border-navy-100 p-3">
              <p className="text-lg font-semibold text-navy-900">{detail.stats.totalAppointments}</p>
              <p className="text-xs text-navy-400">Toplam Randevu</p>
            </div>
            <div className="rounded-xl border border-navy-100 p-3">
              <p className="text-lg font-semibold text-navy-900">{detail.customer.noShowCount}</p>
              <p className="text-xs text-navy-400">Gelmedi</p>
            </div>
          </div>

          {detail.customer.warningNote && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="mb-1 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" /> Uyarı Notu
              </p>
              <p>{detail.customer.warningNote}</p>
            </div>
          )}

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <div>
            <Label>Not Ekle</Label>
            <Textarea rows={2} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Dahili not yazın..." />
            <div className="mt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-navy-600">
                <input
                  type="checkbox"
                  checked={noteIsWarning}
                  onChange={(e) => setNoteIsWarning(e.target.checked)}
                  className="h-4 w-4 rounded border-navy-300 text-violet-600 focus:ring-violet-200"
                />
                Uyarı notu olarak işaretle
              </label>
              <Button size="sm" loading={submitting} onClick={handleAddNote}>
                Not Ekle
              </Button>
            </div>
          </div>

          {detail.notes.length > 0 && (
            <div className="space-y-2">
              <Label>Geçmiş Notlar</Label>
              <div className="max-h-40 space-y-2 overflow-y-auto panel-scrollbar">
                {detail.notes.map((note) => (
                  <div
                    key={note.id}
                    className={`rounded-xl border p-3 text-sm ${note.isWarning ? "border-amber-200 bg-amber-50/60" : "border-navy-100"}`}
                  >
                    <p className="text-navy-700">{note.note}</p>
                    <p className="mt-1 text-xs text-navy-400">{formatDateTimeTR(note.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Randevu Geçmişi</Label>
            {detail.appointments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-navy-200 bg-navy-50/40 px-4 py-3 text-sm text-navy-500">
                Henüz randevu yok.
              </p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto panel-scrollbar">
                {detail.appointments.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between gap-3 rounded-xl border border-navy-100 p-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy-900">{appt.serviceName}</p>
                      <p className="truncate text-xs text-navy-400">
                        {formatDateTimeTR(appt.startAt)}
                        {appt.staffName ? ` · ${appt.staffName}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-medium text-navy-900">{formatCurrencyTRY(appt.price)}</span>
                      <StatusBadge status={appt.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
