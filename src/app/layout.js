import { Geist, Geist_Mono, Corinthia, Gaegu } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Script face for the "Recipe" / site wordmark
const corinthia = Corinthia({
  variable: "--font-corinthia",
  weight: ["400", "700"],
  subsets: ["latin"],
});

// Handwriting face for the card's ingredient and direction lines
const gaegu = Gaegu({
  variable: "--font-gaegu",
  weight: ["300", "400", "700"],
  subsets: ["latin"],
});

export const metadata = {
  title: "Give Me The Recipe",
  description: "Recipe Extractor Website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${corinthia.variable} ${gaegu.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
