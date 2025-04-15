"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { Footer } from "@/components/footer";
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Prompt Garden</title>
        <meta name="description" content="A library of useful prompts for AI" />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <div className="flex flex-col min-h-screen">
            {children}
            <Footer />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
