import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blendit — Cosa hai in frigo?",
  description:
    "Dimmi cosa hai in frigo, l'AI ti suggerisce cosa cucinare stasera.",
  // Serve quando l'app viene aggiunta alla schermata home di un iPhone.
  appleWebApp: {
    capable: true,
    title: "Blendit",
    statusBarStyle: "default",
  },
  // Anteprima quando qualcuno condivide il link su WhatsApp o Instagram:
  // è il primo contatto che una persona ha con Blendit, e senza questi campi
  // apparirebbe come un link spoglio.
  openGraph: {
    title: "Blendit — Cosa hai in frigo?",
    description:
      "Dimmi cosa hai in frigo, l'AI ti suggerisce cosa cucinare stasera.",
    locale: "it_IT",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#7a1a4f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
        </footer>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
