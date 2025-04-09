"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { PromptService } from '@/lib/api/promptService';

export default function NewPromptPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  // Fetch available tags on component mount
  useEffect(() => {
    async function fetchTags() {
      try {
        const allTags = await PromptService.getAllTags();
        if (allTags && allTags.length > 0) {
          setAvailableTags(allTags.map(tag => tag.name));
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    }

    fetchTags();
  }, []);

  // Handle tag input change
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    
    // Filter available tags based on input
    if (value.trim()) {
      const filtered = availableTags.filter(
        tag => tag.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestedTags(filtered.slice(0, 5)); // Limit to 5 suggestions
    } else {
      setSuggestedTags([]);
    }
  };

  // Add a tag
  const addTag = (tag: string) => {
    // Check if tag already exists
    if (!tags.includes(tag) && tag !== category) {
      setTags([...tags, tag]);
    }
    setTagInput('');
    setSuggestedTags([]);
  };

  // Set category
  const setSelectedCategory = (cat: string) => {
    setCategory(cat);
    setTagInput('');
    setSuggestedTags([]);
  };

  // Remove a tag
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Handle key down in tag input
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (suggestedTags.length > 0) {
        // If there are suggestions, use the first one
        if (suggestedTags[0].toLowerCase() === tagInput.toLowerCase()) {
          // Exact match, use the suggestion with original casing
          addTag(suggestedTags[0]);
        } else {
          // Partial match, use the suggestion
          addTag(suggestedTags[0]);
        }
      } else {
        // No suggestions, use the input as is
        addTag(tagInput.trim());
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('Please enter content for the prompt');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const promptData = {
        title: title.trim() || 'Untitled Prompt',
        content,
        tags,
        category: category || undefined
      };
      
      const createdPrompt = await PromptService.addPrompt(promptData);
      
      // Redirect to the prompt detail page
      router.push(`/prompt/${createdPrompt.id}`);
    } catch (error) {
      console.error('Error creating prompt:', error);
      alert('Failed to create prompt. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header isCreateView={true} />
      
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Prompt</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title (optional)
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter a title for your prompt"
            />
            <p className="mt-1 text-sm text-gray-500">
              If left blank, "Untitled Prompt" will be used
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Prompt Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md h-64 font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your prompt content here..."
              style={{ 
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                fontSize: '0.875rem'
              }}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags & Category
            </label>
            <div className="border border-gray-300 rounded-md p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              {/* Selected tags */}
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full flex items-center"
                  >
                    <span className="mr-1 font-medium">#</span>
                    {tag}
                    <button 
                      type="button"
                      className="ml-1 hover:text-gray-800"
                      onClick={() => removeTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
                
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
                    <button 
                      type="button"
                      className="ml-1 hover:text-blue-900"
                      onClick={() => setCategory(null)}
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
              
              {/* Tag input */}
              <input
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagKeyDown}
                className="w-full px-2 py-1 outline-none"
                placeholder="Type to add tags or set a category..."
              />
            </div>
            
            {/* Tag suggestions */}
            {suggestedTags.length > 0 && (
              <div className="mt-1 border border-gray-300 rounded-md p-2 bg-white max-h-32 overflow-y-auto">
                {suggestedTags.map((tag, index) => (
                  <div 
                    key={index} 
                    className="px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50 rounded-md"
                    onClick={() => {
                      if (tag.includes('Category:')) {
                        // This is a category
                        setSelectedCategory(tag.replace('Category:', '').trim());
                      } else {
                        addTag(tag);
                      }
                    }}
                  >
                    {tag.includes('Category:') ? (
                      <div className="flex items-center">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          strokeWidth={1.5} 
                          stroke="currentColor" 
                          className="w-3 h-3 mr-1 text-blue-600"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" 
                          />
                        </svg>
                        {tag.replace('Category:', '')}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="mr-1 font-medium">#</span>
                        {tag}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <p className="mt-1 text-xs text-gray-500">
              Press Enter to add a tag. Use "#" for tags and set one category to help organize your prompts.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md mr-2 hover:bg-gray-50"
              onClick={() => router.push('/')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Prompt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 