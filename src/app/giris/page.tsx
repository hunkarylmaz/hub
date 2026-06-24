import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { loginAction } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "E-posta ve şifre alanlarını doldurun.",
  invalid: "E-posta veya şifre hatalı.",
};

export default function GirisPage({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] ?? "Bir hata oluştu." : null;

  return (
    <AuthShell title="Hesabınıza giriş yapın" subtitle="Randevularınızı ve işletmenizi yönetmeye devam edin.">
      <form action={loginAction} className="space-y-4">
        {searchParams.next && <input type="hidden" name="next" value={searchParams.next} />}
        {errorMessage && (
          <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{errorMessage}</div>
        )}
        <div>
          <Label htmlFor="email">E-posta</Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="ornek@isletme.com" required />
        </div>
        <div>
          <Label htmlFor="password">Şifre</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
        </div>
        <Button type="submit" className="w-full" size="lg">
          Giriş Yap
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-navy-500">
        Henüz hesabınız yok mu?{" "}
        <Link href="/kayit" className="font-medium text-violet-600 hover:text-violet-700">
          Ücretsiz kaydolun
        </Link>
      </p>
    </AuthShell>
  );
}
