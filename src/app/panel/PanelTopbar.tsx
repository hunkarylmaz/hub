import Link from "next/link";
import { ExternalLink, Bell, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { logoutAction } from "@/app/giris/actions";
import type { SafeUser } from "@/lib/types";

const ROLE_LABELS: Record<SafeUser["role"], string> = {
  SUPER_ADMIN: "Süper Admin",
  OWNER: "İşletme Sahibi",
  STAFF: "Çalışan",
};

export function PanelTopbar({
  user,
  businessSlug,
  unreadCount,
}: {
  user: SafeUser;
  businessSlug: string;
  unreadCount: number;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-navy-100 bg-white/80 px-4 backdrop-blur sm:px-6 lg:px-8">
      <Link
        href={`/${businessSlug}`}
        target="_blank"
        className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-navy-500 hover:bg-navy-50 hover:text-navy-900 sm:flex"
      >
        <ExternalLink className="h-4 w-4" />
        Randevu sayfamı görüntüle
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/panel/bildirimler"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-navy-500 hover:bg-navy-50 hover:text-navy-900"
          aria-label="Bildirimler"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <div className="hidden items-center gap-2.5 border-l border-navy-100 pl-3 sm:flex">
          <Avatar name={user.fullName} size="sm" />
          <div className="leading-tight">
            <p className="text-sm font-medium text-navy-900">{user.fullName}</p>
            <p className="text-xs text-navy-400">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-navy-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Çıkış yap"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>
    </header>
  );
}
