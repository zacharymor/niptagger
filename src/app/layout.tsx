import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Fraunces } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "800"],
});

const text = Fraunces({
  subsets: ["latin"],
  variable: "--font-text",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Niptagger",
  description: "Upload a picture, place the chest grid, and save winning squares as Battlenips levels.",
};

export const viewport: Viewport = {
  themeColor: "#1e2a4a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`}>
      <body>{children}</body>
    </html>
  );
}
