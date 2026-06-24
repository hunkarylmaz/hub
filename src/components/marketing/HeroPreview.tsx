import { CalendarCheck2, TrendingUp, CheckCircle2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

const ROWS = [
  { name: "Elif Yılmaz", service: "Saç Kesimi & Bakım", time: "10:30", status: "Onaylandı" as const },
  { name: "Cem Aydoğan", service: "Düğün Danışmanlığı", time: "11:15", status: "Onaylandı" as const },
  { name: "Ayşe Korkmaz", service: "Cilt Bakımı", time: "13:00", status: "Bekliyor" as const },
  { name: "Murat Şahin", service: "Saç & Sakal", time: "14:45", status: "Onaylandı" as const },
];

export function HeroPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-3xl px-4">
      <div
        className="absolute -left-10 top-6 h-44 w-44 rounded-full bg-violet-500/30 blur-3xl animate-float-slow sm:h-56 sm:w-56"
        aria-hidden
      />
      <div
        className="absolute -right-6 bottom-0 h-40 w-40 rounded-full bg-navy-300/20 blur-3xl animate-float"
        style={{ animationDelay: "1.2s" }}
        aria-hidden
      />

      <div className="relative rotate-1 rounded-3xl bg-white p-5 shadow-elevated ring-1 ring-navy-900/5 transition-transform duration-500 hover:rotate-0 sm:p-6">
        <div className="flex items-center justify-between border-b border-navy-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <CalendarCheck2 className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-navy-900">Bugünkü Randevular</p>
          </div>
          <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-500">24 Haziran</span>
        </div>

        <div className="mt-3 divide-y divide-navy-50">
          {ROWS.map((row) => (
            <div key={row.name} className="flex items-center gap-3 py-2.5">
              <Avatar name={row.name} size="sm" />
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium text-navy-900">{row.name}</p>
                <p className="truncate text-xs text-navy-400">{row.service}</p>
              </div>
              <p className="text-xs font-medium text-navy-500">{row.time}</p>
              <span
                className={
                  row.status === "Onaylandı"
                    ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
                    : "rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200"
                }
              >
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -top-6 right-2 hidden animate-float items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-soft ring-1 ring-navy-900/5 sm:right-6 sm:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <TrendingUp className="h-4 w-4" />
        </span>
        <div className="text-left">
          <p className="text-sm font-semibold text-navy-900">+%32 randevu</p>
          <p className="text-[11px] text-navy-400">son 30 günde</p>
        </div>
      </div>

      <div
        className="absolute -bottom-5 left-2 hidden animate-float items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-soft ring-1 ring-navy-900/5 sm:left-6 sm:flex"
        style={{ animationDelay: "0.6s" }}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <p className="text-sm font-medium text-navy-900">Yeni randevu onaylandı</p>
      </div>
    </div>
  );
}
