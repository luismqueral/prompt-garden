"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { PromptService } from '@/lib/api/promptService';
import { CursorRuleService } from '@/lib/api/cursorRuleService';
import { Prompt } from '@/lib/googleSheets';
import { MdContentCopy, MdCheck, MdEdit, MdDelete, MdAltRoute, MdMoreVert, MdOutlineRule } from 'react-icons/md';
import { contentToBlocks } from '@/lib/utils/blockUtils';
import { Block } from '@/components/ui/block-editor';
import ReactMarkdown from 'react-markdown';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { CursorRuleModal } from '@/components/cursor-rule-modal';

export default function PromptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const promptId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [promptBlocks, setPromptBlocks] = useState<Block[]>([]);
  const [isForkLoading, setIsForkLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [selectedPromptText, setSelectedPromptText] = useState<string>('');
  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);
  
  // Load prompt on component mount
  useEffect(() => {
    async function loadPrompt() {
      if (!promptId) return;
      
      try {
        setIsLoading(true);
        const promptData = await PromptService.getPromptById(promptId);
        setPrompt(promptData);
        
        // Convert prompt content to blocks
        setPromptBlocks(contentToBlocks(promptData.content));
      } catch (err) {
        console.error('Error loading prompt:', err);
        setError('Failed to load prompt. It may have been deleted or there was a server error.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadPrompt();
  }, [promptId]);
  
  // Handle copying content to clipboard
  const copyToClipboard = (text: string, id: string, e?: React.MouseEvent) => {
    // If event is provided, prevent parent click handlers
    if (e) {
      e.stopPropagation();
    }
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };
  
  // Handle adding prompt as cursor rule
  const addAsCursorRule = async (text: string) => {
    try {
      // Set the selected prompt text for the modal
      setSelectedPromptText(text);
      // Open the modal
      setIsRuleModalOpen(true);
      // Call the service (which now just resolves immediately)
      await CursorRuleService.addPromptAsCursorRule(text);
    } catch (error) {
      console.error('Error adding as cursor rule:', error);
      setNotification({
        message: 'Failed to add prompt as cursor rule. Please try again.',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };
  
  // Handle delete prompt
  const handleDeletePrompt = async () => {
    if (!prompt) return;
    
    if (window.confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      try {
        setIsLoading(true);
        await PromptService.deletePrompt(prompt.id);
        
        // Navigate back to home page after successful deletion
        router.push('/');
      } catch (error) {
        console.error('Error deleting prompt:', error);
        alert('Failed to delete prompt. Please try again.');
        setIsLoading(false);
      }
    }
  };
  
  // Handle edit prompt
  const handleEditPrompt = () => {
    if (!prompt) return;
    router.push(`/prompt/${prompt.id}/edit`);
  };
  
  // Handle fork prompt
  const handleForkPrompt = () => {
    console.log("FORK: Fork button clicked");
    
    // Check if prompt is available
    if (!prompt) {
      console.error("FORK ERROR: prompt state is null or undefined");
      return;
    }
    
    // Add animation effect
    const button = document.getElementById('fork-prompt-btn');
    if (button) {
      button.classList.add('clicked');
      setTimeout(() => button.classList.remove('clicked'), 300);
    }
    
    try {
      // Set loading state
      setIsForkLoading(true);
      
      // Instead of storing in sessionStorage, pass the prompt ID directly in the URL
      console.log(`FORK: Redirecting to fork prompt "${prompt.title}" with ID ${prompt.id}`);
      
      // Add a small delay to make it feel like it's doing something
      setTimeout(() => {
        // Navigate directly to the create page with forkId parameter
        window.location.href = `/?view=create&forkId=${prompt.id}`;
      }, 400); // Small delay to show loading state
      
    } catch (error) {
      console.error("FORK ERROR:", error);
      alert("There was a problem forking this prompt. Please try again.");
      setIsForkLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="max-w-3xl mx-auto p-6 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !prompt) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="max-w-3xl mx-auto p-6 text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            <h2 className="text-lg font-medium mb-2">Error</h2>
            <p>{error || 'Prompt not found'}</p>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Check if a tag is a category
  const isCategory = (tag: string): boolean => {
    // Check if the tag matches the prompt's category
    return prompt?.category?.toLowerCase() === tag.toLowerCase();
  };
  
  // Prepare tags to display
  const tags = prompt.tags || [];
  const category = prompt.category;
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="max-w-3xl mx-auto p-6">
        {notification && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg max-w-md z-50 transition-opacity duration-300 
            ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <MdCheck className="h-5 w-5" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <p>{notification.message}</p>
            </div>
            <button 
              className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
              onClick={() => setNotification(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Add the CursorRuleModal component */}
        <CursorRuleModal 
          isOpen={isRuleModalOpen}
          onClose={() => setIsRuleModalOpen(false)}
          promptText={selectedPromptText}
          promptTitle={prompt?.title}
        />
        
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{prompt.title}</h1>
          
          {/* Fork prompt button - moved here */}
          <button
            onClick={handleForkPrompt}
            id="fork-prompt-btn"
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-all flex items-center gap-1.5 active:translate-y-0.5 active:shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
            aria-label="Fork this prompt"
            disabled={isForkLoading}
          >
            {isForkLoading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full mr-1"></span>
                Forking...
              </>
            ) : (
              <>
                <MdAltRoute className="fork-icon text-gray-500" size={16} />
                fork prompt
              </>
            )}
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 relative">
          {/* Render blocks */}
          <div className="space-y-4">
            {promptBlocks.map((block, index) => (
              <div key={index} className={`rounded-md ${block.type === 'note' ? '' : 'bg-white border'}`}>
                {block.type === 'note' ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{block.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div 
                    className={`group p-4 font-mono whitespace-pre-wrap transition-colors relative cursor-pointer ${
                      activeMenuIndex === index ? 'bg-gray-100' : 'hover:bg-gray-100'
                    }`} 
                    style={{ 
                      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                      fontSize: '0.875rem'
                    }}
                    onClick={(e) => copyToClipboard(block.content, `block-${index}`, e)}
                  >
                    <ReactMarkdown>{block.content}</ReactMarkdown>
                    <div className={`absolute top-2 right-2 text-gray-400 ${activeMenuIndex === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity flex space-x-2`}>
                      {/* Copy button - shows check when copied, copy icon when not */}
                      <button 
                        className={`p-1 rounded-full focus:outline-none transition-colors ${
                          copiedText === `block-${index}` 
                            ? 'bg-green-100 text-green-600' 
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(block.content, `block-${index}`);
                        }}
                        aria-label={copiedText === `block-${index}` ? "Copied" : "Copy to clipboard"}
                      >
                        {copiedText === `block-${index}` ? (
                          <MdCheck className="h-4 w-4" />
                        ) : (
                          <MdContentCopy className="h-4 w-4" />
                        )}
                      </button>

                      {/* Kebab menu - always visible */}
                      <DropdownMenu onOpenChange={(open) => {
                        if (open) {
                          setActiveMenuIndex(index);
                        } else if (activeMenuIndex === index) {
                          setActiveMenuIndex(null);
                        }
                      }}>
                        <DropdownMenuTrigger asChild 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button 
                            className={`p-1 rounded-full ${activeMenuIndex === index ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} focus:outline-none transition-colors`}
                            aria-label="Menu"
                          >
                            <MdMoreVert className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuIndex(null);
                              addAsCursorRule(block.content);
                            }}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <MdOutlineRule className="h-4 w-4" />
                            <span>Add as Cursor Rule</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Tags and category */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-1 justify-between items-center">
              <div className="flex flex-wrap gap-1">
                {category && (
                  <span 
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center"
                  >
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
                    {category}
                  </span>
                )}
                
                {tags.map((tag, index) => {
                  // Skip the tag if it's the same as the category to avoid duplication
                  if (tag === category) return null;
                  
                  return (
                    <span 
                      key={index} 
                      className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full flex items-center"
                    >
                      <span className="mr-1 font-medium">#</span>
                      {tag}
                    </span>
                  );
                })}
              </div>
              
              {/* Edit/Delete buttons - moved here */}
              <div className="flex space-x-4">
                <button 
                  onClick={handleEditPrompt}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Edit
                </button>
                <button 
                  onClick={handleDeletePrompt}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div className="text-gray-400 text-xs mt-2">
              Created: {new Date(prompt.createdAt).toLocaleDateString()}
              {prompt.updatedAt !== prompt.createdAt && (
                <span> | Updated: {new Date(prompt.updatedAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Global styles for fork button animation */}
      <style jsx global>{`
        @keyframes wiggle {
          0% { transform: translateY(0) rotate(0); }
          25% { transform: translateY(2px) rotate(-3deg); }
          50% { transform: translateY(1px) rotate(0); }
          75% { transform: translateY(1px) rotate(3deg); }
          100% { transform: translateY(0) rotate(0); }
        }
        
        #fork-prompt-btn.clicked {
          animation: wiggle 0.3s ease;
          background-color: #f0f0f0;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .fork-icon {
          transition: all 0.2s ease;
        }
        
        #fork-prompt-btn:hover .fork-icon {
          transform: rotate(15deg);
        }
        
        #fork-prompt-btn.clicked .fork-icon {
          transform: rotate(-15deg) scale(1.2);
        }
      `}</style>
    </div>
  );
} 