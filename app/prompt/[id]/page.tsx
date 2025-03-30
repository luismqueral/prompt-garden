"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

interface Prompt {
  id: string;
  title: string;
  content: string;
}

export default function PromptDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [remixContent, setRemixContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    // Load the prompt from localStorage
    const savedPrompts = localStorage.getItem("promptGardenPrompts");
    if (savedPrompts) {
      try {
        const allPrompts = JSON.parse(savedPrompts) as Prompt[];
        const foundPrompt = allPrompts.find(p => p.id === params.id);
        if (foundPrompt) {
          setPrompt(foundPrompt);
          setRemixContent(foundPrompt.content);
          
          // Generate mock tags for the prompt
          setTags(getTagsForPrompt(foundPrompt));
        } else {
          router.push("/");
        }
      } catch (e) {
        console.error("Error parsing prompts from localStorage:", e);
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [params.id, router]);

  const handleSubmitRemix = () => {
    if (!prompt || !remixContent.trim()) return;
    
    try {
      // Store the remix content in sessionStorage temporarily
      sessionStorage.setItem("remixPromptContent", remixContent);
      sessionStorage.setItem("remixPromptTitle", `${prompt.title} (Remix)`);
      // Also store the tags from the original prompt
      sessionStorage.setItem("remixPromptTags", JSON.stringify(tags));
      // Set a flag to focus and select the title input
      sessionStorage.setItem("focusAndSelectTitle", "true");
      
      // Navigate to create page
      router.push("/?view=create");
    } catch (e) {
      console.error("Error preparing remix:", e);
    }
  };

  // Helper function to get tags for a prompt (mock implementation)
  function getTagsForPrompt(prompt: Prompt): string[] {
    if (prompt.title.toLowerCase().includes("content")) {
      return ["writing", "blog", "SEO"];
    } else if (prompt.title.toLowerCase().includes("code")) {
      return ["development", "programming", "technical"];
    } else if (prompt.title.toLowerCase().includes("image")) {
      return ["visual", "creative", "art"];
    } else {
      return ["prompt", "AI", "custom"];
    }
  }

  // Rendering the tags with simple styling
  const renderTags = () => {
    return (
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, index) => {
          return (
            <span 
              key={index}
              className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
            >
              {tag}
            </span>
          );
        })}
      </div>
    );
  };

  if (!prompt) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
        <div className="animate-pulse">Loading prompt...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Main navigation - transparent header bar */}
      <div className="bg-transparent px-6 py-4 flex justify-between items-center w-full">
        <div className="flex items-center">
          <Link href="/" className="font-bold text-xl hover:underline">🪴 Prompt Garden</Link>
          <span className="text-gray-500 ml-3 text-sm hidden sm:inline">Your collection of AI prompts</span>
        </div>
        <div className="invisible">Back to Prompts</div> {/* Placeholder for balanced spacing */}
      </div>
      
      {/* Content area - LIMITED WIDTH */}
      <div className="px-6 py-8 flex-1 mx-auto max-w-2xl w-full">
        {/* Back link - left aligned to content */}
        <Link href="/" className="flex items-center text-sm text-gray-600 hover:text-gray-800 mb-6">
          <svg 
            className="mr-1" 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
          View All Prompts
        </Link>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-semibold mb-4">{prompt.title}</h1>
          
          <div className="mb-6">
            <div className="bg-gray-50 p-6 rounded-md mb-4 font-mono whitespace-pre-wrap">
              {prompt.content}
            </div>
            
            <div className="flex justify-end">
              {renderTags()}
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t">
            <h2 className="text-lg font-medium mb-4">Remix Prompt</h2>
            <Textarea
              value={remixContent}
              onChange={(e) => setRemixContent(e.target.value)}
              className="min-h-48 resize-none mb-4 font-mono"
            />
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleSubmitRemix}>
                Submit Remix
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 