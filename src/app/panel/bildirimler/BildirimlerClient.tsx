"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Calendar, Wallet, CreditCard, Clock, Check, CheckCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { formatDateTimeTR } from "@/lib/date";
import type { NotificationRecord } from "@/lib/types";
import { markNotificationReadAction, markAllNotificationsReadAction } from "./actions";

const TYPE_ICONS: Record<string, LucideIcon> = {
  appointment_created: Calendar,
  payment_received: Wallet,
  subscription: CreditCard,
  reminder: Clock,
};

export function BildirimlerClient({ notifications }: { notifications: NotificationRecord[] }) {
  const router = useRouter();
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [isMarkingAll, startMarkAll] = useTransition();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function handleMarkRead(id: string) {
    setMarkingId(id);
    markNotificationReadAction(id)
      .then(() => router.refresh())
      .finally(() => setMarkingId(null));
  }

  function handleMarkAll() {
    startMarkAll(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  if (notifications.length === 0) {
    return <EmptyState icon={Bell} title="Henüz bildirim yok" description="İşletmenle ilgili hareketler burada görünecek." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" loading={isMarkingAll} disabled={unreadCount === 0} onClick={handleMarkAll}>
          <CheckCheck className="h-4 w-4" />
          Tümünü Okundu İşaretle
        </Button>
      </div>

      <Card className="divide-y divide-navy-50">
        {notifications.map((n) => {
          const Icon = TYPE_ICONS[n.type] ?? Bell;
          return (
            <div key={n.id} className={cn("flex items-start gap-3 px-5 py-4", !n.isRead && "bg-violet-50/40")}>
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  n.isRead ? "bg-navy-50 text-navy-400" : "bg-violet-100 text-violet-600"
                )}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-navy-900">{n.title}</p>
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-600" />}
                </div>
                {n.body && <p className="mt-0.5 text-sm text-navy-500">{n.body}</p>}
                <p className="mt-1.5 text-xs text-navy-400">{formatDateTimeTR(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  loading={markingId === n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className="shrink-0"
                >
                  <Check className="h-3.5 w-3.5" />
                  Okundu işaretle
                </Button>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
