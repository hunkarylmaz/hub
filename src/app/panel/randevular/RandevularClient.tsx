"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CalendarX2, Plus } from "lucide-react";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrencyTRY } from "@/lib/utils";
import { formatDateShortTR, formatTimeTR, formatWeekdayShortTR, todayKey } from "@/lib/date";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types";
import type { Service, Staff, Customer } from "@/lib/types";
import type { AppointmentWithDetails } from "@/lib/db/repo/appointments";
import { AppointmentDetailModal } from "../components/AppointmentDetailModal";
import { NewAppointmentModal } from "../components/NewAppointmentModal";

export function RandevularClient({
  appointments,
  staff,
  services,
  customers,
  serviceStaffMap,
}: {
  appointments: AppointmentWithDetails[];
  staff: Staff[];
  services: Service[];
  customers: Customer[];
  serviceStaffMap: Record<string, string[]>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<AppointmentWithDetails | null>(null);
  const [showNew, setShowNew] = useState(false);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  const status = searchParams.get("status") ?? "";
  const staffId = searchParams.get("staffId") ?? "";
  const serviceId = searchParams.get("serviceId") ?? "";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-44">
            <Select value={status} onChange={(e) => updateFilter("status", e.target.value)}>
              <option value="">Tüm Durumlar</option>
              {Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-44">
            <Select value={staffId} onChange={(e) => updateFilter("staffId", e.target.value)}>
              <option value="">Tüm Personel</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-44">
            <Select value={serviceId} onChange={(e) => updateFilter("serviceId", e.target.value)}>
              <option value="">Tüm Hizmetler</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" /> Yeni Randevu
        </Button>
      </div>

      {appointments.length === 0 ? (
        <EmptyState icon={CalendarX2} title="Randevu bulunamadı" description="Filtreleri değiştirin veya yeni bir randevu oluşturun." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                <th className="px-4 py-3">Tarih / Saat</th>
                <th className="px-4 py-3">Müşteri</th>
                <th className="px-4 py-3">Hizmet</th>
                <th className="px-4 py-3">Personel</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr
                  key={appt.id}
                  onClick={() => setSelected(appt)}
                  className="cursor-pointer border-b border-navy-50 last:border-0 hover:bg-navy-50/60"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <p className="font-medium text-navy-900">
                      {formatWeekdayShortTR(appt.startAt)} {formatDateShortTR(appt.startAt)}
                    </p>
                    <p className="text-xs text-navy-400">{formatTimeTR(appt.startAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={appt.customerName} size="sm" />
                      <span className="font-medium text-navy-900">{appt.customerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-navy-700">{appt.serviceName}</td>
                  <td className="px-4 py-3 text-navy-700">{appt.staffName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={appt.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-navy-900">{formatCurrencyTRY(appt.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AppointmentDetailModal appointment={selected} onClose={() => setSelected(null)} />
      <NewAppointmentModal
        open={showNew}
        onClose={() => setShowNew(false)}
        services={services}
        staff={staff}
        customers={customers}
        serviceStaffMap={serviceStaffMap}
        defaultDateKey={todayKey()}
      />
    </div>
  );
}
