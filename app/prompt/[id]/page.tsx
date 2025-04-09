"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PromptService } from '@/lib/api/promptService';
import { Header } from '@/components/header';
import { MdOutlineArrowBack, MdContentCopy, MdCheck } from "react-icons/md";
import Link from 'next/link';

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

export default function PromptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
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
      } catch (error) {
        console.error('Error fetching prompt:', error);
        setError('Failed to load prompt. It may have been deleted or does not exist.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrompt();
  }, [promptId, router]);
  
  // Extract and process the prompt content with inline notes
  const processPromptContent = (content: string): { 
    mainPromptLines: Array<{type: 'text' | 'note', content: string}>,
    followUps: Array<{
      content: string, 
      notes: string[]
    }>
  } => {
    if (!content) return { mainPromptLines: [], followUps: [] };
    
    const lines = content.split('\n');
    const mainPromptLines: Array<{type: 'text' | 'note', content: string}> = [];
    const followUps: Array<{ content: string, notes: string[] }> = [];
    
    let currentFollowUp = '';
    let currentFollowUpNotes: string[] = [];
    let inNumberedSequence = false;
    const numberPattern = /^\d+\.\s+(.*)/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a title line (starting with #)
      if (line.trim().match(/^#\s+.*$/)) {
        continue; // Skip title lines
      }
      
      // Check if this is a note line (starting with >)
      if (line.trim().startsWith('>')) {
        const noteContent = line.trim().replace(/^>\s?/, '');
        
        if (inNumberedSequence) {
          // Add to current follow-up notes
          currentFollowUpNotes.push(noteContent);
        } else {
          // Add to main prompt notes
          mainPromptLines.push({ type: 'note', content: noteContent });
        }
        continue;
      }
      
      // Check if this is a numbered list item
      const match = line.match(numberPattern);
      if (match) {
        // If we already had a follow-up prompt, save it before starting a new one
        if (currentFollowUp) {
          followUps.push({ 
            content: currentFollowUp.trim(),
            notes: currentFollowUpNotes
          });
          currentFollowUpNotes = [];
        }
        
        // Start a new follow-up prompt
        currentFollowUp = match[1];
        inNumberedSequence = true;
      } else if (inNumberedSequence) {
        // Handle continuation of numbered sequence
        if (line.trim() === '') {
          const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
          if (!nextLine.match(numberPattern) && !nextLine.trim().startsWith('>')) {
            // End of this follow-up
            followUps.push({ 
              content: currentFollowUp.trim(),
              notes: currentFollowUpNotes
            });
            currentFollowUp = '';
            currentFollowUpNotes = [];
            inNumberedSequence = false;
            // Add empty line to main content if needed
            if (mainPromptLines.length > 0 && mainPromptLines[mainPromptLines.length - 1].type === 'text') {
              mainPromptLines[mainPromptLines.length - 1].content += '\n';
            } else {
              mainPromptLines.push({ type: 'text', content: '' });
            }
          } else {
            // The next line is a numbered item or note, so this empty line belongs to the follow-up
            currentFollowUp += '\n';
          }
        } else {
          // Add the line to the current follow-up
          currentFollowUp += '\n' + line;
        }
      } else {
        // Add regular line to main prompt
        if (mainPromptLines.length > 0 && mainPromptLines[mainPromptLines.length - 1].type === 'text') {
          // Append to existing text block
          mainPromptLines[mainPromptLines.length - 1].content += 
            (mainPromptLines[mainPromptLines.length - 1].content ? '\n' : '') + line;
        } else {
          // Start a new text block
          mainPromptLines.push({ type: 'text', content: line });
        }
      }
    }
    
    // Don't forget to add the last follow-up if there is one
    if (currentFollowUp) {
      followUps.push({ 
        content: currentFollowUp.trim(),
        notes: currentFollowUpNotes
      });
    }
    
    return { mainPromptLines, followUps };
  };
  
  // Check if a tag is a category
  const isCategory = (tag: string): boolean => {
    // Check if the tag matches the prompt's category
    return prompt?.category?.toLowerCase() === tag.toLowerCase();
  };
  
  // Get color for a specific tag (consistent pastel colors)
  function getColorForTag(tag: string): { bg: string; text: string } {
    // Normalize tag to lowercase for consistent mapping
    const normalizedTag = tag.toLowerCase();
    
    // Generate consistent color based on tag string
    const colors = [
      { bg: "bg-pink-100", text: "text-pink-800" },
      { bg: "bg-rose-100", text: "text-rose-800" },
      { bg: "bg-fuchsia-100", text: "text-fuchsia-800" },
      { bg: "bg-blue-100", text: "text-blue-800" },
      { bg: "bg-indigo-100", text: "text-indigo-800" },
      { bg: "bg-sky-100", text: "text-sky-800" },
      { bg: "bg-green-100", text: "text-green-800" },
      { bg: "bg-emerald-100", text: "text-emerald-800" },
      { bg: "bg-teal-100", text: "text-teal-800" },
      { bg: "bg-orange-100", text: "text-orange-800" },
      { bg: "bg-amber-100", text: "text-amber-800" },
      { bg: "bg-yellow-100", text: "text-yellow-800" },
      { bg: "bg-purple-100", text: "text-purple-800" },
      { bg: "bg-violet-100", text: "text-violet-800" },
      { bg: "bg-slate-100", text: "text-slate-800" },
      { bg: "bg-cyan-100", text: "text-cyan-800" },
      { bg: "bg-red-100", text: "text-red-800" },
      { bg: "bg-lime-100", text: "text-lime-800" }
    ];
    
    // Get a consistent hash code for the tag
    let hashCode = 0;
    for (let i = 0; i < normalizedTag.length; i++) {
      hashCode = (hashCode << 5) - hashCode + normalizedTag.charCodeAt(i);
      hashCode = hashCode & hashCode; // Convert to 32bit integer
    }
    
    // Use the hash to select a color
    const colorIndex = Math.abs(hashCode) % colors.length;
    
    // For categories, use a specific set of colors to ensure they stand out
    if (isCategory(normalizedTag)) {
      return { bg: "bg-cyan-100", text: "text-cyan-800" };
    }
    
    // Return the color for the tag
    return colors[colorIndex];
  }

  // Function to copy text to clipboard
  const copyToClipboard = (text: string, promptType: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedText(promptType);
        // Reset after 2 seconds
        setTimeout(() => {
          setCopiedText(null);
        }, 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
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
        {/* Back link */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <MdOutlineArrowBack className="mr-1" />
            Back to Prompts
          </button>
        </div>
        
        {/* Main prompt card - using the exact same styling as homepage */}
        <div className="mb-8 bg-white p-5 rounded-lg border border-gray-100">
          {/* Title */}
          {prompt.title && (
            <div className="mb-3">
              <h3 className="text-xl font-medium">
                {prompt.title}
              </h3>
            </div>
          )}
          
          {/* Prompt content - Main prompt and follow-ups with inline notes */}
          <div className="block">
            {/* Main prompt with inline notes */}
            <div>
              {processPromptContent(prompt.content).mainPromptLines.map((line, index) => (
                <React.Fragment key={index}>
                  {line.type === 'note' ? (
                    <div className="bg-gray-50 border-l-4 border-gray-300 p-3 mb-2 text-gray-700 text-sm">
                      {line.content}
                    </div>
                  ) : line.content ? (
                    <div 
                      className="group bg-white p-4 rounded-md mb-3 font-mono whitespace-pre-wrap hover:bg-gray-100 transition-colors border relative cursor-pointer" 
                      style={{ 
                        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                        fontSize: '0.875rem'
                      }}
                      onClick={() => copyToClipboard(line.content, `main-${index}`)}
                    >
                      {line.content}
                      <div className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {copiedText === `main-${index}` ? (
                          <MdCheck className="h-4 w-4 text-green-500" />
                        ) : (
                          <MdContentCopy className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  ) : null}
                </React.Fragment>
              ))}
            </div>
            
            {/* Follow-up prompts with their own notes */}
            {processPromptContent(prompt.content).followUps.map((followUp, index) => (
              <div key={index} className="ml-6 mb-3">
                <div className="flex items-start">
                  <div className="mr-2 mt-4 text-gray-400">{index + 1}.</div>
                  <div className="flex-1">
                    {/* Follow-up notes that appear before the prompt */}
                    {followUp.notes.map((note, noteIndex) => (
                      <div 
                        key={`note-${noteIndex}`}
                        className="bg-gray-50 border-l-4 border-gray-300 p-3 mb-2 text-gray-700 text-sm"
                      >
                        {note}
                      </div>
                    ))}
                    
                    {/* Follow-up prompt content */}
                    <div 
                      className="group bg-white p-4 rounded-md font-mono whitespace-pre-wrap hover:bg-gray-100 transition-colors border relative cursor-pointer" 
                      style={{ 
                        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                        fontSize: '0.875rem'
                      }}
                      onClick={() => copyToClipboard(followUp.content, `followup-${index}`)}
                    >
                      {followUp.content}
                      <div className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {copiedText === `followup-${index}` ? (
                          <MdCheck className="h-4 w-4 text-green-500" />
                        ) : (
                          <MdContentCopy className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Tags and Category section - Exactly matching the homepage */}
          <div className="flex justify-between mt-6">
            {/* Category pill on the left */}
            <div className="flex flex-wrap gap-1">
            {prompt.category && (
                <span 
                  className={`text-xs px-2 py-1 rounded-full cursor-pointer transition-colors flex items-center gap-1 ${
                    getColorForTag(prompt.category).bg} ${getColorForTag(prompt.category).text} hover:opacity-80`}
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
                {prompt.category}
              </span>
            )}
            </div>
            
            {/* Tags on the right */}
            <div className="flex flex-wrap gap-1 justify-start">
              {prompt.tags
                .filter(tag => tag !== prompt.category) // Skip the tag if it's the same as the category
                .map((tag, index) => (
              <span 
                key={index} 
                    className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 cursor-pointer hover:opacity-80 flex items-center"
              >
                <span className="mr-1 font-medium">#</span>
                {tag}
              </span>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 