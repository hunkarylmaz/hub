"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "rezervasyo-install-dismissed-at";
const DISMISS_DAYS = 14;

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function PwaInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosTip, setIosTip] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    const dismissedRecently = Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
    if (dismissedRecently) return;

    function handleBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if (isIos()) {
      setIosTip(true);
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  async function handleInstall() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-3 z-50 flex items-center gap-3 rounded-2xl border border-navy-100 bg-white p-3 shadow-elevated lg:inset-x-auto lg:bottom-4 lg:left-4 lg:w-80"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)" }}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-900 to-violet-600 text-white">
        <Download className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-navy-900">Rezervasyo&apos;yu yükle</p>
        <p className="truncate text-xs text-navy-500">
          {iosTip ? "Paylaş düğmesinden Ana Ekrana Ekle'yi seçin" : "Ana ekranına ekleyip uygulama gibi kullan"}
        </p>
      </div>
      {!iosTip && (
        <Button onClick={handleInstall} size="sm" className="shrink-0">
          Yükle
        </Button>
      )}
      <button onClick={dismiss} aria-label="Kapat" className="shrink-0 rounded-lg p-1 text-navy-400 hover:bg-navy-50">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
