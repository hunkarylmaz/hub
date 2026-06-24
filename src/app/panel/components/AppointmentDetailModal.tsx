"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Phone, StickyNote, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select, Textarea, Label } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { formatCurrencyTRY } from "@/lib/utils";
import { formatDateTimeTR, formatTimeTR } from "@/lib/date";
import { PAYMENT_METHOD_LABELS, type AppointmentStatus, type PaymentMethod } from "@/lib/types";
import type { AppointmentWithDetails } from "@/lib/db/repo/appointments";
import { updateAppointmentStatusAction } from "@/app/panel/randevular/actions";

type ActionVariant = "primary" | "secondary" | "outline" | "danger";

const NEXT_ACTIONS: Record<AppointmentStatus, { status: AppointmentStatus; label: string; variant: ActionVariant }[]> = {
  pending: [
    { status: "confirmed", label: "Onayla", variant: "primary" },
    { status: "cancelled", label: "İptal Et", variant: "danger" },
  ],
  confirmed: [
    { status: "arrived", label: "Geldi Olarak İşaretle", variant: "primary" },
    { status: "no_show", label: "Gelmedi", variant: "outline" },
    { status: "cancelled", label: "İptal Et", variant: "danger" },
  ],
  arrived: [
    { status: "completed", label: "Tamamlandı Olarak İşaretle", variant: "primary" },
    { status: "cancelled", label: "İptal Et", variant: "danger" },
  ],
  completed: [],
  cancelled: [],
  no_show: [],
  rescheduled: [],
};

export function AppointmentDetailModal({
  appointment,
  onClose,
}: {
  appointment: AppointmentWithDetails | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [showPaymentInput, setShowPaymentInput] = useState(false);

  if (!appointment) return null;

  function runStatusChange(status: AppointmentStatus, opts?: { reason?: string; paymentMethod?: PaymentMethod }) {
    setError(null);
    startTransition(async () => {
      try {
        await updateAppointmentStatusAction(appointment!.id, status, opts);
        setShowCancelInput(false);
        setShowPaymentInput(false);
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Bir hata oluştu.");
      }
    });
  }

  function handleActionClick(status: AppointmentStatus) {
    if (status === "cancelled") {
      setShowCancelInput(true);
      return;
    }
    if (status === "completed") {
      setShowPaymentInput(true);
      return;
    }
    runStatusChange(status);
  }

  const actions = NEXT_ACTIONS[appointment.status];

  return (
    <Modal open={!!appointment} onClose={onClose} title="Randevu Detayı" size="md">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={appointment.customerName} size="lg" />
            <div>
              <p className="font-semibold text-navy-900">{appointment.customerName}</p>
              {appointment.customerPhone && (
                <p className="flex items-center gap-1 text-sm text-navy-500">
                  <Phone className="h-3.5 w-3.5" /> {appointment.customerPhone}
                </p>
              )}
            </div>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl border border-navy-100 bg-navy-50/40 p-4 text-sm">
          <div>
            <p className="text-navy-400">Hizmet</p>
            <p className="font-medium text-navy-900">{appointment.serviceName}</p>
          </div>
          <div>
            <p className="text-navy-400">Personel</p>
            <p className="font-medium text-navy-900">{appointment.staffName ?? "—"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-navy-400">Tarih / Saat</p>
            <p className="font-medium text-navy-900">
              {formatDateTimeTR(appointment.startAt)} – {formatTimeTR(appointment.endAt)}
            </p>
          </div>
          <div>
            <p className="text-navy-400">Tutar</p>
            <p className="font-medium text-navy-900">{formatCurrencyTRY(appointment.price)}</p>
          </div>
          <div>
            <p className="text-navy-400">Ödeme</p>
            <p className="font-medium text-navy-900">{appointment.paymentStatus === "paid" ? "Ödendi" : "Ödenmedi"}</p>
          </div>
        </div>

        {appointment.customerNote && (
          <div className="rounded-xl border border-navy-100 p-3 text-sm">
            <p className="mb-1 flex items-center gap-1.5 font-medium text-navy-700">
              <StickyNote className="h-3.5 w-3.5" /> Müşteri Notu
            </p>
            <p className="text-navy-500">{appointment.customerNote}</p>
          </div>
        )}
        {appointment.internalNote && (
          <div className="rounded-xl border border-navy-100 p-3 text-sm">
            <p className="mb-1 flex items-center gap-1.5 font-medium text-navy-700">
              <StickyNote className="h-3.5 w-3.5" /> Dahili Not
            </p>
            <p className="text-navy-500">{appointment.internalNote}</p>
          </div>
        )}
        {appointment.cancellationReason && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            <p className="mb-1 flex items-center gap-1.5 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" /> İptal Nedeni
            </p>
            <p>{appointment.cancellationReason}</p>
          </div>
        )}

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        {showCancelInput && (
          <div className="space-y-2 rounded-xl border border-red-100 bg-red-50/60 p-4">
            <Label>İptal nedeni</Label>
            <Textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Örn: Müşteri talebiyle iptal edildi"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCancelInput(false)}>
                Vazgeç
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={pending}
                onClick={() => runStatusChange("cancelled", { reason: cancelReason || "Belirtilmedi" })}
              >
                İptali Onayla
              </Button>
            </div>
          </div>
        )}

        {showPaymentInput && (
          <div className="space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <Label>Ödeme yöntemi</Label>
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowPaymentInput(false)}>
                Vazgeç
              </Button>
              <Button variant="primary" size="sm" loading={pending} onClick={() => runStatusChange("completed", { paymentMethod })}>
                Tamamla ve Tahsil Et
              </Button>
            </div>
          </div>
        )}

        {actions.length > 0 && !showCancelInput && !showPaymentInput && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-navy-100 pt-4">
            {actions.map((a) => (
              <Button key={a.status} variant={a.variant} size="sm" loading={pending} onClick={() => handleActionClick(a.status)}>
                {a.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
