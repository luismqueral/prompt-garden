"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Initial example prompts
const initialPrompts = [
  {
    id: "1",
    title: "Content Writer",
    content: "You are a professional content writer with expertise in [TOPIC]. Write a comprehensive blog post about [SUBJECT] that is engaging, informative, and optimized for SEO. The post should include a compelling introduction, 3-5 main sections with subheadings, and a conclusion."
  },
  {
    id: "2",
    title: "Code Assistant",
    content: "Act as an expert [PROGRAMMING_LANGUAGE] developer. I need help with [SPECIFIC_TASK]. Please provide clear, efficient, and well-commented code examples. Explain your approach and any important concepts or best practices I should be aware of."
  },
  {
    id: "3",
    title: "Image Generation",
    content: "Create a photorealistic image of [SUBJECT] with [STYLE] style. Include [ELEMENTS] in the scene with [LIGHTING] lighting and a [MOOD] atmosphere."
  }
];

export default function SimplePage() {
  const [prompts, setPrompts] = useState(initialPrompts);
  const [searchQuery, setSearchQuery] = useState("");

  // Handle changes to prompt title
  const handleTitleChange = (id: string, newTitle: string) => {
    setPrompts(prompts.map(prompt => 
      prompt.id === id ? { ...prompt, title: newTitle } : prompt
    ));
  };

  // Handle changes to prompt content
  const handleContentChange = (id: string, newContent: string) => {
    setPrompts(prompts.map(prompt => 
      prompt.id === id ? { ...prompt, content: newContent } : prompt
    ));
  };

  // Copy prompt content to clipboard
  const copyToClipboard = (content: string, title: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard", {
      description: `"${title}" prompt content copied to clipboard`
    });
  };

  // Delete a prompt
  const deletePrompt = (id: string) => {
    setPrompts(prompts.filter(prompt => prompt.id !== id));
    toast.info("Prompt deleted");
  };

  // Add a new prompt
  const addNewPrompt = () => {
    const newPrompt = {
      id: Date.now().toString(),
      title: "New Prompt",
      content: "Enter your prompt content here..."
    };
    setPrompts([...prompts, newPrompt]);
    toast.success("New prompt added");
  };

  // Filter prompts based on search query
  const filteredPrompts = searchQuery 
    ? prompts.filter(prompt => 
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        prompt.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : prompts;

  return (
    <div className="min-h-screen p-6 flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Prompt Garden</h1>
        <p className="text-muted-foreground">Create and manage your LLM prompts</p>
      </header>
      
      {/* Search bar */}
      <div className="mb-8">
        <div className="relative">
          <Input 
            type="text" 
            placeholder="Search prompts..." 
            className="pl-10 py-6"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>
      
      {/* Prompt boxes */}
      <div className="space-y-6">
        {filteredPrompts.map((prompt) => (
          <div key={prompt.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="mb-2">
              <Input 
                value={prompt.title}
                onChange={(e) => handleTitleChange(prompt.id, e.target.value)}
                className="text-lg font-medium mb-2 border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Textarea
              value={prompt.content}
              onChange={(e) => handleContentChange(prompt.id, e.target.value)}
              className="min-h-32 resize-none"
            />
            <div className="mt-4 flex justify-between items-center">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(prompt.content, prompt.title)}
                >
                  Copy
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    toast.success("Prompt saved");
                  }}
                >
                  Save
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => deletePrompt(prompt.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredPrompts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No prompts found matching your search.</p>
        </div>
      )}
      
      {/* Add new prompt button */}
      <div className="mt-8 flex justify-center">
        <Button className="px-8 py-6" onClick={addNewPrompt}>
          <svg 
            className="h-5 w-5 mr-2" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add New Prompt
        </Button>
      </div>
    </div>
  );
} 