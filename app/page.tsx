/**
 * Prompt Garden - Homepage Component
 * 
 * This is the main landing page of the Prompt Garden application, responsible for displaying, 
 * filtering, and managing prompts. It implements a client-side rendered component using 
 * Next.js's "use client" directive.
 * 
 * Key Functionality:
 * - Displays a grid of prompt cards with syntax highlighting
 * - Provides filtering by tags and categories
 * - Offers search functionality
 * - Allows adding new prompts
 * - Implements syntax highlighting for special prompt formats
 * - Handles copy-to-clipboard functionality
 * 
 * Architecture Notes:
 * - Uses client-side rendering ("use client" directive) for interactivity
 * - Fetches data from Google Sheets via the PromptService API
 * - Uses CodeMirror for rich text editing with custom syntax highlighting
 * - Implements custom formatting for variables, notes, and follow-ups
 * - Uses React hooks for state management (useState, useEffect, useRef)
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { PromptService } from "@/lib/api/promptService";
import { Prompt as GoogleSheetsPrompt } from "@/lib/googleSheets";
import { TitleGeneratorService } from "@/lib/api/titleGeneratorService";

// Add Material Design icons
import { MdSearch, MdClose, MdContentCopy, MdCheck, MdAutoFixHigh } from "react-icons/md";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { BlockEditor, Block } from '@/components/ui/block-editor';
import { blocksToContent, contentToBlocks } from '@/lib/utils/blockUtils';

/**
 * Prompt Type Definition
 * 
 * This defines the structure of a prompt object used throughout the application.
 * - id: Unique identifier for the prompt
 * - title: The prompt's title
 * - content: The actual prompt text content
 * - tags: Array of tags associated with the prompt
 * - category: Optional category classification
 * - createdAt: Timestamp when the prompt was created
 * - updatedAt: Timestamp when the prompt was last updated
 */
type Prompt = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category?: string;
  createdAt?: string;
  updatedAt?: string;
};

// Initial example prompts array (empty to start)
const initialPrompts: Prompt[] = [];

