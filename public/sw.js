// Service worker minimo.
//
// Non fa cache di nulla: lascia passare ogni richiesta alla rete, esattamente
// come se non ci fosse. Esiste per un solo motivo — Chrome considera un sito
// "installabile" solo se ha un service worker con un gestore dell'evento
// `fetch`. Senza questo file, il pulsante "Aggiungi alla home" su Android non
// compare.
//
// Perché NON facciamo cache: un service worker che memorizza i file è la
// causa numero uno di "ho pubblicato la modifica ma vedo ancora la versione
// vecchia". Finché non serve davvero l'uso offline, quel problema non vale la
// pena. Se un giorno servirà, si aggiunge qui una strategia di cache
// esplicita e con versione.

self.addEventListener("install", () => {
  // Attiva subito la nuova versione invece di aspettare che tutte le schede
  // aperte vengano chiuse.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Volutamente vuoto: nessun respondWith, quindi il browser gestisce la
  // richiesta normalmente.
});
