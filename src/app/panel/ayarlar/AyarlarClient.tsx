"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User as UserIcon, Lock, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import type { SafeUser } from "@/lib/types";
import { updateAccountProfileAction, changePasswordAction } from "./actions";

const ROLE_LABELS: Record<SafeUser["role"], string> = {
  SUPER_ADMIN: "Süper Admin",
  OWNER: "İşletme Sahibi",
  STAFF: "Çalışan",
};

export function AyarlarClient({ user }: { user: SafeUser }) {
  const router = useRouter();
  const [profileForm, setProfileForm] = useState({ fullName: user.fullName, phone: user.phone ?? "" });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, startSaveProfile] = useTransition();

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, startSavePassword] = useTransition();

  function handleSaveProfile() {
    setProfileError(null);
    setProfileSaved(false);
    if (!profileForm.fullName.trim()) {
      setProfileError("Ad Soyad zorunludur.");
      return;
    }
    startSaveProfile(async () => {
      try {
        await updateAccountProfileAction({ fullName: profileForm.fullName, phone: profileForm.phone || null });
        router.refresh();
        setProfileSaved(true);
      } catch (e) {
        setProfileError(e instanceof Error ? e.message : "Kaydedilemedi.");
      }
    });
  }

  function handleChangePassword() {
    setPasswordError(null);
    setPasswordSaved(false);
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Yeni şifre en az 6 karakter olmalı.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Yeni şifreler eşleşmiyor.");
      return;
    }
    startSavePassword(async () => {
      try {
        await changePasswordAction({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setPasswordSaved(true);
      } catch (e) {
        setPasswordError(e instanceof Error ? e.message : "Şifre değiştirilemedi.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Hesap Bilgileri</CardTitle>
            <CardDescription>Kişisel bilgilerin ve rolün</CardDescription>
          </div>
          <UserIcon className="h-5 w-5 shrink-0 text-navy-400" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Ad Soyad</Label>
              <Input value={profileForm.fullName} onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input
                value={profileForm.phone}
                onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="05XX XXX XX XX"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>E-posta</Label>
              <Input value={user.email} disabled />
            </div>
            <div>
              <Label>Rol</Label>
              <Input value={ROLE_LABELS[user.role]} disabled />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            {profileError && <p className="text-sm font-medium text-red-600">{profileError}</p>}
            {profileSaved && !profileError && (
              <p className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                <Check className="h-4 w-4" /> Kaydedildi
              </p>
            )}
            <Button loading={savingProfile} onClick={handleSaveProfile}>
              Bilgileri Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Şifre Değiştir</CardTitle>
            <CardDescription>Hesabına giriş yaparken kullandığın şifreyi güncelle</CardDescription>
          </div>
          <Lock className="h-5 w-5 shrink-0 text-navy-400" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Mevcut Şifre</Label>
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Yeni Şifre</Label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
              />
            </div>
            <div>
              <Label>Yeni Şifre (Tekrar)</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            {passwordError && <p className="text-sm font-medium text-red-600">{passwordError}</p>}
            {passwordSaved && !passwordError && (
              <p className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                <Check className="h-4 w-4" /> Şifre güncellendi
              </p>
            )}
            <Button loading={savingPassword} onClick={handleChangePassword}>
              Şifreyi Güncelle
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
