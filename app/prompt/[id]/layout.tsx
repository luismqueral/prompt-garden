import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prompt Details - Prompt Garden",
  description: "View and edit a specific prompt",
};

export default function PromptDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 