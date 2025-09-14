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

// Add Corinthia font
const corinthia = {
  variable: "--font-corinthia",
  style: "normal",
  weight: ["400", "700"],
  src: [
    {
      path: "https://fonts.gstatic.com/s/corinthia/v1/Corinthia-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "https://fonts.gstatic.com/s/corinthia/v1/Corinthia-Bold.ttf", 
      weight: "700",
      style: "normal",
    },
  ],
};

// Add Gaegu font
const gaegu = {
  variable: "--font-gaegu",
  style: "normal",
  weight: ["300", "400", "700"],
  src: [
    {
      path: "https://fonts.gstatic.com/s/gaegu/v1/gaegu-regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "https://fonts.gstatic.com/s/gaegu/v1/gaegu-bold.ttf",
      weight: "700", 
      style: "normal",
    },
  ],
};

export const metadata = {
  title: "Give Me The Recipe",
  description: "Recipe Extractor Website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Corinthia:wght@400;700&family=Gaegu:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ 
          '--font-corinthia': 'Corinthia, cursive',
          '--font-gaegu': 'Gaegu, cursive'
        }}
      >
        {children}
      </body>
    </html>
  );
}
