"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, KeyRound } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import type { CompensationType } from "@/lib/types";
import { COMPENSATION_TYPE_LABELS } from "@/lib/types";
import { createStaffAction } from "./actions";

export function NewStaffModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isBookableOnline, setIsBookableOnline] = useState(true);
  const [compensationType, setCompensationType] = useState<CompensationType>("FIXED");
  const [baseSalary, setBaseSalary] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [createLogin, setCreateLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFullName("");
    setTitle("");
    setPhone("");
    setEmail("");
    setIsBookableOnline(true);
    setCompensationType("FIXED");
    setBaseSalary("");
    setCommissionRate("");
    setCreateLogin(false);
    setError(null);
    setCredentials(null);
    setCopied(false);
  }, [open]);

  if (!open) return null;

  function handleSubmit() {
    setError(null);
    if (!fullName.trim()) {
      setError("Ad Soyad zorunludur.");
      return;
    }
    if (createLogin && !email.trim()) {
      setError("Giriş yetkisi vermek için e-posta zorunludur.");
      return;
    }
    startSubmit(async () => {
      try {
        const result = await createStaffAction({
          fullName,
          title: title || null,
          phone: phone || null,
          email: email || null,
          isBookableOnline,
          compensationType,
          baseSalary: baseSalary ? Number(baseSalary) : 0,
          commissionRate: commissionRate ? Number(commissionRate) : 0,
          createLogin,
        });
        router.refresh();
        if (result.generatedPassword) {
          setCredentials({ email: email.trim(), password: result.generatedPassword });
        } else {
          onClose();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Çalışan oluşturulamadı.");
      }
    });
  }

  function handleCopy() {
    if (!credentials) return;
    navigator.clipboard.writeText(`${credentials.email} / ${credentials.password}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (credentials) {
    return (
      <Modal open={open} onClose={onClose} title="Çalışan Oluşturuldu" description="Giriş bilgilerini paylaş" size="md">
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <KeyRound className="h-4 w-4" /> Bu şifre yalnızca bir kez gösterilir
            </p>
            <p className="mt-1 text-xs text-amber-700">Çalışanın panele giriş yapabilmesi için bu bilgileri not edin.</p>
          </div>
          <div className="space-y-2 rounded-xl border border-navy-100 bg-surface-subtle p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-navy-500">E-posta</span>
              <span className="font-medium text-navy-900">{credentials.email}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-navy-500">Şifre</span>
              <span className="font-mono font-medium text-navy-900">{credentials.password}</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Kopyalandı" : "Bilgileri Kopyala"}
          </Button>
          <div className="flex justify-end border-t border-navy-100 pt-4">
            <Button variant="primary" onClick={onClose}>
              Tamam
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  const showBaseSalary = compensationType === "FIXED" || compensationType === "FIXED_COMMISSION";
  const showCommissionRate = compensationType === "COMMISSION" || compensationType === "FIXED_COMMISSION";

  return (
    <Modal open={open} onClose={onClose} title="Yeni Çalışan" description="Ekibine yeni bir çalışan ekle" size="md">
      <div className="space-y-4">
        <div>
          <Label>Ad Soyad</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ayşe Yılmaz" />
        </div>
        <div>
          <Label>Unvan</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kuaför, Estetisyen, ..." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Telefon</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XX XXX XX XX" />
          </div>
          <div>
            <Label>E-posta</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ayse@example.com" />
          </div>
        </div>

        <div>
          <Label>Çalışma Tipi</Label>
          <Select value={compensationType} onChange={(e) => setCompensationType(e.target.value as CompensationType)}>
            {Object.entries(COMPENSATION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        {(showBaseSalary || showCommissionRate) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {showBaseSalary && (
              <div>
                <Label>Sabit Maaş (₺)</Label>
                <Input type="number" min="0" step="0.01" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} placeholder="0" />
              </div>
            )}
            {showCommissionRate && (
              <div>
                <Label>Komisyon Oranı (%)</Label>
                <Input type="number" min="0" max="100" step="0.1" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} placeholder="0" />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between rounded-xl border border-navy-100 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-navy-900">Online Randevuda Görünsün</p>
            <p className="text-xs text-navy-400">Kapalıysa müşteriler online randevuda bu çalışanı seçemez.</p>
          </div>
          <Switch checked={isBookableOnline} onChange={setIsBookableOnline} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-navy-100 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-navy-900">Personel Paneline Giriş Yapabilsin</p>
            <p className="text-xs text-navy-400">Açarsan otomatik şifre oluşturulur, çalışan e-postasıyla panele giriş yapabilir.</p>
          </div>
          <Switch checked={createLogin} onChange={setCreateLogin} />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            Çalışanı Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
}
