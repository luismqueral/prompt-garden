"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function ColophonPage() {
  const [markdownContent, setMarkdownContent] = useState<string>("");

  useEffect(() => {
    // Fetch the Colophon markdown content
    fetch('/COLOPHON.md')
      .then(response => response.text())
      .then(text => {
        setMarkdownContent(text);
      })
      .catch(error => {
        console.error('Error loading Colophon:', error);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Main navigation - transparent header bar */}
      <Header isCreateView={false} />
      
      {/* Content area - LIMITED WIDTH */}
      <div className="px-6 py-8 flex-1 mx-auto max-w-3xl w-full">
        <div className="bg-white rounded-lg border p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold">Colophon</h1>
            <p className="text-gray-500 text-sm mt-1">Technical details and architecture of Prompt Garden</p>
          </div>
          
          <div className="prose prose-sm max-w-none">
            {markdownContent ? (
              <div dangerouslySetInnerHTML={{ __html: require('marked').parse(markdownContent) }} 
                   className="[&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mt-8 [&>h2]:mb-4 
                             [&>h3]:text-lg [&>h3]:font-medium [&>h3]:mt-6 [&>h3]:mb-3
                             [&>p]:text-base [&>p]:leading-relaxed [&>p]:text-gray-700
                             [&>ul]:mt-3 [&>ul]:mb-6 [&>ul>li]:mt-2
                             [&>ol]:mt-3 [&>ol]:mb-6 [&>ol>li]:mt-2"
              />
            ) : (
              <p>Loading colophon content...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 