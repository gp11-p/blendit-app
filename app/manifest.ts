import type { MetadataRoute } from "next";

// Manifest della web app: è il file che permette a Blendit di essere aggiunta
// alla schermata home e di aprirsi a schermo intero, senza barra del browser.
//
// Next lo serve automaticamente su /manifest.webmanifest partendo da questo
// file: non serve scrivere JSON a mano né collegarlo nel <head>.
//
// L'icona "maskable" è una versione con più margine attorno alla lettera:
// Android ritaglia le icone in forme diverse (cerchio, goccia, quadrato
// stondato) a seconda del telefono, e senza margine la B verrebbe tagliata.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Blendit — Cosa hai in frigo?",
    short_name: "Blendit",
    description:
      "Dimmi cosa hai in frigo, l'AI ti suggerisce cosa cucinare stasera.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7a1a4f",
    lang: "it",
    categories: ["food", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
