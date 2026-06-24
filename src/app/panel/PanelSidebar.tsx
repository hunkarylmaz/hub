"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarCheck2,
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Sparkles,
  UserCog,
  Globe,
  Wallet,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Settings,
  CreditCard,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/panel", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/panel/takvim", label: "Takvim", icon: CalendarDays },
  { href: "/panel/randevular", label: "Randevular", icon: ClipboardList },
  { href: "/panel/musteriler", label: "Müşteriler", icon: Users },
  { href: "/panel/hizmetler", label: "Hizmetler", icon: Sparkles },
  { href: "/panel/calisanlar", label: "Çalışanlar", icon: UserCog },
  { href: "/panel/sayfa-ayarlari", label: "Public Sayfa Ayarları", icon: Globe },
  { href: "/panel/on-muhasebe", label: "Ön Muhasebe", icon: Wallet },
  { href: "/panel/gelir-gider", label: "Gelir-Gider", icon: ArrowLeftRight },
  { href: "/panel/raporlar", label: "Raporlar", icon: BarChart3 },
  { href: "/panel/bildirimler", label: "Bildirimler", icon: Bell },
  { href: "/panel/ayarlar", label: "Ayarlar", icon: Settings },
  { href: "/panel/abonelik", label: "Abonelik", icon: CreditCard },
] as const;

function SidebarHeader({ businessName, onClose }: { businessName: string; onClose?: () => void }) {
  return (
    <div className="flex h-16 items-center justify-between gap-2 border-b border-navy-100 px-4">
      <Link href="/panel" className="flex items-center gap-2 overflow-hidden text-sm font-semibold text-navy-900">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-white">
          <CalendarCheck2 className="h-4 w-4" />
        </span>
        <span className="truncate">{businessName}</span>
      </Link>
      {onClose && (
        <button onClick={onClose} className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50" aria-label="Menüyü kapat">
          <X className="h-4.5 w-4.5" />
        </button>
      )}
    </div>
  );
}

export function PanelSidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function NavLinks() {
    return (
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4 panel-scrollbar">
        {NAV.map((item) => {
          const active = item.href === "/panel" ? pathname === "/panel" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-violet-50 text-violet-700" : "text-navy-500 hover:bg-navy-50 hover:text-navy-900"
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-card lg:hidden"
        aria-label="Menüyü aç"
      >
        <Menu className="h-5 w-5 text-navy-700" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white">
            <SidebarHeader businessName={businessName} onClose={() => setMobileOpen(false)} />
            <NavLinks />
          </aside>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-navy-100 bg-white lg:flex">
        <SidebarHeader businessName={businessName} />
        <NavLinks />
      </aside>
    </>
  );
}
