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
    if (!content) return [];

    // Pre-process to remove text after numbered sequences
    let processedContent = content;
    
    // Split content by lines to process follow-up sequences
    const lines = content.split('\n');
    
    // First identify all numbered lines
    const numberedLines = new Set<number>();
    lines.forEach((line, index) => {
      if (/^\d+\.\s+.*/.test(line)) {
        numberedLines.add(index);
      }
    });
    
    // Then filter out text after numbered sequences
    let inNumberedSequence = false;
    const filteredLines = lines.filter((line, index) => {
      // Check if this is a numbered line
      const isNumberedLine = numberedLines.has(index);
      
      // If we encounter a numbered line, mark that we're in a numbered sequence
      if (isNumberedLine) {
        inNumberedSequence = true;
        return true; // Keep numbered lines
      }
      
      // If we're in a numbered sequence
      if (inNumberedSequence) {
        // Check if line is a blank line, a note, or another numbered item - these end the sequence
        const isBlankLine = line.trim() === '';
        const isNote = line.trim().startsWith('>');
        const isAnotherNumbered = numberedLines.has(index);
        
        if (isBlankLine || isNote || isAnotherNumbered) {
          inNumberedSequence = false;
          return true; // Keep these lines
        }
        
        return false; // Skip all lines in a numbered sequence
      }
      
      // Keep all other lines
      return true;
    });
    
    // Join the filtered lines back into a string
    processedContent = filteredLines.join('\n');
    
    const sections: ParsedPromptSection[] = [];
    
    // Normalize line endings and split the content by double newlines
    const blocks = processedContent.replace(/\r\n/g, '\n').split(/\n\n+/);
    
    blocks.forEach(block => {
      // Process follow-up prompts in this block
      processBlockContent(block, sections);
    });
    
    return sections;
  };
  
  // Helper to process a block of content for special sections
  const processBlockContent = (block: string, sections: ParsedPromptSection[]) => {
    // First extract any numbered follow-ups
    const followUpMatches = block.match(/\n(\d+)\.\s+(.*?)(?=\n\d+\.\s+|\n>|\n```|$)/g);
    
    if (followUpMatches && followUpMatches.length > 0) {
      // Extract the main content before any follow-ups
      const mainContent = block.split(followUpMatches[0])[0].trim();
      
      if (mainContent) {
        // Process the main content for context notes
        sections.push({
          type: 'regular',
          content: processContextAnnotations(mainContent)
        });
      }
      
      // Process each follow-up
      followUpMatches.forEach(match => {
        const numberMatch = match.match(/\n(\d+)\.\s+/);
        if (numberMatch) {
          const index = parseInt(numberMatch[1], 10);
          const content = match.replace(/\n\d+\.\s+/, "").trim();
          
          if (content) {
            sections.push({
              type: 'follow-up',
              content: content,
              index: index
            });
          }
        }
      });
    } else {
      // No follow-ups, check for context notes
      sections.push({
        type: 'regular',
        content: processContextAnnotations(block)
      });
    }
  };
  
  // Helper function to process context annotations within a section
  const processContextAnnotations = (text: string): string => {
    // Process context notes using ">" prefix - use RegExp constructor to avoid 's' flag
    const contextRegex = new RegExp('\\n>\\s+(.*?)(?=\\n>|\\n```|\\n\\d+\\.|\\n\\n|$)', 'g');
    return text.replace(contextRegex, (match, contextContent) => {
      return `{{CONTEXT_START}}${contextContent.trim()}{{CONTEXT_END}}`;
    });
  };

  // Helper function to process and style variable syntax for text in [brackets]
  const processVariableSyntax = (text: string, hasTextAfterSequence?: boolean, setHasTextAfterSequence?: (value: boolean) => void): React.ReactNode[] => {
    // Split text by [variable] pattern
    const parts = text.split(/(\[[^\]]+\])/g);
    
    if (parts.length === 1) {
      // No variables found
      return [text];
    }
    
    // Transform each part
    return parts.map((part, index) => {
      if (part.match(/^\[[^\]]+\]$/)) {
        // It's a variable in brackets - convert to uppercase and style
        const variableText = part.slice(1, -1).toUpperCase();
        return (
          <span key={index} className="text-emerald-700 font-medium">
            {variableText}
          </span>
        );
      }
      return part;
    });
  };

  // Helper function to process regular content with context notes and numbered sequences
  const renderRegularSection = (content: string, index: number): React.ReactNode => {
    // First, check if this is a numbered sequence
    const numberedMatch = content.match(/^(\d+)\.\s+(.*)/);

    if (numberedMatch) {
      const number = numberedMatch[1];
      const restContent = numberedMatch[2];
      
      // Split the content into lines to process
      const lines = restContent.split('\n');
      
      // First identify sequence terminators
      const sequenceEndIndices: number[] = [];
      
      lines.forEach((line, lineIndex) => {
        // Consider these patterns as sequence terminators
        if (
          /^\d+\.\s+.*/.test(line) || // Another numbered item
          /^\[context:/.test(line) || // Context note
          /^```/.test(line.trim()) || // Code block 
          /^#/.test(line.trim()) // Heading
        ) {
          sequenceEndIndices.push(lineIndex);
        }
      });
      
      let inNumberedSequence = true;
      let result: React.ReactNode[] = [];
      
      // Add the number and first line
      result.push(
        <div key={`${index}-number`} className="flex items-start group">
          <span className="mr-2 font-bold text-gray-600">{number}.</span>
          <div className="flex-grow">
            {processVariableSyntax(lines[0])}
          </div>
        </div>
      );
      
      // Process remaining lines
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if this is a blank line
        const isBlankLine = line.trim() === '';
        
        // Check if this is a sequence terminator
        const isTerminator = sequenceEndIndices.includes(i);
        
        if (isTerminator) {
          inNumberedSequence = false;
        }
        
        if (isBlankLine && inNumberedSequence) {
          // Just add a blank line without ending the sequence
          result.push(
            <div key={`${index}-line-${i}`}>
              &nbsp;
            </div>
          );
          continue;
        }
        
        if (inNumberedSequence) {
          // This is content after a numbered sequence - display with strikethrough
          result.push(
            <div key={`${index}-line-${i}`} className="pl-6">
              <div className="flex items-start">
                <div className="text-gray-400 line-through opacity-60">
                  {processVariableSyntax(line)}
                </div>
              </div>
            </div>
          );
        } else {
          // Regular line after sequence ended
          result.push(
            <div key={`${index}-line-${i}`}>
              {processVariableSyntax(line)}
            </div>
          );
        }
      }
      
      return <div key={`section-${index}`}>{result}</div>;
    }

    // Process regular content with context notes
    const contextNoteRegex = /\[context:(.*?)\]/g;
    let match;
    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    // Finding all context notes
    while ((match = contextNoteRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const contextContent = match[1];
      const matchStart = match.index;
      const matchIndex = lastIndex; // Create a matchIndex for key

      // Add content before this context note
      if (matchStart > lastIndex) {
        result.push(
          <span key={`${index}-text-${matchIndex}`} className="block">
            {processVariableSyntax(content.substring(lastIndex, matchStart))}
          </span>
        );
      }

      // Add the context note
      result.push(
        <span key={`${index}-context-${matchIndex}`} className="block pl-3 py-2 my-2 border-l-4 border-gray-300 bg-gray-50 text-gray-600 text-sm">
          {contextContent.trim()}
        </span>
      );

      lastIndex = matchStart + fullMatch.length;
    }

    // Add any remaining content after the last context note
    if (lastIndex < content.length) {
      result.push(
        <span key={`${index}-text-last`} className="block">
          {processVariableSyntax(content.substring(lastIndex))}
        </span>
      );
    }

    // If we didn't find any context notes, just return the original content
    if (result.length === 0) {
      return <span key={`section-${index}`}>{processVariableSyntax(content)}</span>;
    }

    return <div key={`section-${index}`}>{result}</div>;
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
    
    // Clean the text by removing any remaining context markers and text after sequences
    let cleanedText = text
      .replace(/\{\{CONTEXT_START\}\}[\s\S]*?\{\{CONTEXT_END\}\}/g, '')
      .replace(/<context>[\s\S]*?<\/context>/g, '');
      
    // Filter out text after numbered sequences
    const lines = cleanedText.split('\n');
    
    // First identify all numbered lines
    const numberedLines = new Set<number>();
    lines.forEach((line, index) => {
      if (/^\d+\.\s+.*/.test(line)) {
        numberedLines.add(index);
      }
    });
    
    // Then filter out all text after numbered sequences until a blank line or new section
    let inNumberedSequence = false;
    const filteredLines = lines.filter((line, index) => {
      // Check if this is a numbered line
      const isNumberedLine = numberedLines.has(index);
      
      // If we encounter a numbered line, mark that we're in a numbered sequence
      if (isNumberedLine) {
        inNumberedSequence = true;
        return true; // Keep numbered lines
      }
      
      // If we're in a numbered sequence
      if (inNumberedSequence) {
        // Check if line is a blank line, a note, or another numbered item - these end the sequence
        const isBlankLine = line.trim() === '';
        const isNote = line.trim().startsWith('>');
        const isAnotherNumbered = numberedLines.has(index);
        
        if (isBlankLine || isNote || isAnotherNumbered) {
          inNumberedSequence = false;
          return true; // Keep these lines
        }
        
        return false; // Skip all lines in a numbered sequence
      }
      
      // Keep all other lines
      return true;
    });
    
    // Join the filtered lines back into a string
    cleanedText = filteredLines.join('\n')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
      
    navigator.clipboard.writeText(cleanedText)
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
            // Get the content div (which is the second div child of targetDiv - the inner content container)
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

  // Get category for a prompt (mock implementation)
  function getCategoryForPrompt(prompt: Prompt | null): string | null {
    if (!prompt) return null;
    
    if (prompt.title.toLowerCase().includes("content")) {
      return "writing";
    } else if (prompt.title.toLowerCase().includes("code")) {
      return "development";
    } else if (prompt.title.toLowerCase().includes("image")) {
      return "visual";
    } else {
      // 50% chance of having a category for other prompts
      return Math.random() > 0.5 ? "AI" : null;
    }
  }

  // Get color for a specific tag (consistent pastel colors)
  function getColorForTag(tag: string): { bg: string; text: string } {
    // Normalize tag to lowercase for consistent mapping
    const normalizedTag = tag.toLowerCase();
    
    // Map of tags to color combinations (pastel backgrounds with appropriate text colors)
    const colorMap: Record<string, { bg: string; text: string }> = {
      "writing": { bg: "bg-pink-100", text: "text-pink-800" },
      "blog": { bg: "bg-rose-100", text: "text-rose-800" },
      "seo": { bg: "bg-fuchsia-100", text: "text-fuchsia-800" },
      
      "development": { bg: "bg-blue-100", text: "text-blue-800" },
      "programming": { bg: "bg-indigo-100", text: "text-indigo-800" },
      "technical": { bg: "bg-sky-100", text: "text-sky-800" },
      
      "visual": { bg: "bg-green-100", text: "text-green-800" },
      "creative": { bg: "bg-emerald-100", text: "text-emerald-800" },
      "art": { bg: "bg-teal-100", text: "text-teal-800" },
      
      "food": { bg: "bg-orange-100", text: "text-orange-800" },
      "cooking": { bg: "bg-amber-100", text: "text-amber-800" },
      "recipe": { bg: "bg-yellow-100", text: "text-yellow-800" },
      
      "ai": { bg: "bg-purple-100", text: "text-purple-800" },
      "assistant": { bg: "bg-violet-100", text: "text-violet-800" },
      "general": { bg: "bg-slate-100", text: "text-slate-800" },
      
      "prompt": { bg: "bg-gray-100", text: "text-gray-800" },
      "custom": { bg: "bg-stone-100", text: "text-stone-800" }
    };
    
    // Return the color combination for the tag or a default
    return colorMap[normalizedTag] || { bg: "bg-gray-100", text: "text-gray-800" };
  }

  // Rendering the tags with simple styling
  const renderTags = () => {
    const category = getCategoryForPrompt(prompt);

    return (
      <div className="flex justify-between w-full">
        {/* Category pill on the left */}
        <div className="flex flex-wrap gap-1">
          {category && (
            <span 
              className={`text-xs px-2 py-1 rounded-full cursor-pointer transition-colors flex items-center gap-1 ${
                getColorForTag(category).bg} ${getColorForTag(category).text} hover:opacity-80`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none"
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor" 
                className="w-3 h-3"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" 
                />
              </svg>
              {category}
            </span>
          )}
        </div>
        
        {/* Tags on the right */}
        <div className="flex flex-wrap gap-1 justify-end">
          {tags.map((tag, index) => {
            // Skip the tag if it's the same as the category to avoid duplication
            if (tag === category) return null;
            
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
            className="block group cursor-pointer relative ml-8 mt-3"
            onClick={(e) => handleCopyPrompt(section.content, e)}
          >
            <div className="absolute -left-6 top-5 w-4 h-4 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center z-10">
            </div>
            <div 
              className="bg-white p-4 rounded-md mb-3 font-mono whitespace-pre-wrap group-hover:bg-gray-100 transition-colors line-clamp-6 max-h-60 overflow-hidden border relative border-gray-200"
              style={{ 
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                fontSize: '0.875rem'
              }}
            >
              {processVariableSyntax(section.content)}
              <div className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <MdContentCopy 
                  className="h-4 w-4"
                />
              </div>
            </div>
          </div>
        );
      
      case 'regular':
      default:
        return renderRegularSection(section.content, index);
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
        {/* Back link and Remix option row */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="flex items-center text-sm text-gray-600 hover:text-gray-800">
            <MdArrowBack className="mr-1" />
            View All Prompts
          </Link>
          
          <div 
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
            onClick={handleRemix}
          >
            <MdShuffle className="mr-1" />
            Remix Prompt
          </div>
        </div>
        
        {/* Dynamic warning that appears only when text after sequences is detected */}
        {(() => {
          // Check if there's text after numbered items
          if (!prompt?.content) return null;
          
          const lines = prompt.content.split('\n');
          for (let i = 1; i < lines.length; i++) {
            const prevLine = lines[i-1];
            const currentLine = lines[i];
            
            if (
              /^\d+\.\s+.*/.test(prevLine) && // Previous line is numbered
              currentLine.trim() !== '' && // Current line is not blank
              !/^\d+\.\s+.*/.test(currentLine) && // Current line is not numbered
              !currentLine.trim().startsWith('>') // Current line is not a note
            ) {
              // Found text right after a numbered item!
              return (
                <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-300 text-yellow-700 text-sm flex gap-2 items-start">
                  <span className="text-yellow-500 font-bold">⚠️</span>
                  <div>
                    <strong>Warning:</strong> Text after numbered items appears with strikethrough and in light gray because it won't be visible in cards or when copying. Add a blank line after numbered items to continue with regular text.
                  </div>
                </div>
              );
            }
          }
          return null; // No warning needed
        })()}
        
        <div className="bg-white rounded-lg border p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold">{prompt.title}</h1>
          </div>
          
          <div className="mb-6">
            {/* Render the parsed prompt content */}
            <div className="space-y-1 relative">
              {/* Check if there are any follow-up sections to display the connecting line */}
              {parsedContent.some(section => section.type === 'follow-up') && (
                <div className="absolute top-12 left-6 w-0.5 bg-gray-200 h-[calc(100%-3rem)] -ml-2"></div>
              )}
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