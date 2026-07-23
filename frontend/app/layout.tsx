import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import ThemeProvider from "./components/ThemeProvider";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "JoinQ — Smart Queue Management",
  description:
    "Create digital queues, manage customers in real time, and reduce physical waiting with QR-based access.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body className={`${sora.variable} ${inter.variable}`}>
        <ThemeProvider />
        {children}
      </body>
    </html>
  );
}