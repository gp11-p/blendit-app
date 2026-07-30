"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * Registra il service worker (public/sw.js) e segna l'apertura dell'app.
 *
 * Non renderizza niente: è solo un posto dove far girare del codice che deve
 * partire una volta sola, dal browser, dopo il caricamento della pagina.
 *
 * Il service worker serve a rendere l'app installabile su Android — vedi il
 * commento in public/sw.js.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    track("app_opened", {
      // Ci dice se la persona sta usando l'app installata sulla home o il
      // sito nel browser: è il segnale più diretto di quanto è "entrata"
      // nelle abitudini di qualcuno.
      standalone: window.matchMedia("(display-mode: standalone)").matches,
    });

    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // La registrazione fallisce in sviluppo su alcuni browser e su http non
      // sicuro. Non è un errore da mostrare: l'app funziona lo stesso, solo
      // non è installabile.
    });
  }, []);

  return null;
}
