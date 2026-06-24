import { requireBusinessContext } from "@/lib/session";
import { listAppointmentsInRange } from "@/lib/db/repo/appointments";
import { listServices, listStaffIdsForService } from "@/lib/db/repo/services";
import { listStaff, listWorkingHours } from "@/lib/db/repo/staff";
import { listCustomers } from "@/lib/db/repo/customers";
import { combineDateTime, todayKey, addDaysKey, isoWeekday } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { CalendarView } from "./CalendarView";

export default async function TakvimPage({ searchParams }: { searchParams: { date?: string } }) {
  const { business } = await requireBusinessContext();
  const dateKey = searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date) ? searchParams.date : todayKey();

  const staff = listStaff(business.id, { onlyActive: true });
  const services = listServices(business.id, { onlyActive: true });
  const customers = listCustomers(business.id);
  const workingHours = listWorkingHours(business.id);

  const serviceStaffMap: Record<string, string[]> = {};
  for (const service of services) serviceStaffMap[service.id] = listStaffIdsForService(service.id);

  const refWeekday = isoWeekday(new Date(combineDateTime(dateKey, "12:00")));
  const mondayKey = addDaysKey(dateKey, -refWeekday);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDaysKey(mondayKey, i));

  const weekCounts: Record<string, number> = {};
  for (const day of weekDays) {
    const start = combineDateTime(day, "00:00");
    const end = combineDateTime(addDaysKey(day, 1), "00:00");
    weekCounts[day] = listAppointmentsInRange(business.id, start, end).length;
  }

  const dayStart = combineDateTime(dateKey, "00:00");
  const dayEnd = combineDateTime(addDaysKey(dateKey, 1), "00:00");
  const appointments = listAppointmentsInRange(business.id, dayStart, dayEnd);

  const todaysHours = workingHours.find((h) => h.weekday === refWeekday);
  const isClosedDay = !todaysHours || todaysHours.isClosed;

  return (
    <div>
      <PageHeader title="Takvim" description="Günlük randevu takvimi" />
      <CalendarView
        dateKey={dateKey}
        weekDays={weekDays}
        weekCounts={weekCounts}
        appointments={appointments}
        staff={staff}
        services={services}
        customers={customers}
        serviceStaffMap={serviceStaffMap}
        isClosedDay={isClosedDay}
        businessHours={todaysHours ? { openTime: todaysHours.openTime, closeTime: todaysHours.closeTime } : null}
      />
    </div>
  );
}
