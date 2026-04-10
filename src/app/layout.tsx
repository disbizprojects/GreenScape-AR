import { Nav } from "@/components/Nav";
import { Providers } from "@/components/Providers";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GreenScape AR — AR plant marketplace",
  description:
    "Visualize plants in your space with AR, sunlight and weather-aware guidance, and a sustainable nursery marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f6faf8] text-zinc-900">
        <Providers>
          <Nav />
          <div className="flex-1">{children}</div>
          <footer className="border-t border-emerald-900/10 bg-white/60 py-8 text-center text-xs text-zinc-500">
            GreenScape AR · OpenStreetMap · Open-Meteo · WebXR / Scene Viewer
          </footer>
        </Providers>
      </body>
    </html>
  );
}
