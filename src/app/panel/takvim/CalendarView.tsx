"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { combineDateTime, formatWeekdayShortTR, timeKey, timeToMinutes, minutesToTime, todayKey, addDaysKey } from "@/lib/date";
import { APPOINTMENT_STATUS_HEX, APPOINTMENT_STATUS_LABELS, type Service, type Staff, type Customer } from "@/lib/types";
import type { AppointmentWithDetails } from "@/lib/db/repo/appointments";
import { AppointmentDetailModal } from "../components/AppointmentDetailModal";
import { NewAppointmentModal } from "../components/NewAppointmentModal";

const PX_PER_MIN = 1.2;

function computeBounds(
  businessHours: { openTime: string | null; closeTime: string | null } | null,
  appointments: AppointmentWithDetails[]
) {
  let startMin = businessHours?.openTime ? timeToMinutes(businessHours.openTime) : 9 * 60;
  let endMin = businessHours?.closeTime ? timeToMinutes(businessHours.closeTime) : 19 * 60;
  for (const appt of appointments) {
    const s = timeToMinutes(timeKey(new Date(appt.startAt)));
    const e = timeToMinutes(timeKey(new Date(appt.endAt)));
    if (e > s) {
      startMin = Math.min(startMin, s);
      endMin = Math.max(endMin, e);
    }
  }
  startMin = Math.max(0, Math.floor((startMin - 30) / 60) * 60);
  endMin = Math.min(24 * 60, Math.ceil((endMin + 30) / 60) * 60);
  if (endMin <= startMin) endMin = startMin + 60;
  return { startMin, endMin };
}

interface NewModalConfig {
  staffId: string | null;
  time: string | null;
}

