"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  Instagram,
  QrCode,
  ExternalLink,
  ArrowRight,
  CalendarCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export function HazirClient({ businessName, slug }: { businessName: string; slug: string }) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const publicPath = `/${slug}`;
  const publicUrl = origin ? `${origin}${publicPath}` : publicPath;
  const caption = `${businessName} artık Rezervasyo'da! Randevunuzu hemen oluşturun: ${publicUrl}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(caption)}`;

  async function copyToClipboard(text: string, onDone: () => void) {
    try {
      await navigator.clipboard.writeText(text);
      onDone();
      toast.success("Kopyalandı");
    } catch {
      toast.error("Kopyalanamadı, lütfen metni manuel olarak seçip kopyalayın.");
    }
  }

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
        </div>
      </header>

      <main className="container max-w-2xl py-14">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-navy-900 sm:text-3xl">Randevu sayfanız hazır</h1>
          <p className="mt-2 max-w-md text-sm text-navy-500">
            {businessName} artık Rezervasyo&apos;da. 14 günlük ücretsiz deneme süreniz başladı, müşterileriniz randevu almaya
            hazır.
          </p>
        </div>

        <Card className="mt-8">
          <CardContent className="p-5 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Randevu Sayfanız</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-11 flex-1 items-center overflow-x-auto rounded-xl border border-navy-200 bg-navy-50/60 px-3.5 text-sm font-medium text-navy-800 whitespace-nowrap">
                {origin ? `${origin.replace(/^https?:\/\//, "")}${publicPath}` : publicPath}
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  copyToClipboard(publicUrl, () => {
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  })
                }
              >
                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedLink ? "Kopyalandı" : "Kopyala"}
              </Button>
              <Button variant="ghost" aria-label="Sayfayı görüntüle" onClick={() => window.open(publicPath, "_blank", "noopener")}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => window.open(whatsappHref, "_blank", "noopener,noreferrer")}
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp&apos;ta Paylaş
              </Button>
              <div className="flex items-center justify-between rounded-xl border border-dashed border-navy-200 px-3.5 text-sm text-navy-400">
                <span className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" /> QR Kod
                </span>
                <span className="rounded-full bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-500">Yakında</span>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Instagram Biyografi Önerisi</p>
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-navy-100 bg-navy-50/40 p-3.5">
                <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                <p className="flex-1 text-sm text-navy-600">{caption}</p>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(caption, () => {
                      setCopiedCaption(true);
                      setTimeout(() => setCopiedCaption(false), 2000);
                    })
                  }
                  className="shrink-0 text-navy-400 hover:text-navy-700"
                  aria-label="Metni kopyala"
                >
                  {copiedCaption ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center">
          <Button size="lg" onClick={() => router.push("/panel")}>
            Panele Git <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
