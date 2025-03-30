"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// Add Material Design icons
import { MdSearch, MdClose, MdAutoFixHigh, MdContentCopy, MdCheck } from "react-icons/md";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

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

export default function HomePage() {
  const [prompts, setPrompts] = useState<typeof initialPrompts>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeView, setActiveView] = useState<"browse" | "create">("browse");
  const [newPromptTitle, setNewPromptTitle] = useState("");
  const [newPromptContent, setNewPromptContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showCategoryLinks, setShowCategoryLinks] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isRemixMode, setIsRemixMode] = useState(false);

  // Load prompts from localStorage on component mount
  useEffect(() => {
    const savedPrompts = localStorage.getItem("promptGardenPrompts");
    if (savedPrompts) {
      try {
        setPrompts(JSON.parse(savedPrompts));
      } catch (e) {
        console.error("Error parsing prompts from localStorage:", e);
        setPrompts(initialPrompts);
      }
    } else {
      setPrompts(initialPrompts);
    }
    setIsLoaded(true);
    
    // Check URL params for view
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'create') {
      setActiveView('create');
    }
    
    // Check for remix data in sessionStorage
    const remixContent = sessionStorage.getItem("remixPromptContent");
    const remixTitle = sessionStorage.getItem("remixPromptTitle");
    const remixTagsJson = sessionStorage.getItem("remixPromptTags");
    const shouldFocusTitle = sessionStorage.getItem("focusAndSelectTitle");
    const shouldFocusContent = sessionStorage.getItem("focusAndSelectContent");
    
    if (remixContent) {
      setNewPromptContent(remixContent);
      setIsRemixMode(true);
      
      if (remixTitle) {
        setNewPromptTitle(remixTitle);
      }
      
      // Set tags if they exist
      if (remixTagsJson) {
        try {
          const remixTags = JSON.parse(remixTagsJson);
          setSelectedTags(remixTags);
        } catch (e) {
          console.error("Error parsing remix tags:", e);
        }
      }
      
      // Clear the session storage after using it
      sessionStorage.removeItem("remixPromptContent");
      sessionStorage.removeItem("remixPromptTitle");
      sessionStorage.removeItem("remixPromptTags");
      
      // Focus on the title input if the flag is set
      if (shouldFocusTitle) {
        // We'll use this in a separate useEffect to ensure the DOM is ready
        setTimeout(() => {
          if (titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
          }
          sessionStorage.removeItem("focusAndSelectTitle");
        }, 100);
      }
      
      // Focus on the content textarea if the flag is set
      if (shouldFocusContent) {
        setTimeout(() => {
          if (contentTextareaRef.current) {
            contentTextareaRef.current.focus();
            contentTextareaRef.current.select();
          }
          sessionStorage.removeItem("focusAndSelectContent");
        }, 100);
      }
    }
  }, []);

  // Save prompts to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("promptGardenPrompts", JSON.stringify(prompts));
    }
  }, [prompts, isLoaded]);

  // Focus search input when browse view is active
  useEffect(() => {
    if (isLoaded && activeView === "browse" && !activeTag && searchInputRef.current) {
      // Small delay to ensure the DOM is fully ready
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isLoaded, activeView, activeTag]);

  // Add a new prompt
  const addNewPrompt = () => {
    const newPrompt = {
      id: Date.now().toString(),
      title: newPromptTitle || "New Prompt",
      content: newPromptContent || "Enter your prompt content here..."
    };
    setPrompts([...prompts, newPrompt]);
    
    // Reset form
    setNewPromptTitle("");
    setNewPromptContent("");
    setSelectedTags([]);
    setIsRemixMode(false);
  };

  // Reset to initial prompts
  const resetPrompts = () => {
    if (window.confirm("Are you sure you want to reset all prompts to default? This will delete any custom prompts you've created.")) {
      setPrompts(initialPrompts);
    }
  };

  // Export prompts as JSON file
  const exportPrompts = () => {
    const dataStr = JSON.stringify(prompts, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `prompt-garden-export-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
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

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedPrompts = JSON.parse(content);
        
        if (Array.isArray(importedPrompts) && importedPrompts.every(p => p.id && p.title && p.content)) {
          setPrompts(importedPrompts);
        } else {
          alert("Invalid prompt format in the imported file");
        }
      } catch (error) {
        alert("Error importing prompts. Please check the file format.");
        console.error("Import error:", error);
      }
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // Get tags for a specific prompt
  function getTagsForPrompt(prompt: (typeof initialPrompts)[0]): string[] {
    if (prompt.title.toLowerCase().includes("content") || prompt.id === "1") {
      return ["writing", "blog", "SEO"];
    } else if (prompt.title.toLowerCase().includes("code") || prompt.id === "2") {
      return ["development", "programming", "technical"];
    } else if (prompt.title.toLowerCase().includes("image") || prompt.id === "3") {
      return ["visual", "creative", "art"];
    } else {
      // Default tags for new prompts
      return ["prompt", "AI", "custom"];
    }
  }

  // Get all available tags
  const getAllAvailableTags = (): string[] => {
    const allTags = new Set<string>();
    
    // Add default tag categories
    ["writing", "development", "visual", "prompt", "AI", "custom", "blog", "SEO", "programming", "technical", "creative", "art"].forEach(tag => {
      allTags.add(tag.toLowerCase());
    });
    
    return Array.from(allTags);
  };

  // Handle tag input changes
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setTagInput(input);
    
    if (input.trim() !== "") {
      // Filter available tags based on input
      const allTags = getAllAvailableTags();
      const matchedTags = allTags.filter(tag => 
        tag.toLowerCase().includes(input.toLowerCase()) && 
        !selectedTags.includes(tag)
      );
      setSuggestedTags(matchedTags);
    } else {
      setSuggestedTags([]);
    }
  };

  // Handle key down events in tag input
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      addTag(tagInput.trim());
    } else if (e.key === "," && tagInput.trim() !== "") {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };

  // Add a tag to selected tags
  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase();
    if (!selectedTags.includes(normalizedTag)) {
      setSelectedTags([...selectedTags, normalizedTag]);
    }
    setTagInput("");
    setSuggestedTags([]);
  };

  // Remove a tag from selected tags
  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  // Filter prompts based on search query and active tag
  const filteredPrompts = prompts.filter(prompt => {
    // Get tags for this prompt
    const promptTags = getTagsForPrompt(prompt);
    
    // First filter by search query if it exists
    const matchesSearch = !searchQuery || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase());
      
    // Then filter by tag if an active tag is set
    const matchesTag = !activeTag || promptTags.includes(activeTag);
    
    // Prompt must match both filters
    return matchesSearch && matchesTag;
  });

  // Helper function to render a prompt
  function renderPrompt(prompt: (typeof initialPrompts)[0]) {
    // Get tags for this prompt
    const tags = getTagsForPrompt(prompt);
    
    // Function to handle copying prompt to clipboard
    const handleCopyPrompt = (e: React.MouseEvent) => {
      e.preventDefault();
      
      // Get the target element safely
      const targetDiv = e.currentTarget as HTMLElement;
      if (!targetDiv) {
        console.error('Target element not found');
        return;
      }
      
      navigator.clipboard.writeText(prompt.content)
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
    
    return (
      <div key={prompt.id} className="mb-8 bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
        <div className="mb-3">
          <Link href={`/prompt/${prompt.id}`} className="group">
            <h3 className="text-base font-medium group-hover:text-blue-600 transition-colors underline">
              {prompt.title}
            </h3>
          </Link>
        </div>
        
        <div 
          className="block group cursor-pointer"
          onClick={handleCopyPrompt}
        >
          <div className="bg-white p-4 rounded-md mb-3 font-mono whitespace-pre-wrap group-hover:bg-gray-100 transition-colors line-clamp-6 max-h-60 overflow-hidden border relative">
            {prompt.content}
            <div className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <MdContentCopy 
                className="h-4 w-4"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <div className="flex flex-wrap gap-1 justify-end">
            {tags.map((tag, index) => {
              return (
                <span 
                  key={index} 
                  className={`text-xs px-2 py-1 rounded-full cursor-pointer transition-colors ${
                    activeTag === tag ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
                  } hover:opacity-80`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Main navigation - title on left, links on right - FULL WIDTH */}
      <div className="bg-transparent px-6 py-4 flex justify-between items-center w-full">
        <div className="flex items-center">
          <Link href="/" className="font-bold text-xl hover:underline">🪴 Prompt Garden</Link>
          <span className="text-gray-500 ml-3 text-sm hidden sm:inline">Your collection of AI prompts</span>
        </div>
        <div className="flex space-x-4 items-center">
          <button 
            className={`px-3 py-1 text-sm transition-colors ${
              activeView === "browse" 
                ? "text-blue-600 font-medium hover:underline" 
                : "text-gray-600 hover:text-gray-800 hover:underline"
            }`}
            onClick={() => setActiveView("browse")}
          >
            Browse All Prompts
          </button>
          <Button
            variant={activeView === "create" ? "default" : "outline"}
            className="text-sm"
            onClick={() => setActiveView("create")}
          >
            Create Prompt
          </Button>
        </div>
      </div>
      
      {/* Content area - LIMITED WIDTH */}
      <div className="px-6 py-8 flex-1 mx-auto max-w-2xl w-full">
        {/* Filter indicator - only shown when a tag is active */}
        {activeView === "browse" && activeTag && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50 shadow-sm">
            <h2 className="text-lg font-medium">Showing all "{activeTag}" prompts</h2>
            <div 
              className="flex items-center text-sm text-blue-600 cursor-pointer hover:text-blue-800 mt-1"
              onClick={() => setActiveTag(null)}
            >
              <MdClose 
                className="mr-1" 
                size={14}
              />
              <span>Clear filter</span>
            </div>
          </div>
        )}
        
        {/* Search bar - only shown in browse view when no tag is active */}
        {activeView === "browse" && !activeTag && (
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Search prompts..." 
                className="pl-10 py-6 font-mono bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                ref={searchInputRef}
              />
              <MdSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" 
              />
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".json"
              style={{ display: 'none' }}
            />
          </div>
        )}
        
        <div className="space-y-10">
          {activeView === "browse" 
            ? filteredPrompts.map(prompt => renderPrompt(prompt))
            : activeView === "create" && (
              <div>
                <h1 className="text-2xl font-bold mb-6 text-center">Create New Prompt</h1>
                
                <label className="block text-sm font-medium mb-2">Prompt Title</label>
                <Input 
                  placeholder="Enter prompt title..."
                  className="text-xl font-semibold mb-4 focus-visible:ring-blue-500 font-mono bg-white"
                  value={newPromptTitle}
                  onChange={(e) => setNewPromptTitle(e.target.value)}
                  ref={titleInputRef}
                />
                
                <label className="block text-sm font-medium mb-2">Prompt Content</label>
                <Textarea
                  placeholder="Enter your prompt content here..."
                  className="min-h-40 resize-none mb-4 font-mono bg-white"
                  value={newPromptContent}
                  onChange={(e) => setNewPromptContent(e.target.value)}
                  ref={contentTextareaRef}
                />
                
                {/* Generate prompt helper section - hidden when remixing */}
                {!isRemixMode && (
                  <div className="mb-6 bg-blue-50 p-4 rounded-md border border-blue-100">
                    <p className="text-sm font-medium mb-2 text-blue-800">Need help writing your prompt?</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Describe what you're trying to do..."
                        className="flex-1 bg-white font-mono"
                      />
                      <Button variant="outline" size="default" className="whitespace-nowrap bg-white">
                        <MdAutoFixHigh className="h-4 w-4 mr-1.5" />
                        Generate Prompt
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="mb-6">
                  <p className="text-sm font-medium mb-2">Tags</p>
                  <div className="border rounded-md p-2 flex flex-wrap gap-2 bg-white focus-within:ring-1 focus-within:ring-blue-500">
                    {/* Selected tags */}
                    {selectedTags.map((tag, index) => {
                      return (
                        <div 
                          key={index}
                          className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs flex items-center"
                        >
                          <span>{tag}</span>
                          <button 
                            type="button"
                            className="ml-1 text-gray-500 hover:opacity-80"
                            onClick={() => removeTag(tag)}
                          >
                            <MdClose
                              size={12}
                            />
                          </button>
                        </div>
                      );
                    })}
                    
                    {/* Tag input */}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={handleTagInputChange}
                      onKeyDown={handleTagKeyDown}
                      className="outline-none border-0 flex-1 min-w-[120px] text-sm font-mono"
                      placeholder={selectedTags.length > 0 ? "" : "Type to add tags..."}
                    />
                  </div>
                  
                  {/* Tag suggestions */}
                  {suggestedTags.length > 0 && (
                    <div className="mt-1 border rounded-md shadow-sm bg-white max-h-32 overflow-y-auto">
                      {suggestedTags.map((tag, index) => {
                        return (
                          <div 
                            key={index}
                            className="px-3 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
                            onClick={() => addTag(tag)}
                          >
                            {tag}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div className="mt-8 flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setActiveView("browse")}>
                    Cancel
                  </Button>
                  <Button onClick={addNewPrompt}>
                    {isRemixMode ? "Save Remix" : "Create Prompt"}
                  </Button>
                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
