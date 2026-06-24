import { LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { logoutAction } from "@/app/giris/actions";
import type { SafeUser } from "@/lib/types";

export function AdminTopbar({ user }: { user: SafeUser }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-navy-100 bg-white/80 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div />
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2.5 border-l border-navy-100 pl-3 sm:flex">
          <Avatar name={user.fullName} size="sm" />
          <div className="leading-tight">
            <p className="text-sm font-medium text-navy-900">{user.fullName}</p>
            <p className="text-xs text-navy-400">Süper Admin</p>
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
