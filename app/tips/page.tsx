"use client";

import Link from "next/link";
import { Header } from "@/components/header";

export default function PromptingTips() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Main navigation - transparent header bar */}
      <Header isCreateView={false} />
      
      {/* Content area - LIMITED WIDTH */}
      <div className="px-6 py-8 flex-1 mx-auto max-w-2xl w-full">
        <div className="bg-white rounded-lg border p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold">Prompting Tips</h1>
          </div>
          
          <div className="prose">
            <p className="mb-4">
              Effective prompting is key to getting the most out of large language models. This page will provide guidance on crafting better prompts.
            </p>
            
            <h2 className="text-xl font-medium mt-6 mb-3">Coming Soon</h2>
            <p>
              We're working on a comprehensive guide to help you create more effective prompts. Check back soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 