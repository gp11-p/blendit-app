"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

// Invito ad aggiungere Blendit alla schermata home.
//
// Perché conta più di quanto sembri: senza account non abbiamo nessun modo di
// richiamare un utente — niente email, niente notifiche. L'icona sulla home è
// oggi l'unico "promemoria" che esista. Ed è anche il prerequisito tecnico
// per le notifiche push: su iPhone funzionano SOLO se l'app è stata aggiunta
// alla home (da iOS 16.4 in poi).
//
// I due sistemi si comportano in modo diverso:
// - Android/Chrome espone l'evento `beforeinstallprompt`, quindi possiamo
//   mostrare un vero pulsante "Installa".
// - iOS/Safari non lo espone: l'unica strada è spiegare a parole dove sta il
//   pulsante Condividi. Da qui le due varianti sotto.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "blendit-install-dismissed";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (window.localStorage.getItem(DISMISSED_KEY) === "1") return;

    // Se l'app è già aperta come app installata, non ha senso invitare a
    // installarla.
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // Proprietà non standard, esiste solo su Safari iOS.
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

    if (isIos) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowIosHint(true);
      setDismissed(false);
      return;
    }

    function handleBeforeInstallPrompt(event: Event) {
      // Blocchiamo il banner automatico del browser per mostrarlo noi al
      // momento giusto, con parole nostre.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setDismissed(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Se non possiamo ricordarcelo, al massimo lo rivedrà: nessun danno.
    }
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") track("app_installed");
    setDeferredPrompt(null);
    handleDismiss();
  }

  if (dismissed) return null;
  if (!deferredPrompt && !showIosHint) return null;

  return (
    <div className="relative flex items-start gap-3 rounded-2xl border border-border bg-muted/60 p-4">
      <div className="flex-1 text-sm">
        <p className="font-medium text-foreground">
          Tieni Blendit a portata di mano
        </p>
        {showIosHint ? (
          <p className="mt-1 text-muted-foreground">
            Tocca{" "}
            <Share className="inline size-3.5 align-text-bottom" /> in basso e
            poi <strong>Aggiungi a Home</strong>: si apre come un&apos;app, senza
            installare niente.
          </p>
        ) : (
          <>
            <p className="mt-1 text-muted-foreground">
              Aggiungila alla schermata home: si apre come un&apos;app, senza
              passare dal browser.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={handleInstall}
              className="mt-3 rounded-full"
            >
              Aggiungi alla home
            </Button>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Chiudi"
        className="cursor-pointer text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
