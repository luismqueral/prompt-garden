"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PromptService } from '@/lib/api/promptService';
import { Header } from '@/components/header';
import { MdContentCopy, MdCheck } from "react-icons/md";

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

export default function GoogleSheetTestPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Fetch prompts on component mount
  useEffect(() => {
    async function fetchPrompts() {
      try {
        setIsLoading(true);
        const fetchedPrompts = await PromptService.getAllPrompts();
        console.log('Fetched prompts:', fetchedPrompts);
        setPrompts(fetchedPrompts);
      } catch (error) {
        console.error('Error fetching prompts:', error);
        setError('Failed to load prompts from Google Sheets.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrompts();
  }, []);

  // Create a new prompt
  const addPrompt = async () => {
    if (!newTitle || !newContent) {
      alert('Please enter both title and content for the prompt');
      return;
    }

    try {
      const newPrompt = {
        title: newTitle,
        content: newContent,
        tags: ['test']
      };

      const createdPrompt = await PromptService.addPrompt(newPrompt);
      setPrompts([createdPrompt, ...prompts]);
      setNewTitle('');
      setNewContent('');
    } catch (error) {
      console.error('Error creating prompt:', error);
      alert('Failed to create prompt. See console for details.');
    }
  };

  // Delete a prompt
  const deletePrompt = async (id: string) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      try {
        await PromptService.deletePrompt(id);
        setPrompts(prompts.filter(p => p.id !== id));
      } catch (error) {
        console.error('Error deleting prompt:', error);
        alert('Failed to delete prompt. See console for details.');
      }
    }
  };

  // Handle tag click
  const handleTagClick = (tag: string) => {
    if (activeTag === tag) {
      // If clicking the already active tag, clear the filter
      setActiveTag(null);
    } else {
      // Otherwise set the new tag filter
      setActiveTag(tag);
    }
  };

  // Handle copy prompt
  const handleCopyPrompt = (prompt: Prompt) => {
    navigator.clipboard.writeText(prompt.content)
      .then(() => {
        setCopiedPromptId(prompt.id);
        setTimeout(() => {
          setCopiedPromptId(null);
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  // Get color for tag
  const getColorForTag = (tag: string) => {
    // Simple hash function to determine color
    const hash = tag.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    
    // Array of color combinations
    const colors = [
      { bg: 'bg-blue-100', text: 'text-blue-800' },
      { bg: 'bg-green-100', text: 'text-green-800' },
      { bg: 'bg-orange-100', text: 'text-orange-800' },
      { bg: 'bg-purple-100', text: 'text-purple-800' },
      { bg: 'bg-pink-100', text: 'text-pink-800' },
      { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      { bg: 'bg-teal-100', text: 'text-teal-800' },
      { bg: 'bg-red-100', text: 'text-red-800' },
    ];
    
    return colors[hash % colors.length];
  };

  // Filter prompts based on search query and active tag
  const filteredPrompts = prompts.filter(prompt => {
    // First filter by search query if it exists
    const matchesSearch = !searchQuery || 
      (prompt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) || 
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (prompt.category?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      
    // Then filter by tag if an active tag is set
    const matchesTag = !activeTag || 
      prompt.tags.includes(activeTag) || 
      prompt.category === activeTag;
    
    // Prompt must match both filters
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Header isCreateView={false} />
      
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Prompts from Google Sheets</h1>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg 
                className="h-5 w-5 text-gray-400" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search prompts..." 
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Filter indicator - only shown when a tag is active */}
        {activeTag && (
          <div className={`mb-6 p-4 rounded-lg ${getColorForTag(activeTag).bg}`}>
            <h2 className={`text-lg font-medium ${getColorForTag(activeTag).text}`}>
              Showing all "{activeTag}" prompts
            </h2>
            <div 
              className={`flex items-center text-sm cursor-pointer hover:opacity-80 mt-1 ${getColorForTag(activeTag).text}`}
              onClick={() => setActiveTag(null)}
            >
              <svg 
                className="h-4 w-4 mr-1" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Clear filter
            </div>
          </div>
        )}
        
        {/* Create prompt button */}
        <div className="mb-8">
          <Link 
            href="/prompt/new" 
            className="w-full block text-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Create New Prompt
          </Link>
        </div>
        
        {/* Display prompts */}
        {isLoading ? (
          <div className="py-8 text-center">
            <p className="text-gray-600">Loading prompts...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-sm text-center py-8">
            <p className="text-gray-600 mb-4">No prompts found</p>
            <Link 
              href="/prompt/new" 
              className="inline-block py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Create Your First Prompt
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredPrompts.map((prompt) => (
              <div key={prompt.id} className="bg-white p-5 rounded-lg border border-gray-100">
                {prompt.title && (
                  <div className="mb-3">
                    <Link href={`/prompt/${prompt.id}`} className="group">
                      <h3 className="text-base font-medium group-hover:text-blue-600 group-hover:underline transition-colors">
                        {prompt.title}
                      </h3>
                    </Link>
                  </div>
                )}
                
                <div 
                  className="block group cursor-pointer"
                  onClick={() => handleCopyPrompt(prompt)}
                >
                  <div 
                    className="bg-white p-4 rounded-md mb-3 font-mono whitespace-pre-wrap group-hover:bg-gray-100 transition-colors line-clamp-6 max-h-60 overflow-hidden border relative" 
                    style={{ 
                      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                      fontSize: '0.875rem'
                    }}
                  >
                    {prompt.content}
                    <div className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {copiedPromptId === prompt.id ? (
                        <MdCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <MdContentCopy className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  {/* Category pill on the left */}
                  <div className="flex flex-wrap gap-1">
                    {prompt.category && (
                      <span 
                        className={`text-xs px-2 py-1 rounded-full cursor-pointer transition-colors flex items-center gap-1 ${
                          getColorForTag(prompt.category).bg} ${getColorForTag(prompt.category).text} hover:opacity-80`}
                        onClick={() => handleTagClick(prompt.category!)}
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
                    {prompt.tags.map((tag, index) => {
                      // Skip the tag if it's the same as the category to avoid duplication
                      if (tag === prompt.category) return null;
                      
                      return (
                        <span 
                          key={index} 
                          className={`text-xs px-2 py-1 rounded-full cursor-pointer transition-colors ${
                            activeTag === tag ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
                          } hover:opacity-80 flex items-center`}
                          onClick={() => handleTagClick(tag)}
                        >
                          <span className="mr-1 font-medium">#</span>
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-gray-500 flex justify-between items-center">
                  <span>Created: {new Date(prompt.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePrompt(prompt.id);
                    }}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 