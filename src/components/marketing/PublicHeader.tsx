import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-navy-100 bg-white/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold text-navy-900">
          <LogoMark className="h-8 w-8" />
          Rezervasyo
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-navy-600 md:flex">
          <Link href="/isletmeler" className="hover:text-navy-900">İşletmeler</Link>
          <Link href="/#ozellikler" className="hover:text-navy-900">Özellikler</Link>
          <Link href="/#fiyatlandirma" className="hover:text-navy-900">Fiyatlandırma</Link>
          <Link href="/#sss" className="hover:text-navy-900">SSS</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/giris">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Giriş Yap</Button>
          </Link>
          <Link href="/kayit">
            <Button variant="secondary" size="sm">Ücretsiz Başla</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
