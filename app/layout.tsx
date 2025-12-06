import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/language-context";
import { Navbar } from "@/components/navbar";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HealthConnect - Rural Women's Healthcare Platform",
  description:
    "Bridging healthcare gaps for rural women in Sierra Leone through virtual consultations, health education, and community support.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <ToastProvider>
            <Navbar />
            {children}
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
