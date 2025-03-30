"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MdShuffle, MdArrowBack } from "react-icons/md";

interface Prompt {
  id: string;
  title: string;
  content: string;
}

export default function PromptDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
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

  // Handling the remix function
  const handleRemix = () => {
    if (!prompt) return;
    
    try {
      // Store the original content in sessionStorage temporarily
      sessionStorage.setItem("remixPromptContent", prompt.content);
      sessionStorage.setItem("remixPromptTitle", `${prompt.title} (Remix)`);
      // Also store the tags from the original prompt
      sessionStorage.setItem("remixPromptTags", JSON.stringify(tags));
      // Set a flag to focus and select the content textarea instead of the title
      sessionStorage.setItem("focusAndSelectContent", "true");
      
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
          <MdArrowBack className="mr-1" />
          View All Prompts
        </Link>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-semibold">{prompt.title}</h1>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRemix}
              className="flex items-center"
            >
              <MdShuffle className="h-4 w-4 mr-1.5" />
              Remix Prompt
            </Button>
          </div>
          
          <div className="mb-6">
            <div className="bg-white p-6 rounded-md mb-4 font-mono whitespace-pre-wrap border">
              {prompt.content}
            </div>
            
            <div className="flex justify-end">
              {renderTags()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 