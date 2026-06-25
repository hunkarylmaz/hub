"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ShieldCheck, LayoutDashboard, Building2, CreditCard, Layers, Users, ScrollText, MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/admin/isletmeler", label: "İşletmeler", icon: Building2 },
  { href: "/admin/abonelikler", label: "Abonelikler", icon: CreditCard },
  { href: "/admin/planlar", label: "Planlar", icon: Layers },
  { href: "/admin/kullanicilar", label: "Kullanıcılar", icon: Users },
  { href: "/admin/denetim-kayitlari", label: "Denetim Kayıtları", icon: ScrollText },
] as const;

const MOBILE_TAB_COUNT = 4;

function SidebarHeader({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex h-16 items-center justify-between gap-2 border-b border-navy-100 px-4">
      <Link href="/admin" className="flex items-center gap-2 overflow-hidden text-sm font-semibold text-navy-900">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-white">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <span className="truncate">Rezervasyo Admin</span>
      </Link>
      {onClose && (
        <button onClick={onClose} className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50" aria-label="Menüyü kapat">
          <X className="h-4.5 w-4.5" />
        </button>
      )}
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const tabItems = NAV.slice(0, MOBILE_TAB_COUNT);
  const overflowItems = NAV.slice(MOBILE_TAB_COUNT);

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  function NavLinks() {
    return (
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4 panel-scrollbar">
        {NAV.map((item) => {
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
            <SidebarHeader onClose={() => setMobileOpen(false)} />
            <NavLinks />
          </aside>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-navy-100 bg-white lg:flex">
        <SidebarHeader />
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
