import { CalendarDays, ClipboardList, Users, Wallet, CalendarX2 } from "lucide-react";
import { requireBusinessContext } from "@/lib/session";
import { listAppointmentsInRange, countAppointmentsThisMonth } from "@/lib/db/repo/appointments";
import { listCustomers } from "@/lib/db/repo/customers";
import { getDailySummary } from "@/lib/db/repo/accounting";
import { combineDateTime, todayKey, addDaysKey, formatTimeTR, formatWeekdayShortTR } from "@/lib/date";
import { formatCurrencyTRY } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/Stat";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { RevenueChart } from "./RevenueChart";

export default async function PanelDashboardPage() {
  const { business } = await requireBusinessContext();

  const today = todayKey();
  const todayStart = combineDateTime(today, "00:00");
  const todayEnd = combineDateTime(addDaysKey(today, 1), "00:00");
  const todaysAppointments = listAppointmentsInRange(business.id, todayStart, todayEnd);

  const [y, m] = today.split("-").map(Number);
  const nextMonthKey = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const monthStartIso = combineDateTime(`${y}-${String(m).padStart(2, "0")}-01`, "00:00");
  const monthEndIso = combineDateTime(nextMonthKey, "00:00");
  const monthAppointmentCount = countAppointmentsThisMonth(business.id, monthStartIso, monthEndIso);

  const customerCount = listCustomers(business.id).length;
  const todaySummary = getDailySummary(business.id, today);

  const revenueData = Array.from({ length: 7 }, (_, i) => {
    const key = addDaysKey(today, i - 6);
    const summary = getDailySummary(business.id, key);
    return { label: formatWeekdayShortTR(combineDateTime(key, "12:00")), income: summary.totalIncome };
  });

  return (
    <div>
      <PageHeader title="Genel Bakış" description={`${business.name} için bugünkü özet`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Bugünkü Randevular" value={String(todaysAppointments.length)} icon={CalendarDays} accent="violet" />
        <StatCard label="Bu Ay Randevu" value={String(monthAppointmentCount)} icon={ClipboardList} accent="navy" />
        <StatCard label="Toplam Müşteri" value={String(customerCount)} icon={Users} accent="emerald" />
        <StatCard label="Bugünkü Gelir" value={formatCurrencyTRY(todaySummary.totalIncome)} icon={Wallet} accent="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Son 7 Gün Gelir</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueData} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bugünkü Randevular</CardTitle>
          </CardHeader>
          <CardContent>
            {todaysAppointments.length === 0 ? (
              <EmptyState icon={CalendarX2} title="Bugün randevu yok" description="Yeni randevular burada görünecek." />
            ) : (
              <div className="space-y-3">
                {todaysAppointments.map((appt) => (
                  <div key={appt.id} className="flex items-center gap-3 rounded-xl border border-navy-100 p-3">
                    <div className="w-12 shrink-0 text-sm font-semibold text-navy-700">{formatTimeTR(appt.startAt)}</div>
                    <Avatar name={appt.customerName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-navy-900">{appt.customerName}</p>
                      <p className="truncate text-xs text-navy-400">
                        {appt.serviceName}
                        {appt.staffName ? ` · ${appt.staffName}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
