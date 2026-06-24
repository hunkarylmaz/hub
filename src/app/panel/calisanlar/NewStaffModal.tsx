"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { createStaffAction } from "./actions";

export function NewStaffModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isBookableOnline, setIsBookableOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  useEffect(() => {
    if (!open) return;
    setFullName("");
    setTitle("");
    setPhone("");
    setEmail("");
    setIsBookableOnline(true);
    setError(null);
  }, [open]);

  if (!open) return null;

  function handleSubmit() {
    setError(null);
    if (!fullName.trim()) {
      setError("Ad Soyad zorunludur.");
      return;
    }
    startSubmit(async () => {
      try {
        await createStaffAction({
          fullName,
          title: title || null,
          phone: phone || null,
          email: email || null,
          isBookableOnline,
        });
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Çalışan oluşturulamadı.");
      }
    });
  }

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

        <div className="flex items-center justify-between rounded-xl border border-navy-100 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-navy-900">Online Randevuda Görünsün</p>
            <p className="text-xs text-navy-400">Kapalıysa müşteriler online randevuda bu çalışanı seçemez.</p>
          </div>
          <Switch checked={isBookableOnline} onChange={setIsBookableOnline} />
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
