"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MdShuffle, MdArrowBack, MdContentCopy } from "react-icons/md";

interface Prompt {
  id: string;
  title: string;
  content: string;
}

// Interface for parsed prompt sections
interface ParsedPromptSection {
  type: 'regular' | 'context' | 'follow-up';
  content: string;
  index?: number;
}

export default function PromptDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [parsedContent, setParsedContent] = useState<ParsedPromptSection[]>([]);

  useEffect(() => {
    // Load the prompt from localStorage
    const savedPrompts = localStorage.getItem("promptGardenPrompts");
    if (savedPrompts) {
      try {
        const allPrompts = JSON.parse(savedPrompts) as Prompt[];
        const foundPrompt = allPrompts.find(p => p.id === params.id);
        if (foundPrompt) {
          setPrompt(foundPrompt);
          
          // Parse the prompt content for special sections
          setParsedContent(parsePromptContent(foundPrompt.content));
          
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

  // Parse prompt content to identify special sections
  const parsePromptContent = (content: string): ParsedPromptSection[] => {
    const sections: ParsedPromptSection[] = [];
    
    // Regular expression to match context and follow-up tags
    const contextRegex = /<context>([\s\S]*?)<\/context>/g;
    const followUpRegex = /<follow-up>([\s\S]*?)<\/follow-up>/g;
    
    // First, extract the follow-up sections (these should be completely separate)
    const followUpSections: {start: number; end: number; content: string; index: number}[] = [];
    let followUpCount = 0;
    let followUpMatch;
    
    while ((followUpMatch = followUpRegex.exec(content)) !== null) {
      followUpCount++;
      followUpSections.push({
        start: followUpMatch.index,
        end: followUpMatch.index + followUpMatch[0].length,
        content: followUpMatch[1],
        index: followUpCount
      });
    }
    
    // If there are follow-up sections, split the content at these points
    if (followUpSections.length > 0) {
      // Sort by position
      followUpSections.sort((a, b) => a.start - b.start);
      
      // Get the main content (everything before the first follow-up)
      const mainContent = content.substring(0, followUpSections[0].start);
      
      // Add main content section with context annotations
      sections.push({
        type: 'regular',
        content: processContextAnnotations(mainContent)
      });
      
      // Add follow-up sections
      followUpSections.forEach((section, i) => {
        sections.push({
          type: 'follow-up',
          content: section.content.trim(),
          index: section.index
        });
        
        // If there's content between this follow-up and the next one, add it
        if (i < followUpSections.length - 1) {
          const betweenContent = content.substring(
            section.end,
            followUpSections[i + 1].start
          );
          
          if (betweenContent.trim()) {
            sections.push({
              type: 'regular',
              content: processContextAnnotations(betweenContent)
            });
          }
        }
      });
      
      // Add any remaining content after the last follow-up
      const afterLastFollowUp = content.substring(followUpSections[followUpSections.length - 1].end);
      if (afterLastFollowUp.trim()) {
        sections.push({
          type: 'regular',
          content: processContextAnnotations(afterLastFollowUp)
        });
      }
    } else {
      // No follow-ups, just process the whole content for context annotations
      sections.push({
        type: 'regular',
        content: processContextAnnotations(content)
      });
    }
    
    return sections;
  };
  
  // Helper function to process context annotations within a section
  const processContextAnnotations = (text: string): string => {
    // Process context tags with careful handling of whitespace
    return text.replace(/<context>([\s\S]*?)<\/context>/g, (match, contextContent, offset, fullText) => {
      const prevChar = offset > 0 ? fullText[offset - 1] : '';
      const nextChar = offset + match.length < fullText.length ? fullText[offset + match.length] : '';
      
      // Check if the context tag is surrounded by newlines
      const isInOwnParagraph = 
        (prevChar === '\n' || offset === 0) && 
        (nextChar === '\n' || offset + match.length === fullText.length);
      
      // If it's in its own paragraph, don't add extra spaces
      if (isInOwnParagraph) {
        return `{{CONTEXT_START}}${contextContent.trim()}{{CONTEXT_END}}`;
      }
      
      // Otherwise, insert it inline with appropriate spacing
      return `{{CONTEXT_START}}${contextContent.trim()}{{CONTEXT_END}}`;
    });
  };
  
  // Render a regular prompt section with context annotations
  const renderRegularSection = (content: string, index: number) => {
    // Split the content by context markers
    const parts = content.split(/\{\{CONTEXT_START\}\}|\{\{CONTEXT_END\}\}/);
    const result: React.ReactNode[] = [];
    
    parts.forEach((part, i) => {
      if (i % 2 === 0) {
        // Regular content
        if (part) {
          result.push(
            <span key={`${index}-${i}`} className="block">{part}</span>
          );
        }
      } else {
        // Context annotation
        result.push(
          <span key={`${index}-${i}`} className="bg-gray-100 text-gray-600 italic text-sm px-2 py-1 ml-2 rounded inline-block">
            <span className="text-xs uppercase text-gray-500 font-medium mr-1">Note:</span>
            {part}
          </span>
        );
      }
    });
    
    return (
      <div 
        key={index}
        className="bg-white p-4 rounded-md my-3 font-mono whitespace-pre-wrap border relative group cursor-pointer"
        onClick={(e) => handleCopyPrompt(content.replace(/\{\{CONTEXT_START\}\}[\s\S]*?\{\{CONTEXT_END\}\}/g, ''), e)}
      >
        {result}
        <div className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <MdContentCopy className="h-4 w-4" />
        </div>
      </div>
    );
  };

  // Function to handle copying prompt sections to clipboard
  const handleCopyPrompt = (text: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Get the target element safely
    const targetDiv = e.currentTarget as HTMLElement;
    if (!targetDiv) {
      console.error('Target element not found');
      return;
    }
    
    navigator.clipboard.writeText(text)
      .then(() => {
        try {
          // Show a small icon notification in the top right corner
          const notificationEl = document.createElement('div');
          notificationEl.className = 'absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 z-10 opacity-0 transition-opacity';
          notificationEl.style.display = 'flex';
          notificationEl.style.alignItems = 'center';
          notificationEl.style.justifyContent = 'center';
          notificationEl.style.width = '24px';
          notificationEl.style.height = '24px';
          
          // Use React to render the icon
          const iconContainer = document.createElement('div');
          // This is a workaround as we can't directly render React components here
          // Create an SVG that matches the MdCheck icon
          iconContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
          </svg>`;
          notificationEl.appendChild(iconContainer.firstChild!);
          
          // Ensure position is relative before appending
          if (targetDiv) {
            // Get the content div (which is the first div child of targetDiv)
            const contentDiv = targetDiv.querySelector('div');
            if (contentDiv) {
              if (getComputedStyle(contentDiv).position === 'static') {
                contentDiv.style.position = 'relative';
              }
              contentDiv.appendChild(notificationEl);
              
              // Add fade-in effect
              setTimeout(() => {
                notificationEl.style.opacity = '1';
                notificationEl.style.transition = 'opacity 0.2s ease-in-out';
              }, 10);
              
              // Remove the notification after a delay with fade-out
              setTimeout(() => {
                notificationEl.style.opacity = '0';
                setTimeout(() => {
                  if (contentDiv && contentDiv.contains(notificationEl)) {
                    contentDiv.removeChild(notificationEl);
                  }
                }, 200); // Wait for fade out animation
              }, 1500);
            }
          }
        } catch (err) {
          console.error('Error showing notification:', err);
        }
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

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

  // Render a prompt section based on its type
  const renderPromptSection = (section: ParsedPromptSection, index: number) => {
    switch (section.type) {
      case 'follow-up':
        return (
          <div 
            key={index}
            className="bg-white p-4 rounded-md my-4 border border-blue-100 relative group cursor-pointer"
            onClick={(e) => handleCopyPrompt(section.content, e)}
          >
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {section.index}
            </div>
            <div className="font-mono whitespace-pre-wrap">{section.content}</div>
            <div className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <MdContentCopy className="h-4 w-4" />
            </div>
          </div>
        );
      
      case 'regular':
      default:
        return (
          <div 
            key={index}
            className="bg-white p-4 rounded-md my-3 font-mono whitespace-pre-wrap border relative group cursor-pointer"
            onClick={(e) => handleCopyPrompt(section.content, e)}
          >
            {section.content}
            <div className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <MdContentCopy className="h-4 w-4" />
            </div>
          </div>
        );
    }
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
            {/* Render the parsed prompt content */}
            <div className="space-y-1">
              {parsedContent.map((section, index) => renderPromptSection(section, index))}
            </div>
            
            <div className="flex justify-end mt-4">
              {renderTags()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 