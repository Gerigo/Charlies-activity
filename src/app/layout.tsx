import type { Metadata, Viewport } from "next";
import { Manrope, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import BottomNav from "@/components/ui/BottomNav";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Charlie",
  description: "Suivi des activités de Charlie",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${manrope.variable} ${instrumentSerif.variable}`}>
      <body style={{ margin: 0, padding: 0, minHeight: '100dvh', fontFamily: 'var(--font-manrope)', WebkitFontSmoothing: 'antialiased' }}>
        <AppProvider>
          <div style={{ maxWidth: 430, margin: '0 auto', height: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              {children}
            </main>
            <BottomNav />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
