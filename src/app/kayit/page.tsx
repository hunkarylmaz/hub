import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { registerAction } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Lütfen tüm alanları doğru şekilde doldurun (şifre en az 6 karakter olmalı).",
  exists: "Bu e-posta adresiyle zaten bir hesap var.",
};

export default function KayitPage({ searchParams }: { searchParams: { error?: string } }) {
  const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] ?? "Bir hata oluştu." : null;

  return (
    <AuthShell title="İşletmenizi ücretsiz oluşturun" subtitle="2 dakikada kendi randevu sayfanız hazır olsun.">
      <form action={registerAction} className="space-y-4">
        {errorMessage && (
          <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{errorMessage}</div>
        )}
        <div>
          <Label htmlFor="fullName">Ad Soyad</Label>
          <Input id="fullName" name="fullName" autoComplete="name" placeholder="Adınız Soyadınız" required />
        </div>
        <div>
          <Label htmlFor="email">E-posta</Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="ornek@isletme.com" required />
        </div>
        <div>
          <Label htmlFor="phone">Telefon</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="05XX XXX XX XX" />
        </div>
        <div>
          <Label htmlFor="password">Şifre</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="En az 6 karakter" minLength={6} required />
        </div>
        <Button type="submit" className="w-full" size="lg">
          Ücretsiz Hesap Oluştur
        </Button>
        <p className="text-center text-xs text-navy-400">
          Kaydolarak <Link href="/kullanim-sartlari" className="underline">Kullanım Şartları</Link> ve{" "}
          <Link href="/gizlilik" className="underline">Gizlilik Politikası</Link>&apos;nı kabul edersiniz.
        </p>
      </form>
      <p className="mt-6 text-center text-sm text-navy-500">
        Zaten hesabınız var mı?{" "}
        <Link href="/giris" className="font-medium text-violet-600 hover:text-violet-700">
          Giriş yapın
        </Link>
      </p>
    </AuthShell>
  );
}