export function CalendarView({
  dateKey,
  weekDays,
  weekCounts,
  appointments,
  staff,
  services,
  customers,
  serviceStaffMap,
  isClosedDay,
  businessHours,
}: {
  dateKey: string;
  weekDays: string[];
  weekCounts: Record<string, number>;
  appointments: AppointmentWithDetails[];
  staff: Staff[];
  services: Service[];
  customers: Customer[];
  serviceStaffMap: Record<string, string[]>;
  isClosedDay: boolean;
  businessHours: { openTime: string | null; closeTime: string | null } | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<AppointmentWithDetails | null>(null);
  const [newModalConfig, setNewModalConfig] = useState<NewModalConfig | null>(null);

  function navigateTo(key: string) {
    router.push(`/panel/takvim?date=${key}`);
  }

  const { startMin, endMin } = computeBounds(businessHours, appointments);
  const totalHeight = (endMin - startMin) * PX_PER_MIN;
  const pxPerHour = 60 * PX_PER_MIN;
  const hourMarks: number[] = [];
  for (let m = startMin; m <= endMin; m += 60) hourMarks.push(m);

  const isToday = dateKey === todayKey();
  const nowMin = timeToMinutes(timeKey(new Date()));
  const showNowLine = isToday && nowMin >= startMin && nowMin <= endMin;

  const unassigned = appointments.filter((a) => !a.staffId);
  const columns = [
    ...staff.map((s) => ({ id: s.id, name: s.fullName, appts: appointments.filter((a) => a.staffId === s.id) })),
    ...(unassigned.length > 0 ? [{ id: "_unassigned", name: "Personelsiz / Genel", appts: unassigned }] : []),
  ];

  function handleColumnClick(e: React.MouseEvent<HTMLDivElement>, staffId: string | null) {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    let minute = startMin + offsetY / PX_PER_MIN;
    minute = Math.round(minute / 15) * 15;
    setNewModalConfig({ staffId, time: minutesToTime(minute) });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateTo(addDaysKey(dateKey, -1))} aria-label="Önceki gün">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="w-40">
            <Input type="date" value={dateKey} onChange={(e) => navigateTo(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateTo(addDaysKey(dateKey, 1))} aria-label="Sonraki gün">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigateTo(todayKey())}>
            Bugün
          </Button>
        </div>
        <Button onClick={() => setNewModalConfig({ staffId: null, time: null })}>
          <Plus className="h-4 w-4" /> Yeni Randevu
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const active = day === dateKey;
          const count = weekCounts[day] ?? 0;
          return (
            <button
              key={day}
              onClick={() => navigateTo(day)}
              className={cn(
                "flex flex-col items-center rounded-xl border px-2 py-2.5 transition-colors",
                active ? "border-violet-600 bg-violet-50 text-violet-700" : "border-navy-100 text-navy-500 hover:bg-navy-50"
              )}
            >
              <span className="text-[11px] font-medium uppercase">{formatWeekdayShortTR(combineDateTime(day, "12:00"))}</span>
              <span className="mt-0.5 text-base font-semibold text-navy-900">{day.slice(8, 10)}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "mt-1 rounded-full px-1.5 text-[10px] font-semibold",
                    active ? "bg-violet-600 text-white" : "bg-navy-100 text-navy-500"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isClosedDay && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          İşletme bu gün normalde kapalı. Manuel randevu oluşturabilirsiniz ancak müsait saat bulunmayabilir.
        </div>
      )}

      {columns.length === 0 ? (
        <EmptyState icon={CalendarX2} title="Henüz aktif personel yok" description="Takvimi kullanmak için önce çalışan ekleyin." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-card">
          <div style={{ minWidth: 64 + columns.length * 180 }}>
            <div className="flex border-b border-navy-100">
              <div className="w-16 shrink-0" />
              {columns.map((col) => (
                <div key={col.id} className="min-w-[180px] flex-1 border-l border-navy-100 px-3 py-3 text-sm font-semibold text-navy-900">
                  {col.name}
                </div>
              ))}
            </div>

            <div className="flex max-h-[70vh] overflow-y-auto panel-scrollbar">
              <div className="relative w-16 shrink-0" style={{ height: totalHeight }}>
                {hourMarks.map((m) => (
                  <div
                    key={m}
                    className="absolute right-2 -translate-y-1/2 text-xs text-navy-400"
                    style={{ top: (m - startMin) * PX_PER_MIN }}
                  >
                    {minutesToTime(m)}
                  </div>
                ))}
              </div>

              {columns.map((col) => (
                <div
                  key={col.id}
                  onClick={(e) => handleColumnClick(e, col.id === "_unassigned" ? null : col.id)}
                  className="relative min-w-[180px] flex-1 cursor-pointer border-l border-navy-100"
                  style={{
                    height: totalHeight,
                    backgroundImage: "linear-gradient(to bottom, #E2E8F8 1px, transparent 1px)",
                    backgroundSize: `100% ${pxPerHour}px`,
                  }}
                >
                  {showNowLine && (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-20 h-px bg-red-500"
                      style={{ top: (nowMin - startMin) * PX_PER_MIN }}
                    >
                      <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                    </div>
                  )}

                  {col.appts.map((appt) => {
                    const apptStartMin = timeToMinutes(timeKey(new Date(appt.startAt)));
                    const apptEndMin = timeToMinutes(timeKey(new Date(appt.endAt)));
                    const top = (apptStartMin - startMin) * PX_PER_MIN;
                    const height = Math.max(22, (apptEndMin - apptStartMin) * PX_PER_MIN - 2);
                    const hex = APPOINTMENT_STATUS_HEX[appt.status];
                    return (
                      <div
                        key={appt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(appt);
                        }}
                        className="absolute left-1 right-1 z-10 overflow-hidden rounded-md px-2 py-1 text-left shadow-sm transition-shadow hover:shadow-md"
                        style={{ top, height, backgroundColor: `${hex}1F`, borderLeft: `3px solid ${hex}` }}
                      >
                        <p className="truncate text-[11px] font-semibold text-navy-900">
                          {minutesToTime(apptStartMin)} · {appt.customerName}
                        </p>
                        <p className="truncate text-[10px] text-navy-500">{appt.serviceName}</p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-navy-400">
        {Object.entries(APPOINTMENT_STATUS_LABELS).map(([status, label]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: APPOINTMENT_STATUS_HEX[status as keyof typeof APPOINTMENT_STATUS_HEX] }} />
            {label}
          </span>
        ))}
      </div>

      <AppointmentDetailModal appointment={selected} onClose={() => setSelected(null)} />
      <NewAppointmentModal
        open={!!newModalConfig}
        onClose={() => setNewModalConfig(null)}
        services={services}
        staff={staff}
        customers={customers}
        serviceStaffMap={serviceStaffMap}
        defaultDateKey={dateKey}
        defaultStaffId={newModalConfig?.staffId ?? undefined}
        defaultTime={newModalConfig?.time ?? undefined}
      />
    </div>
  );
}