export default function HomePage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeView, setActiveView] = useState<"browse" | "create">("browse");
  const [newPromptTitle, setNewPromptTitle] = useState("");
  const [newPromptContent, setNewPromptContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showCategoryLinks, setShowCategoryLinks] = useState(false);
  const [hasTextAfterSequence, setHasTextAfterSequence] = useState(false);
  const [showSyntaxGuide, setShowSyntaxGuide] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isRemixMode, setIsRemixMode] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([
    { id: `block-${Date.now()}`, type: 'prompt', content: '' }
  ]);
  const [titleInput, setTitleInput] = useState("");
  const [titleGenerating, setTitleGenerating] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);

  // Define the tutorial placeholder text
  const placeholderText = `# How to Create a Prompt

Use # at the beginning to create a title for your prompt.

This editor supports several syntax features to help you create structured prompts.

> This is a note/context block. It appears in a blockquote style and provides additional information that won't be shown in the prompt cards.

You can create regular paragraphs like this one. Use [VARIABLES] in your text to highlight customizable parts of your prompt.

To create follow-up prompts that will display with circle indicators:

1. Start a line with a number followed by a period
2. Add your follow-up prompt text here
3. Each numbered item becomes a follow-up prompt`;

  // Load prompts from Google Sheets API on component mount
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        // Get prompts from Google Sheets API
        const apiPrompts = await PromptService.getAllPrompts();
        setPrompts(apiPrompts);
      } catch (error) {
        console.error("Error loading prompts from API:", error);
        setPrompts([]);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadPrompts();
    
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
    
    console.log("Checking for remix data in sessionStorage:", {
      hasContent: !!remixContent,
      hasTitle: !!remixTitle,
      hasTagsJson: !!remixTagsJson
    });
    
    if (remixContent) {
      console.log("Found remixContent, initializing remix mode");
      setIsRemixMode(true);
      
      // Explicitly set the active view to create
      console.log("Explicitly setting activeView to 'create'");
      setActiveView('create');
      
      // Convert content to blocks for the block editor
      const remixBlocks = contentToBlocks(remixContent);
      console.log("Converted content to blocks:", remixBlocks);
      setBlocks(remixBlocks);
      
      if (remixTitle) {
        console.log("Setting title input:", remixTitle);
        setTitleInput(remixTitle);
      }
      
      // Set tags if they exist
      if (remixTagsJson) {
        try {
          const remixTags = JSON.parse(remixTagsJson);
          console.log("Setting tags:", remixTags);
          setSelectedTags(remixTags);
        } catch (e) {
          console.error("Error parsing remix tags:", e);
        }
      }
      
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
      
      // Clear the remix data from session storage after a short delay
      // to ensure all state updates have been processed
      setTimeout(() => {
        console.log("Clearing sessionStorage after processing data");
        sessionStorage.removeItem("remixPromptContent");
        sessionStorage.removeItem("remixPromptTitle");
        sessionStorage.removeItem("remixPromptTags");
      }, 500);
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
    if (activeView === "browse" && searchInputRef.current) {
      // Small delay to ensure the DOM is fully ready
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isLoaded, activeView, activeTag]);

  // Re-focus search input when filter/tag is cleared or changed
  useEffect(() => {
    if (activeView === "browse" && searchInputRef.current) {
      // Focus search input when filters change
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [activeTag]);

  // Focus search when returning to browse view
  useEffect(() => {
    if (activeView === "browse" && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeView]);

  // Check for URL params on mount to set the correct view
  useEffect(() => {
    const handleURLParams = () => {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const viewParam = searchParams.get('view');
        
        console.log("URL params changed - view param:", viewParam);
        
        if (viewParam === 'create') {
          console.log("Setting view to create");
          setActiveView('create');
        } else {
          console.log("Setting view to browse");
          setActiveView('browse');
        }
      }
    };
    
    handleURLParams();
    
    // Also listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleURLParams);
    
    // Add event listener for URL changes
    const checkURLInterval = setInterval(() => {
      const currentParams = new URLSearchParams(window.location.search);
      const viewParam = currentParams.get('view');
      
      // If URL has view=create but activeView is not 'create', update it
      if (viewParam === 'create' && activeView !== 'create') {
        console.log("URL has view=create but activeView is not 'create', updating view");
        setActiveView('create');
      }
    }, 100);
    
    return () => {
      window.removeEventListener('popstate', handleURLParams);
      clearInterval(checkURLInterval);
    };
  }, [activeView]);
  
  // Update URL when activeView changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      
      if (activeView === 'create') {
        url.searchParams.set('view', 'create');
      } else {
        url.searchParams.delete('view');
      }
      
      // Update URL without a full page reload
      window.history.pushState({}, '', url);
    }
  }, [activeView]);

  // Update this useEffect to initialize blocks when entering create view
  useEffect(() => {
    if (activeView === "create" && blocks.length === 1 && blocks[0].content === '') {
      // Set a sample prompt in the first block
      setBlocks([
        { 
          id: `block-${Date.now()}`, 
          type: 'prompt', 
          content: placeholderText
        }
      ]);
    }
  }, [activeView]);

  // Reset blocks when switching to create view (but don't reset if we're in remix mode)
  useEffect(() => {
    // Skip this reset if we're in remix mode (data from sessionStorage)
    if (activeView === "create" && !isRemixMode) {
      setBlocks([
        { id: `block-${Date.now()}`, type: 'prompt', content: '' }
      ]);
      setTitleInput("");
      setSelectedTags([]);
      setSelectedCategory(null);
    }
  }, [activeView, isRemixMode]);

  // Modify the addNewPrompt function
  const addNewPrompt = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    setTitleError(null); // Clear any title generation errors
    
    try {
      // Convert blocks to content string
      const content = blocksToContent(blocks);
      
      // Get title from title input field
      let title = titleInput.trim();
      
      // If no title in the input field, check if there's one in the content
      if (!title) {
        const firstLine = content.split('\n')[0];
        if (firstLine && firstLine.startsWith('# ')) {
          title = firstLine.substring(2).trim();
        }
      }
      
      // If still no title, use default
      if (!title) {
        title = "Untitled Prompt";
      }
      
      // Create the prompt data object
      const promptData = {
        title,
        content,
        tags: selectedTags,
        category: selectedCategory || undefined
      };
      
      // Save to Google Sheets using the API
      const createdPrompt = await PromptService.addPrompt(promptData);
      
      // Add to local state for immediate UI update
      setPrompts([...prompts, {
        id: createdPrompt.id,
        title: createdPrompt.title,
        content: createdPrompt.content,
        tags: createdPrompt.tags,
        category: createdPrompt.category,
        createdAt: createdPrompt.createdAt,
        updatedAt: createdPrompt.updatedAt
      }]);
      
      // Reset form
      setBlocks([{ id: `block-${Date.now()}`, type: 'prompt', content: '' }]);
      setTitleInput("");
      setSelectedTags([]);
      setSelectedCategory(null);
      setIsRemixMode(false);
      
      // Switch to browse view
      setActiveView('browse');
    } catch (error) {
      console.error('Error creating prompt:', error);
      alert('Failed to create prompt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
        
        if (Array.isArray(importedPrompts) && importedPrompts.every(p => p.id && p.content)) {
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
  function getTagsForPrompt(prompt: Prompt): string[] {
    // If prompt has tags property, use that
    if ('tags' in prompt && Array.isArray(prompt.tags)) {
      return prompt.tags;
    }
    
    // Empty array if no tags
    return [];
  }

  // Get category for a specific prompt
  function getCategoryForPrompt(prompt: Prompt): string | null {
    // If prompt has category property, use that
    if ('category' in prompt && typeof prompt.category === 'string') {
      return prompt.category;
    }
    
    // No category if not defined
    return null;
  }

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

  // Get all available tags
  const getAllAvailableTags = (): string[] => {
    const allTags = new Set<string>();
    
    // Get all tags from prompts
    prompts.forEach(prompt => {
      if (Array.isArray(prompt.tags)) {
        prompt.tags.forEach(tag => {
          allTags.add(tag.toLowerCase());
        });
      }
      
      if (prompt.category) {
        allTags.add(prompt.category.toLowerCase());
      }
    });
    
    return Array.from(allTags);
  };

  // Handle tag input changes
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setTagInput(input);
    setSelectedSuggestionIndex(-1); // Reset selected suggestion when typing
    
    if (input.trim() !== "") {
      // Filter available tags based on input
      const allTags = getAllAvailableTags();
      
      // If input starts with @, filter categories, otherwise filter regular tags
      const isCreatingCategory = input.startsWith('@');
      const searchTerm = isCreatingCategory ? input.substring(1).toLowerCase() : input.toLowerCase();
      
      // If creating a category, only show categories in suggestions
      const matchedTags = isCreatingCategory 
        ? allTags.filter(tag => 
            isCategory(tag) && 
            tag.toLowerCase().includes(searchTerm) && 
            !selectedTags.includes(tag)
          )
        : allTags.filter(tag => 
            tag.toLowerCase().includes(searchTerm) && 
            !selectedTags.includes(tag)
          );
          
      setSuggestedTags(matchedTags);
    } else {
      setSuggestedTags([]);
    }
  };

  // Handle key down events in tag input
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Delete last tag or category with backspace when input is empty
    if (e.key === "Backspace" && tagInput === "") {
      e.preventDefault();
      
      // First remove the category if it exists, otherwise remove the last tag
      if (selectedCategory) {
        setSelectedCategory(null);
      } else if (selectedTags.length > 0) {
        const lastTag = selectedTags[selectedTags.length - 1];
        removeTag(lastTag);
      }
      return;
    }
    
    // Navigation for suggestions
    if (suggestedTags.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => {
          const newIndex = prev < suggestedTags.length - 1 ? prev + 1 : prev;
          
          // Scroll the selected item into view after a short delay
          setTimeout(() => {
            const selectedElement = document.querySelector(`[data-suggestion-index="${newIndex}"]`);
            if (selectedElement) {
              selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }, 10);
          
          return newIndex;
        });
        return;
      }
      
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : prev;
          
          // Scroll the selected item into view after a short delay
          setTimeout(() => {
            const selectedElement = document.querySelector(`[data-suggestion-index="${newIndex}"]`);
            if (selectedElement) {
              selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }, 10);
          
          return newIndex;
        });
        return;
      }
      
      if (e.key === "Enter") {
        e.preventDefault();
        
        // If a suggestion is selected, use that
        if (selectedSuggestionIndex >= 0) {
          const selectedTag = suggestedTags[selectedSuggestionIndex];
          if (isCategory(selectedTag)) {
            if (selectedCategory) {
              addTag(selectedTag);
            } else {
              selectCategory(selectedTag);
            }
          } else {
            addTag(selectedTag);
          }
          return;
        }
        
        // Otherwise use the current input
        if (tagInput.trim()) {
          // Check if creating a category with @ prefix
          if (tagInput.startsWith('@')) {
            const categoryName = tagInput.substring(1).trim();
            if (categoryName) {
              selectCategory(categoryName);
            }
          } else if (isCategory(tagInput.trim())) {
            if (selectedCategory) {
              addTag(tagInput.trim());
            } else {
              selectCategory(tagInput.trim());
            }
          } else {
            addTag(tagInput.trim());
          }
        }
        return;
      }
      
      if (e.key === "Escape") {
        e.preventDefault();
        setSuggestedTags([]);
        return;
      }
    } else if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      // Check if creating a category with @ prefix
      if (tagInput.startsWith('@')) {
        const categoryName = tagInput.substring(1).trim();
        if (categoryName) {
          selectCategory(categoryName);
        }
      } else if (isCategory(tagInput.trim())) {
        if (selectedCategory) {
          addTag(tagInput.trim());
        } else {
          selectCategory(tagInput.trim());
        }
      } else {
        addTag(tagInput.trim());
      }
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
    
    // Focus back on the input element for continuous typing
    setTimeout(() => {
      const inputEl = document.querySelector('.tag-input') as HTMLInputElement;
      if (inputEl) inputEl.focus();
    }, 0);
  };

  // For selecting a category
  const selectCategory = (category: string) => {
    const normalizedCategory = category.toLowerCase();
    setSelectedCategory(normalizedCategory);
    setTagInput("");
    setSuggestedTags([]);
    
    // Focus back on the input element for continuous typing
    setTimeout(() => {
      const inputEl = document.querySelector('.tag-input') as HTMLInputElement;
      if (inputEl) inputEl.focus();
    }, 0);
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
      (prompt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) || 
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase());
      
    // Then filter by tag if an active tag is set
    const matchesTag = !activeTag || promptTags.includes(activeTag);
    
    // Prompt must match both filters
    return matchesSearch && matchesTag;
  });

  // Helper function to strip special tags for preview display
  const stripSpecialTags = (content: string): string => {
    if (!content) return '';
    
    // Check if content uses the new tag format with pg-prompt and pg-note tags
    if (content.includes('<pg-prompt>') || content.includes('<pg-note>')) {
      // Extract just the first prompt block
      const promptRegex = /<pg-prompt>([\s\S]*?)<\/pg-prompt>/;
      const match = content.match(promptRegex);
      
      if (match && match[1]) {
        // Return the content of the first prompt block, trimmed
        return match[1].trim();
      }
      
      // If no prompt blocks were found, remove all tags and return the content
      return content
        .replace(/<pg-prompt>[\s\S]*?<\/pg-prompt>/g, '')
        .replace(/<pg-note>[\s\S]*?<\/pg-note>/g, '')
        .trim();
    }
    
    // For legacy format content
    // Split content by lines to analyze structure
    const lines = content.split('\n');
    let result = '';
    
    // Remove title lines starting with #
    const filteredLines = lines.filter(line => !line.trim().match(/^#\s+.*$/));
    
    // Check if the first non-empty line is a note
    let startingContentIndex = 0;
    for (let i = 0; i < filteredLines.length; i++) {
      if (filteredLines[i].trim() === '') continue; // Skip empty lines
      
      if (filteredLines[i].trim().startsWith('>')) {
        // First content is a note, keep searching for actual content
        startingContentIndex = i + 1;
        while (startingContentIndex < filteredLines.length) {
          // Skip empty lines and more notes
          if (filteredLines[startingContentIndex].trim() === '' || 
              filteredLines[startingContentIndex].trim().startsWith('>')) {
            startingContentIndex++;
            continue;
          }
          break;
        }
      }
      break;
    }
    
    // If no suitable content was found after notes, use original approach
    if (startingContentIndex >= filteredLines.length) {
      startingContentIndex = 0;
    }
    
    // Find where numbered items begin
    let numberedItemIndex = -1;
    for (let i = startingContentIndex; i < filteredLines.length; i++) {
      if (/^\d+\.\s+.*/.test(filteredLines[i])) {
        numberedItemIndex = i;
        break;
      }
    }
    
    // If there's a follow-up prompt and no regular content, use the first follow-up prompt
    if (numberedItemIndex === startingContentIndex && numberedItemIndex !== -1) {
      // Extract just the numbered item's content (without the number)
      const match = filteredLines[numberedItemIndex].match(/^\d+\.\s+(.*)/);
      if (match) {
        return match[1].trim();
      }
    }
    
    // Otherwise use content between startingContentIndex and first numbered item (or end)
    if (numberedItemIndex !== -1) {
      result = filteredLines.slice(startingContentIndex, numberedItemIndex).join('\n');
    } else {
      result = filteredLines.slice(startingContentIndex).join('\n');
    }
    
    // Remove context tags without leaving extra whitespace
    result = result.replace(/<context>[\s\S]*?<\/context>/g, '');
    
    // Remove any context markers that might have been inserted
    result = result.replace(/\{\{CONTEXT_START\}\}[\s\S]*?\{\{CONTEXT_END\}\}/g, '');
    
    // Remove follow-up tags and all content within them
    result = result.replace(/<follow-up>[\s\S]*?<\/follow-up>/g, '');
    
    // Remove note content (lines starting with >)
    result = result.replace(/\n>.*?(\n|$)/g, '\n');
    
    // Clean up any double line breaks that might have been created
    result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return result.trim();
  };

  // Helper function to render a prompt
  function renderPrompt(prompt: Prompt) {
    // Get tags for this prompt
    const tags = getTagsForPrompt(prompt);
    
    // Get category for this prompt
    const category = getCategoryForPrompt(prompt);
    
    // Function to handle copying prompt to clipboard
    const handleCopyPrompt = (e: React.MouseEvent) => {
      e.preventDefault();
      
      // Get the target element safely
      const targetDiv = e.currentTarget as HTMLElement;
      if (!targetDiv) {
        console.error('Target element not found');
        return;
      }
      
      // Copy the prompt content to clipboard, stripping context tags
      navigator.clipboard.writeText(stripSpecialTags(prompt.content))
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
      <div key={prompt.id} className="mb-8 bg-white p-5 rounded-lg border border-gray-100">
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
          onClick={handleCopyPrompt}
        >
          <div 
            className="bg-white p-4 rounded-md mb-3 font-mono whitespace-pre-wrap group-hover:bg-gray-100 transition-colors line-clamp-6 max-h-60 overflow-hidden border relative" 
            style={{ 
              fontFamily: 'Menlo, Monaco, "Courier New", monospace',
              fontSize: '0.875rem'
            }}
          >
            {stripSpecialTags(prompt.content)}
            <div className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <MdContentCopy 
                className="h-4 w-4"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          {/* Category pill on the left */}
          <div className="flex flex-wrap gap-1">
            {category && (
              <span 
                className={`text-xs px-2 py-1 rounded-full cursor-pointer transition-colors flex items-center gap-1 ${
                  getColorForTag(category).bg} ${getColorForTag(category).text} hover:opacity-80`}
                onClick={() => handleTagClick(category)}
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
          <div className="flex flex-wrap gap-1 justify-start">
            {tags.map((tag, index) => {
              // Skip the tag if it's the same as the category to avoid duplication
              if (tag === category) return null;
              
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
      </div>
    );
  }

  // Check if a tag is a category
  function isCategory(tag: string): boolean {
    // Check if the tag exists as a category on any prompt
    return prompts.some(prompt => 
      prompt.category && prompt.category.toLowerCase() === tag.toLowerCase()
    );
  }

  // CodeMirror onChange handler
  const handleEditorChange = (blocks: Block[]) => {
    setBlocks(blocks);
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+Enter (macOS) or Ctrl+Enter (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (activeView === "create") {
          addNewPrompt();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView]);

  // Skeleton loading component
  const SkeletonLoader = () => {
    return (
      <div className="space-y-8">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-lg border border-gray-100 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="space-y-2 mb-4">
              <div className="h-3 bg-gray-100 rounded"></div>
              <div className="h-3 bg-gray-100 rounded"></div>
              <div className="h-3 bg-gray-100 rounded"></div>
              <div className="h-3 bg-gray-100 rounded w-5/6"></div>
            </div>
            <div className="h-24 bg-gray-100 rounded-md mb-3"></div>
            <div className="flex justify-between">
              <div className="h-6 bg-gray-100 rounded-full w-20"></div>
              <div className="flex gap-1">
                <div className="h-6 bg-gray-100 rounded-full w-14"></div>
                <div className="h-6 bg-gray-100 rounded-full w-14"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Main navigation - transparent header bar */}
      <Header 
        onAddPromptClick={() => setActiveView("create")}
        isCreateView={activeView === "create"}
      />
      
      {/* Content area - LIMITED WIDTH - increased for create view */}
      <div className={`px-6 py-8 flex-1 mx-auto ${activeView === "create" ? "max-w-3xl" : "max-w-2xl"} w-full`}>
        {/* Filter indicator - only shown when a tag is active */}
        {activeView === "browse" && activeTag && (
          <div className={`mb-6 p-4 rounded-lg ${
            // Only use color for categories, gray for regular tags
            isCategory(activeTag)
              ? getColorForTag(activeTag).bg
              : "bg-gray-100"
          }`}>
            <h2 className={`text-lg font-medium ${
              // Only use color for categories, gray for regular tags
              isCategory(activeTag)
                ? getColorForTag(activeTag).text
                : "text-gray-800"
            }`}>
              Showing all "{activeTag}" prompts
            </h2>
            <div 
              className={`flex items-center text-sm cursor-pointer hover:opacity-80 mt-1 ${
                // Only use color for categories, gray for regular tags
                isCategory(activeTag)
                  ? getColorForTag(activeTag).text
                  : "text-gray-600"
              }`}
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
                autoFocus
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
          {!isLoaded ? (
            <SkeletonLoader />
          ) : searchQuery || activeTag ? (
            filteredPrompts.length > 0 ? (
              filteredPrompts.map(prompt => renderPrompt(prompt))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-2">No prompts found</p>
                <p className="text-sm text-gray-400">
                  {searchQuery ? `No results for "${searchQuery}"` : `No prompts with the tag "${activeTag}"`}
                </p>
              </div>
            )
          ) : activeView === "create" ? (
            <div className="min-h-screen flex flex-col bg-gray-100">
              {/* Content area - WIDER WIDTH */}
              <div className="px-6 py-4 flex-1 mx-auto max-w-3xl w-full">
                {/* Title above content area */}
                <h1 className="text-2xl font-bold mb-6 text-center">Add New Prompt</h1>
                
                {/* White content area without border */}
                <div className="bg-white rounded-lg p-6">
                  <div>
                    {/* Block editor (no border around it) */}
                    <BlockEditor blocks={blocks} onChange={setBlocks} />
                    
                    {/* Title input field */}
                    <div className="mt-6 mb-6">
                      <p className="text-sm font-medium mb-2">Prompt Title</p>
                      <div className="border rounded-md p-3 bg-white focus-within:ring-1 focus-within:ring-blue-500">
                        <input
                          type="text"
                          id="promptTitle"
                          className="bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm p-0 w-full placeholder-gray-400"
                          placeholder="Enter a title for your prompt"
                          value={titleInput}
                          onChange={(e) => setTitleInput(e.target.value)}
                        />
                      </div>
                      {titleError && (
                        <p className="mt-1 text-sm text-red-500">{titleError}</p>
                      )}
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={async () => {
                            const content = blocksToContent(blocks);
                            if (!content.trim()) {
                              setTitleError("Please add content to your prompt first");
                              setTimeout(() => setTitleError(null), 3000);
                              return;
                            }
                            
                            // Clear any previous errors
                            setTitleError(null);
                            
                            // Set loading state
                            setTitleGenerating(true);
                            
                            // Add animation effect on click
                            const button = document.getElementById('generate-title-btn');
                            if (button) {
                              button.classList.add('clicked');
                              setTimeout(() => {
                                button.classList.remove('clicked');
                              }, 300);
                            }
                            
                            try {
                              const title = await TitleGeneratorService.generateTitle(content);
                              setTitleInput(title);
                            } catch (error) {
                              console.error("Error generating title:", error);
                              setTitleError("Failed to generate title. Please try again.");
                            } finally {
                              setTitleGenerating(false);
                            }
                          }}
                          id="generate-title-btn"
                          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-all flex items-center gap-1.5 active:translate-y-0.5 active:shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={titleGenerating}
                        >
                          {titleGenerating ? (
                            <>
                              <span className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full mr-1"></span>
                              Generating...
                            </>
                          ) : (
                            <>
                              <MdAutoFixHigh className="wand-icon text-gray-500" size={16} />
                              Generate Title
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Tags & Categories Input Section */}
                    <div className="mt-9 mb-6">
                      <p className="text-sm font-medium mb-2">Tags & Categories</p>
                      <div className="border rounded-md p-3 flex flex-wrap gap-2 bg-white focus-within:ring-1 focus-within:ring-blue-500">
                        {/* Selected tags */}
                        {selectedTags.map((tag, index) => {
                          // Use category styling for category tags
                          const isTagCategory = isCategory(tag);
                          return (
                            <div 
                              key={index}
                              className={`px-2 py-1 rounded-full text-sm flex items-center ${
                                isTagCategory 
                                  ? `${getColorForTag(tag).bg} ${getColorForTag(tag).text}`
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {isTagCategory ? (
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
                              ) : (
                                <span className="mr-1 font-medium">#</span>
                              )}
                              <span>{tag}</span>
                              <button 
                                type="button"
                                className="ml-1 hover:opacity-80"
                                onClick={() => removeTag(tag)}
                              >
                                <MdClose size={12} />
                              </button>
                            </div>
                          );
                        })}
                        
                        {/* Category if selected */}
                        {selectedCategory && (
                          <div className={`px-2 py-1 rounded-full text-sm flex items-center ${
                            getColorForTag(selectedCategory).bg} ${getColorForTag(selectedCategory).text
                          }`}
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
                            <span>{selectedCategory}</span>
                            <button 
                              type="button"
                              className="ml-1 hover:opacity-80"
                              onClick={() => setSelectedCategory(null)}
                            >
                              <MdClose size={12} />
                            </button>
                          </div>
                        )}
                        
                        {/* Tag input with help text */}
                        <div className="flex flex-1 items-center min-w-[120px]">
                          <input
                            type="text"
                            placeholder="Add tags or set a category..."
                            className="bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm p-0 w-full placeholder-gray-400"
                            value={tagInput}
                            onChange={handleTagInputChange}
                            onKeyDown={handleTagKeyDown}
                            ref={tagInputRef}
                          />
                        </div>
                      </div>
                      
                      {/* Tag suggestions */}
                      {suggestedTags.length > 0 && (
                        <div className="bg-white mt-1 rounded-md border border-gray-300 shadow-sm max-h-48 overflow-y-auto z-10">
                          {suggestedTags.map((tag, index) => {
                            const isTagCategory = tag.includes('Category:');
                            const categoryName = isTagCategory ? tag.replace('Category:', '').trim() : '';
                            return (
                              <div 
                                key={index} 
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                                  selectedSuggestionIndex === index ? 'bg-gray-50' : ''
                                }`}
                                onClick={() => {
                                  if (isTagCategory) {
                                    selectCategory(categoryName);
                                  } else {
                                    addTag(tag);
                                  }
                                }}
                              >
                                {isTagCategory ? (
                                  <div className="flex items-center gap-1">
                                    <svg 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      fill="none" 
                                      viewBox="0 0 24 24" 
                                      strokeWidth={1.5} 
                                      stroke="currentColor" 
                                      className="w-4 h-4 text-blue-600"
                                    >
                                      <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" 
                                      />
                                    </svg>
                                    <span className="font-medium">{categoryName}</span>
                                    <span className="text-sm text-gray-400">Category</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <span className="mr-1 font-medium text-gray-600">#</span>
                                    {tag}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      <div className="mt-2 text-sm text-gray-500">
                        Press Enter to add a tag, or use <span className="font-mono bg-gray-100 px-1 rounded">@category</span> to add a category.
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-center flex-col items-center">
                      <Button 
                        onClick={addNewPrompt}
                        className="max-w-xs w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isSubmitting}
                      >
                        {isSubmitting 
                          ? "Saving..." 
                          : isRemixMode 
                            ? "Save Remix" 
                            : "Add Prompt"}
                      </Button>
                      <div className="text-xs text-gray-400 mt-2">
                        Press <kbd className="px-1 py-0.5 bg-gray-100 rounded border">⌘</kbd>+<kbd className="px-1 py-0.5 bg-gray-100 rounded border">Enter</kbd> to submit
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Normal prompts view
            prompts.map(prompt => renderPrompt(prompt))
          )}
        </div>
      </div>
      
      {/* Global styles */}
      <style jsx global>{`
        @keyframes wiggle {
          0% { transform: translateY(0) rotate(0); }
          25% { transform: translateY(2px) rotate(-3deg); }
          50% { transform: translateY(1px) rotate(0); }
          75% { transform: translateY(1px) rotate(3deg); }
          100% { transform: translateY(0) rotate(0); }
        }
        
        #generate-title-btn.clicked {
          animation: wiggle 0.3s ease;
          background-color: #f0f0f0;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .wand-icon {
          transition: all 0.2s ease;
        }
        
        #generate-title-btn:hover .wand-icon {
          transform: rotate(15deg);
          color: #8B5CF6 !important; /* Vibrant purple color */
        }
        
        #generate-title-btn.clicked .wand-icon {
          transform: rotate(-15deg) scale(1.2);
          color: #8B5CF6 !important;
        }
      `}</style>
    </div>
  );
}
