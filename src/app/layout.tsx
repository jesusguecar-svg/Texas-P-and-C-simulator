import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simulador Texas P&C | Alleanza Academy",
  description: "Simulador avanzado en español para el examen Texas General Lines Property & Casualty.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
