import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prompt Garden - Simple UI",
  description: "A simple UI for creating and managing LLM prompts",
};

export default function SimpleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="bg-gradient-to-b from-white to-gray-50 min-h-screen">
          {children}
          <Toaster position="top-right" richColors />
        </div>
      </body>
    </html>
  );
} 