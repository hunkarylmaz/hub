"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
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
  BadgeDollarSign,
  MoreHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/Logo";
import type { BusinessContext } from "@/lib/session";

const NAV = [
  { href: "/panel", label: "Genel Bakış", icon: LayoutDashboard, roles: ["OWNER", "STAFF"] },
  { href: "/panel/takvim", label: "Takvim", icon: CalendarDays, roles: ["OWNER", "STAFF"] },
  { href: "/panel/randevular", label: "Randevular", icon: ClipboardList, roles: ["OWNER", "STAFF"] },
  { href: "/panel/musteriler", label: "Müşteriler", icon: Users, roles: ["OWNER", "STAFF"] },
  { href: "/panel/kazanclarim", label: "Kazançlarım", icon: BadgeDollarSign, roles: ["STAFF"] },
  { href: "/panel/hizmetler", label: "Hizmetler", icon: Sparkles, roles: ["OWNER"] },
  { href: "/panel/calisanlar", label: "Çalışanlar", icon: UserCog, roles: ["OWNER"] },
  { href: "/panel/sayfa-ayarlari", label: "Public Sayfa Ayarları", icon: Globe, roles: ["OWNER"] },
  { href: "/panel/on-muhasebe", label: "Ön Muhasebe", icon: Wallet, roles: ["OWNER"] },
  { href: "/panel/gelir-gider", label: "Gelir-Gider", icon: ArrowLeftRight, roles: ["OWNER"] },
  { href: "/panel/raporlar", label: "Raporlar", icon: BarChart3, roles: ["OWNER"] },
  { href: "/panel/bildirimler", label: "Bildirimler", icon: Bell, roles: ["OWNER", "STAFF"] },
  { href: "/panel/ayarlar", label: "Ayarlar", icon: Settings, roles: ["OWNER", "STAFF"] },
  { href: "/panel/abonelik", label: "Abonelik", icon: CreditCard, roles: ["OWNER"] },
] as const;

const MOBILE_TAB_COUNT = 4;

function SidebarHeader({ businessName, onClose }: { businessName: string; onClose?: () => void }) {
  return (
    <div className="flex h-16 items-center justify-between gap-2 border-b border-navy-100 px-4">
      <Link href="/panel" className="flex items-center gap-2 overflow-hidden text-sm font-semibold text-navy-900">
        <LogoMark className="h-8 w-8 shrink-0" />
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

export function PanelSidebar({ businessName, membershipRole }: { businessName: string; membershipRole: BusinessContext["membershipRole"] }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleNav = NAV.filter((item) => (item.roles as readonly string[]).includes(membershipRole));
  const tabItems = visibleNav.slice(0, MOBILE_TAB_COUNT);
  const overflowItems = visibleNav.slice(MOBILE_TAB_COUNT);

  function isActive(href: string) {
    return href === "/panel" ? pathname === "/panel" : pathname.startsWith(href);
  }

  function NavLinks() {
    return (
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4 panel-scrollbar">
        {visibleNav.map((item) => {
          const active = isActive(item.href);
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

  const moreActive = overflowItems.some((item) => isActive(item.href));

  return (
    <>
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

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-navy-100 bg-white/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {tabItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10.5px] font-medium transition-colors",
                active ? "text-violet-700" : "text-navy-400"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        {overflowItems.length > 0 && (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10.5px] font-medium transition-colors",
              moreActive ? "text-violet-700" : "text-navy-400"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>Daha Fazla</span>
          </button>
        )}
      </nav>
    </>
  );
}
