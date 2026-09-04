import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "AI Lecture — Sorteio de Configuração | Unitri",
  description:
    "Sistema de sorteio de 5 configurações completas de PC para participantes da palestra sobre Inteligência Artificial na Unitri.",
  keywords: [
    "sorteio",
    "inteligência artificial",
    "palestra",
    "PC",
    "Belo Horizonte",
  ],
  openGraph: {
    title: "AI Lecture — Sorteio de PCs",
    description: "Participe do sorteio de 5 PCs completos na palestra sobre IA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Inter:wght@300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
