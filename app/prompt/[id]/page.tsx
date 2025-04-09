"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PromptService } from '@/lib/api/promptService';
import { Header } from '@/components/header';
import { MdContentCopy, MdCheck, MdOutlineArrowBack, MdShuffle } from "react-icons/md";

// Type definition for Prompt
interface Prompt {
  id: string;
  title?: string;
  content: string;
  tags: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for parsed prompt sections
interface ParsedPromptSection {
  type: 'regular' | 'context' | 'follow-up';
  content: string;
  index?: number;
}

export default function PromptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [parsedContent, setParsedContent] = useState<ParsedPromptSection[]>([]);
  
  // Get the prompt ID from URL params
  const promptId = params.id as string;
  
  // Fetch prompt on component mount
  useEffect(() => {
    async function fetchPrompt() {
      try {
        setIsLoading(true);
        
        if (promptId === 'new') {
          // Handle new prompt creation
          router.push('/prompt/new');
          return;
        }
        
        const fetchedPrompt = await PromptService.getPromptById(promptId);
        setPrompt(fetchedPrompt);
        
        // Parse the prompt content for special sections
        setParsedContent(parsePromptContent(fetchedPrompt.content));
      } catch (error) {
        console.error('Error fetching prompt:', error);
        setError('Failed to load prompt. It may have been deleted or does not exist.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrompt();
  }, [promptId, router]);
  
  // Handle copy to clipboard
  const handleCopy = () => {
    if (!prompt) return;
    
    navigator.clipboard.writeText(prompt.content)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
      sessionStorage.setItem("remixPromptTitle", `${prompt.title || 'Untitled Prompt'} (Remix)`);
      // Also store the tags from the original prompt
      sessionStorage.setItem("remixPromptTags", JSON.stringify(prompt.tags));
      // Set a flag to focus and select the content textarea instead of the title
      sessionStorage.setItem("focusAndSelectContent", "true");
      
      // Navigate to create page
      router.push("/prompt/new");
    } catch (e) {
      console.error("Error preparing remix:", e);
    }
  };

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
  const processVariableSyntax = (text: string): React.ReactNode[] => {
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
          <span key={index} className="text-emerald-700 font-medium uppercase">
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
            <div key={`${index}-line-${i}`} className="pl-8 bg-yellow-50 border-l-4 border-yellow-200">
              <div className="flex items-start">
                <div className="text-yellow-700 line-through opacity-60">
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
    const contextNoteRegex = /\{\{CONTEXT_START\}\}(.*?)\{\{CONTEXT_END\}\}/g;
    let match;
    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    // Finding all context notes
    while ((match = contextNoteRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const contextContent = match[1];
      const matchStart = match.index;
      const matchIndex = result.length; // Create a unique key for each match

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header isCreateView={false} />
        <div className="max-w-2xl mx-auto p-6 flex justify-center items-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <p className="text-gray-600">Loading prompt...</p>
        </div>
      </div>
    );
  }
  
  if (error || !prompt) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header isCreateView={false} />
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error || 'Prompt not found.'}
          </div>
          <div className="mt-4">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Go Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header isCreateView={false} />
      
      <div className="px-6 py-8 flex-1 mx-auto max-w-2xl w-full">
        {/* Back link and Remix option row */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <MdOutlineArrowBack className="mr-1" />
            Back to Prompts
          </button>
          
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
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold">{prompt.title || 'Untitled Prompt'}</h1>
            
            <div className="flex space-x-2">
              <button
                onClick={handleCopy}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                title="Copy prompt"
              >
                {copied ? <MdCheck className="h-5 w-5 text-green-500" /> : <MdContentCopy className="h-5 w-5" />}
              </button>
              {/* Edit and delete buttons temporarily removed until admin authentication is implemented */}
            </div>
          </div>
          
          {/* Tags and categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            {prompt.category && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-3 h-3 mr-1"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" 
                  />
                </svg>
                {prompt.category}
              </span>
            )}
            
            {prompt.tags.filter(tag => tag !== prompt.category).map((tag, index) => (
              <span 
                key={index} 
                className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full flex items-center"
              >
                <span className="mr-1 font-medium">#</span>
                {tag}
              </span>
            ))}
          </div>
          
          {/* Prompt content */}
          <div className="relative h-full">
            {/* Vertical line */}
            <div className="absolute top-12 left-4 w-0.5 bg-gray-200 h-[calc(100%-3rem)] -ml-2"></div>
            
            {/* Content with proper styling */}
            <div 
              className="font-mono whitespace-pre-wrap p-4 mb-4 relative" 
              style={{ 
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                fontSize: '0.875rem',
                lineHeight: '1.6'
              }}
            >
              {parsedContent.map((section, index) => renderPromptSection(section, index))}
            </div>
          </div>
          
          {/* Metadata */}
          <div className="text-sm text-gray-500 border-t pt-4 mt-4">
            <div>Created: {new Date(prompt.createdAt).toLocaleString()}</div>
            <div>Last updated: {new Date(prompt.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 