import Link from "next/link";
import { CalendarCheck2, ArrowLeft } from "lucide-react";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-subtle">
      <header className="border-b border-navy-100 bg-white">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold text-navy-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-900 text-white">
              <CalendarCheck2 className="h-4 w-4" />
            </span>
            Rezervasyo
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-900">
            <ArrowLeft className="h-4 w-4" /> Ana sayfa
          </Link>
        </div>
      </header>
      <main className="container max-w-2xl py-14">
        <h1 className="text-3xl font-semibold text-navy-900">{title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-navy-600">{children}</div>
      </main>
    </div>
  );
}
