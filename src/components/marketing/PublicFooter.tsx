import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";

export function PublicFooter() {
  return (
    <footer className="border-t border-navy-100 bg-surface-subtle">
      <div className="container py-10">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold text-navy-900">
            <LogoMark className="h-7 w-7" />
            Rezervasyo
          </Link>
          <div className="flex items-center gap-6 text-sm text-navy-500">
            <Link href="/isletmeler" className="hover:text-navy-900">İşletmeler</Link>
            <Link href="/kvkk" className="hover:text-navy-900">KVKK</Link>
            <Link href="/gizlilik" className="hover:text-navy-900">Gizlilik</Link>
          </div>
        </div>
        <p className="mt-6 border-t border-navy-100 pt-6 text-center text-xs text-navy-400">
          © {new Date().getFullYear()} Rezervasyo. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
