import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Rezervasyo — Randevu, Müşteri ve Ön Muhasebe Yönetimi",
    template: "%s · Rezervasyo",
  },
  description:
    "Rezervasyo; berber, kuaför, güzellik salonu, klinik, psikolog ve danışmanlık işletmeleri için online randevu, müşteri yönetimi ve ön muhasebe platformu.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#161B3C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="font-sans">
      <body className="font-sans">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
