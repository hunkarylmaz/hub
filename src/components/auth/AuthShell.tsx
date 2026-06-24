import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-gradient p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-hero-grid opacity-40" />
        <Link href="/" className="relative z-10 flex items-center gap-2 text-lg font-semibold">
          <LogoMark className="h-8 w-8" tone="white" />
          Rezervasyo
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            İşletmenizin tüm randevu ve müşteri yönetimi tek panelde.
          </h2>
          <p className="mt-4 text-sm text-white/70">
            Binlerce berber, kuaför, klinik ve danışmanlık işletmesi randevularını ve gelirlerini Rezervasyo ile yönetiyor.
          </p>
          <div className="mt-8 space-y-3 text-sm text-white/80">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-violet-300" /> Kendi randevu linkiniz dakikalar içinde hazır
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-violet-300" /> KVKK uyumlu, işletmeler arası tam veri izolasyonu
            </div>
          </div>
        </div>
        <p className="relative z-10 text-xs text-white/40">© {new Date().getFullYear()} Rezervasyo. Tüm hakları saklıdır.</p>
      </div>

      <div className="flex items-center justify-center bg-surface-subtle p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-semibold text-navy-900 lg:hidden">
            <LogoMark className="h-8 w-8" />
            Rezervasyo
          </Link>
          <h1 className="text-2xl font-semibold text-navy-900">{title}</h1>
          <p className="mt-1.5 text-sm text-navy-500">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}
