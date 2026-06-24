"use client";

import { useMemo, useState } from "react";
import { Search, ScrollText } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTimeTR } from "@/lib/date";
import type { AuditLog } from "@/lib/types";

type LogRow = AuditLog & { actorName: string | null; businessName: string | null };

export function DenetimKayitlariClient({ logs }: { logs: LogRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        (l.actorName ?? "").toLowerCase().includes(q) ||
        (l.businessName ?? "").toLowerCase().includes(q) ||
        l.entityType.toLowerCase().includes(q)
    );
  }, [logs, search]);

  return (
    <div>
      <div className="mb-4 w-64">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İşlem, kullanıcı veya işletme ara..." className="pl-9" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={logs.length === 0 ? "Henüz kayıt yok" : "Sonuç bulunamadı"}
          description={logs.length === 0 ? "Platformdaki işlemler burada görünecek." : "Arama kriterlerinizi değiştirin."}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                <th className="px-4 py-3">İşlem</th>
                <th className="px-4 py-3">Varlık</th>
                <th className="px-4 py-3">Kullanıcı</th>
                <th className="px-4 py-3">İşletme</th>
                <th className="px-4 py-3">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/60">
                  <td className="px-4 py-3">
                    <Badge>{log.action}</Badge>
                  </td>
                  <td className="px-4 py-3 text-navy-700">{log.entityType}</td>
                  <td className="px-4 py-3 text-navy-700">{log.actorName ?? "Sistem"}</td>
                  <td className="px-4 py-3 text-navy-700">{log.businessName ?? "—"}</td>
                  <td className="px-4 py-3 text-navy-700">{formatDateTimeTR(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
