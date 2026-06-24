import { Building2, Users, CreditCard, TrendingUp } from "lucide-react";
import { listBusinesses } from "@/lib/db/repo/businesses";
import { listAllUsers } from "@/lib/db/repo/users";
import { listAllSubscriptionsWithBusiness } from "@/lib/db/repo/plans";
import { listPlans } from "@/lib/db/repo/plans";
import { listAuditLogs } from "@/lib/db/repo/auditLogs";
import { formatDateTimeTR } from "@/lib/date";
import { formatCurrencyTRY } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/Stat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SUBSCRIPTION_STATUS_LABELS } from "@/lib/types";

export default async function AdminDashboardPage() {
  const businesses = listBusinesses();
  const users = listAllUsers();
  const subscriptions = listAllSubscriptionsWithBusiness();
  const plans = listPlans();
  const recentLogs = listAuditLogs(8);

  const planById = new Map(plans.map((p) => [p.id, p]));
  const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
  const trialSubscriptions = subscriptions.filter((s) => s.status === "trial");
  const mrr = activeSubscriptions.reduce((sum, s) => {
    const plan = planById.get(s.planId);
    if (!plan) return sum;
    return sum + (s.billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice / 12);
  }, 0);

  const recentBusinesses = businesses.slice(0, 6);

  return (
    <div>
      <PageHeader title="Genel Bakış" description="Tüm platformun özeti" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Toplam İşletme" value={String(businesses.length)} icon={Building2} accent="violet" />
        <StatCard label="Aktif Abonelik" value={String(activeSubscriptions.length)} icon={CreditCard} accent="emerald" />
        <StatCard label="Deneme Süresi" value={String(trialSubscriptions.length)} icon={CreditCard} accent="amber" />
        <StatCard label="Tahmini Aylık Gelir (MRR)" value={formatCurrencyTRY(mrr)} icon={TrendingUp} accent="navy" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Toplam Kullanıcı" value={String(users.length)} icon={Users} accent="navy" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Son Kaydolan İşletmeler</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBusinesses.length === 0 ? (
              <EmptyState icon={Building2} title="Henüz işletme yok" description="Yeni kayıtlar burada görünecek." />
            ) : (
              <div className="space-y-3">
                {recentBusinesses.map((biz) => {
                  const sub = subscriptions.find((s) => s.businessId === biz.id);
                  return (
                    <div key={biz.id} className="flex items-center justify-between gap-3 rounded-xl border border-navy-100 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-navy-900">{biz.name}</p>
                        <p className="truncate text-xs text-navy-400">/{biz.slug}</p>
                      </div>
                      <span className="shrink-0 status-badge bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
                        {sub ? SUBSCRIPTION_STATUS_LABELS[sub.status] : "Abonelik Yok"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Son Etkinlikler</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <EmptyState icon={CreditCard} title="Henüz kayıt yok" />
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-navy-100 p-3">
                    <p className="text-sm font-medium text-navy-900">{log.action}</p>
                    <p className="mt-0.5 text-xs text-navy-400">
                      {log.actorName ?? "Sistem"}
                      {log.businessName ? ` · ${log.businessName}` : ""} · {formatDateTimeTR(log.createdAt)}
                    </p>
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
