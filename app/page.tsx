"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { PromptService } from "@/lib/api/promptService";
import { Prompt as GoogleSheetsPrompt } from "@/lib/googleSheets";

// Add Material Design icons
import { MdSearch, MdClose, MdAutoFixHigh, MdContentCopy, MdCheck, MdArrowBack } from "react-icons/md";

// Add CodeMirror components and extensions
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { EditorView, Decoration } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { Compartment } from '@codemirror/state';
import { lineNumbers } from '@codemirror/view';
import { gutters } from '@codemirror/view';
import { StreamLanguage } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { createTheme } from '@uiw/codemirror-themes';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";

// Updated type for prompts
type Prompt = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category?: string;
  createdAt?: string;
  updatedAt?: string;
};

// Initial example prompts
const initialPrompts: Prompt[] = [];

// Helper function to highlight syntax in prompt text
const highlightPromptSyntax = (text: string): React.ReactNode[] => {
  if (!text) return [text];
  
  // First split by line to handle line-based highlighting (notes and numbered items)
  const lines = text.split('\n');
  
  // First identify all numbered lines
  const numberedLines = new Set<number>();
  const sequenceEndLines = new Set<number>();
  
  lines.forEach((line, index) => {
    if (/^\d+\.\s+.*/.test(line)) {
      numberedLines.add(index);
    }
    
    // Consider these patterns as sequence terminators
    if (
      /^\d+\.\s+.*/.test(line) || // Another numbered item
      /^>/.test(line.trim()) || // A note line
      /^```/.test(line.trim()) || // Code block
      /^#/.test(line.trim()) // Heading
    ) {
      sequenceEndLines.add(index);
    }
  });
  
  // Track if we're within a numbered sequence
  let inNumberedSequence = false;
  let currentSequenceStartLine = 0;
  
  return lines.map((line, lineIndex) => {
    // Check if this is a note line (starts with >)
    if (line.trim().startsWith('>')) {
      inNumberedSequence = false;
      return (
        <div key={`line-${lineIndex}`} className="block border-l-4 border-gray-300 bg-gray-50 text-gray-600 pl-2">
          {highlightVariableSyntax(line)}
        </div>
      );
    }
    
    // Check if this is a numbered follow-up prompt line
    const isNumberedLine = numberedLines.has(lineIndex);
    if (isNumberedLine) {
      inNumberedSequence = true;
      currentSequenceStartLine = lineIndex;
      const numberedLineMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numberedLineMatch) {
        return (
          <div key={`line-${lineIndex}`} className="flex items-start group">
            <span className="mr-2 font-bold text-gray-600 group-hover:text-gray-800">{numberedLineMatch[1]}.</span>
            <div className="flex-grow">
              {highlightVariableSyntax(numberedLineMatch[2])}
            </div>
          </div>
        );
      }
    }
    
    // Check if this is a blank line - blank lines don't end sequences anymore
    const isBlankLine = line.trim() === '';
    if (isBlankLine && inNumberedSequence) {
      return (
        <div key={`line-${lineIndex}`}>
          &nbsp;
        </div>
      );
    }
    
    // Check if this is a sequence terminator
    if (sequenceEndLines.has(lineIndex) && lineIndex !== currentSequenceStartLine) {
      inNumberedSequence = false;
    }
    
    // Check if this is a line after a numbered sequence
    if (inNumberedSequence) {
      // Display text after a numbered sequence with strikethrough
      return (
        <div key={`line-${lineIndex}`} className="pl-6 bg-yellow-50 border-l-4 border-yellow-200">
          <div className="flex items-start">
            <div className="text-yellow-700 line-through opacity-60">
              {highlightVariableSyntax(line)}
            </div>
          </div>
        </div>
      );
    }
    
    // For regular lines, process variable syntax
    return (
      <div key={`line-${lineIndex}`}>
        {highlightVariableSyntax(line)}
      </div>
    );
  });
};

// Helper function to highlight variable syntax [VARIABLE] only
const highlightVariableSyntax = (text: string): React.ReactNode[] => {
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

// Custom markdown parser configuration with variable handling
const customMarkdownExtension = markdown({
  base: markdownLanguage,
  codeLanguages: [],
  addKeymap: true,
});

// Custom regex matcher for variable syntax [VARIABLE] and text after sequences
const variableSyntaxHighlighter = (
  hasTextAfterSequence: boolean,
  setHasTextAfterSequence: (value: boolean) => void
): Extension => {
  // Create a decorator that looks for patterns
  return EditorView.decorations.of(view => {
    const decorations = [];
    const content = view.state.doc.toString();
    
    // Match all [VARIABLE] patterns
    const variableRegex = /\[([^\]]+)\]/g;
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      const from = match.index;
      const to = from + match[0].length;
      
      // Create a decoration for the [VARIABLE] pattern
      decorations.push({
        from,
        to,
        value: Decoration.mark({
          attributes: {
            class: "cm-variable-syntax",
            style: "color: #047857; font-weight: 500; text-transform: uppercase;"
          }
        })
      });
    }
    
    // Process document line by line to find text after numbered sequences using line decorations
    console.log("Processing document for text after sequences");
    
    // First pass: identify the line numbers of all numbered sequences and sequence ending markers
    const numberedLines = new Set<number>();
    const sequenceEndLines = new Set<number>();
    
    for (let i = 1; i <= view.state.doc.lines; i++) {
      const line = view.state.doc.line(i);
      const lineText = line.text;
      
      if (/^\d+\.\s+.*/.test(lineText)) {
        numberedLines.add(i);
      }
      
      // We consider these patterns to be sequence terminators
      if (
        /^\d+\.\s+.*/.test(lineText) || // Another numbered item
        /^>/.test(lineText.trim()) || // A note
        /^```/.test(lineText.trim()) || // Code block
        /^#/.test(lineText.trim()) // Heading
      ) {
        sequenceEndLines.add(i);
      }
    }
    
    // Second pass: mark all regions after a numbered sequence up to a terminator
    let inNumberedSequence = false;
    let currentSequenceStartLine = 0;
    let foundTextAfterSequence = false;
    
    for (let i = 1; i <= view.state.doc.lines; i++) {
      const line = view.state.doc.line(i);
      const lineText = line.text;
      
      // Check if this is a numbered line
      if (numberedLines.has(i)) {
        inNumberedSequence = true;
        currentSequenceStartLine = i;
      } 
      // Check if this is a blank line - blank lines DO NOT end sequences anymore
      else if (lineText.trim() === '') {
        // Continue the sequence across blank lines
      }
      // Check if this is a sequence terminator
      else if (sequenceEndLines.has(i) && i !== currentSequenceStartLine) {
        inNumberedSequence = false;
      }
      // If we're in a numbered sequence and this is not a special line
      else if (inNumberedSequence) {
        // Apply line decoration to ALL text after a numbered sequence
        console.log(`Line ${i} is text after a sequence: "${lineText}"`);
        foundTextAfterSequence = true;
        decorations.push(Decoration.line({
          attributes: {
            class: "cm-line-after-sequence",
            style: "text-decoration: line-through !important; opacity: 0.6 !important; color: #9CA3AF !important; background-color: transparent !important;"
          }
        }).range(line.from));
      }
    }
    
    // Update state based on whether we found text after a sequence
    if (foundTextAfterSequence !== hasTextAfterSequence) {
      setTimeout(() => setHasTextAfterSequence(foundTextAfterSequence), 0);
    }
    
    return Decoration.set(decorations, true);
  });
};

// Create a compartment for line number configuration
const lineNumberCompartment = new Compartment();

// Custom CodeMirror extensions for our syntax highlighting
const createPromptSyntaxHighlighter = () => {
  // Custom theme for our syntax highlighting
  const promptSyntaxTheme = HighlightStyle.define([
    // Headings
    {
      tag: tags.heading,
      color: "#1F2937", // text-gray-800
      fontWeight: "600"
    },
    // Notes (lines starting with >)
    {
      tag: tags.quote,
      color: "#6B7280", // text-gray-500
      backgroundColor: "#F9FAFB", // bg-gray-50
      display: "block",
      borderLeft: "4px solid #E5E7EB", // border-gray-200
      paddingLeft: "8px"
    },
    // Numbered lists
    {
      tag: tags.list,
      fontWeight: "normal", 
      color: "#4B5563" // text-gray-700
    },
    // List bullet/marker
    {
      tag: tags.atom,
      fontWeight: "bold",
      color: "#4B5563" // text-gray-700
    },
    // General code and markup styling
    {
      tag: tags.keyword,
      color: "#2563EB" // text-blue-600
    },
    {
      tag: tags.comment,
      color: "#6B7280", // text-gray-500
      fontStyle: "italic"
    },
  ]);

  // Custom CSS theme for editor styles
  const customStyles = EditorView.theme({
    // Enhanced styling for numbered lists and notes
    ".cm-line": {
      padding: "2px 0",
    },
    ".cm-content": {
      padding: "12px 16px",
    },
    // Bold styling for numbers in lists
    ".cm-list": {
      fontWeight: "bold",
      marginLeft: "8px",
    },
    ".cm-list-marker": {
      fontWeight: "bold",
    },
    // Custom styling for variables in brackets
    ".cm-variable-syntax": {
      color: "#047857 !important", // text-emerald-700
      fontWeight: "500 !important",
      textTransform: "uppercase !important"
    },
    // Custom styling for text after sequences (using line decoration now)
    ".cm-line-after-sequence": {
      textDecoration: "line-through !important",
      opacity: "0.6 !important",
      color: "#9CA3AF !important", // text-gray-400
      backgroundColor: "transparent !important"
    },
    ".cm-heading": {
      color: "#1F2937 !important", // text-gray-800
      fontWeight: "600 !important"
    }
  });

  // Theme extension
  const themeExtension = syntaxHighlighting(promptSyntaxTheme);

  return [
    themeExtension,
    customStyles,
    variableSyntaxHighlighter(false, () => {}),
    EditorView.lineWrapping,
    // This properly disables all gutters
    EditorView.theme({
      ".cm-gutters": { display: "none" }
    })
  ];
};

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  // Check for URL params on mount to set the correct view
  useEffect(() => {
    const handleURLParams = () => {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const viewParam = searchParams.get('view');
        
        if (viewParam === 'create') {
          setActiveView('create');
        } else {
          setActiveView('browse');
        }
      }
    };
    
    handleURLParams();
    
    // Also listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleURLParams);
    
    return () => {
      window.removeEventListener('popstate', handleURLParams);
    };
  }, []);
  
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

  // Add a new prompt
  const addNewPrompt = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    
    try {
      // Find title from first heading, if present
      let title = "";
      const firstLine = newPromptContent.split('\n')[0];
      if (firstLine && firstLine.startsWith('# ')) {
        title = firstLine.substring(2).trim();
      }
      
      // Create the prompt data object
      const promptData = {
        title: title || 'Untitled Prompt',
        content: newPromptContent || placeholderText,
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
      setNewPromptTitle("");
      setNewPromptContent("");
      setSelectedTags([]);
      setSelectedCategory(null);
      setIsRemixMode(false);
      
      // Show success message or navigate to the prompt detail
      setSuccessMessage(`Prompt "${createdPrompt.title}" saved successfully!`);
      setShowSuccess(true);
      setActiveView('browse'); // Switch to browse view
      
      // After 3 seconds, hide the success message
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
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
          const newIndex = prev > 0 ? prev - 1 : 0;
          
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
          if (isCategory(tagInput.trim())) {
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
      if (isCategory(tagInput.trim())) {
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
  const handleEditorChange = (value: string) => {
    setNewPromptContent(value);
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
          {searchQuery || activeTag
            ? filteredPrompts.map(prompt => renderPrompt(prompt))
            : activeView === "create" ? (
              <div className="min-h-screen flex flex-col bg-gray-100">
                {/* Content area - WIDER WIDTH */}
                <div className="px-6 py-4 flex-1 mx-auto max-w-3xl w-full">
                  {/* Title above content area */}
                <h1 className="text-2xl font-bold mb-6 text-center">Add New Prompt</h1>
                
                  {/* White content area without border */}
                  <div className="bg-white rounded-lg p-6">
                    <div>
                      <div className="border rounded-md overflow-hidden mb-1 focus-within:ring-1 focus-within:ring-blue-500">
                        <CodeMirror
                  value={newPromptContent}
                          height="400px"
                          extensions={[customMarkdownExtension, createPromptSyntaxHighlighter()]}
                          onChange={handleEditorChange}
                          placeholder={placeholderText}
                          theme="light"
                          style={{ 
                            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                            fontSize: '0.875rem'
                          }}
                          tabIndex={1}
                        />
                      </div>
                      
                      {/* Dynamic warning that appears only when text after sequences is detected */}
                      {(() => {
                        // Check if there's text after numbered items
                        const lines = newPromptContent.split('\n');
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
                      
                      {/* Syntax guide toggle */}
                      <div className="mb-3">
                        <button 
                          onClick={() => setShowSyntaxGuide(!showSyntaxGuide)} 
                          className="text-sm text-gray-400 hover:text-gray-800 flex items-center gap-1 mt-4"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className={`transition-transform ${showSyntaxGuide ? 'rotate-90' : ''}`}
                          >
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                          <span className="font-medium">Syntax Guide</span>
                        </button>
                      </div>
                      
                      {/* Syntax guide */}
                      {showSyntaxGuide && (
                        <div className="mb-12 bg-gray-50 p-4 rounded-md">
                          <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex items-start">
                              <div className="font-mono bg-white px-2 py-1 text-xs rounded border mr-3 w-28">
                                <span className="text-emerald-700 font-medium uppercase">[VARIABLE]</span>
                              </div>
                              <div className="flex-1">
                                Variables in brackets show in uppercase green text
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="font-mono bg-white px-2 py-1 text-xs rounded border mr-3 w-28">
                                &gt; Note
                              </div>
                              <div className="flex-1">
                                Context notes appear as blockquotes (not visible on homepage cards)
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="font-mono bg-white px-2 py-1 text-xs rounded border mr-3 w-28">
                                1. Follow-up
                              </div>
                              <div className="flex-1">
                                Numbered items become follow-up prompts with circle indicators (not visible on homepage cards)
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="font-mono bg-white px-2 py-1 text-xs rounded border mr-3 w-28">
                                <span className="text-gray-400 line-through opacity-60">Hidden text</span>
                              </div>
                              <div className="flex-1 text-gray-600">
                                Text after numbered items will be hidden. Add a blank line after a sequence to continue with regular text.
                              </div>
                            </div>
                    </div>
                  </div>
                )}
                
                      <div className="mt-9 mb-6">
                        <p className="text-sm font-medium mb-2">Tags & Categories</p>
                  <div className="border rounded-md p-2 flex flex-wrap gap-2 bg-white focus-within:ring-1 focus-within:ring-blue-500">
                    {/* Selected tags */}
                    {selectedTags.map((tag, index) => {
                            // Use category styling for category tags
                            const isTagCategory = isCategory(tag);
                      return (
                        <div 
                          key={index}
                                className={`px-2 py-1 rounded-full text-xs flex items-center ${
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
                            <div className={`px-2 py-1 rounded-full text-xs flex items-center ${
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
                      value={tagInput}
                      onChange={handleTagInputChange}
                      onKeyDown={handleTagKeyDown}
                              className="outline-none border-0 flex-1 text-sm font-mono tag-input"
                              placeholder="Type to add tags or categories..."
                              ref={tagInputRef}
                              tabIndex={2}
                            />
                          </div>
                  </div>
                  
                        {/* Tag/Category suggestions */}
                  {suggestedTags.length > 0 && (
                          <div className="mt-1 border rounded-md bg-white max-h-32 overflow-y-auto p-2">
                            {/* Group items by categories and tags */}
                            <div className="mb-2">
                              {/* Categories group */}
                              {suggestedTags.some(tag => isCategory(tag)) && (
                                <div className="mb-2">
                                  <div className="text-xs text-gray-500 font-medium px-2 mb-1">Categories</div>
                                  {suggestedTags.filter(tag => isCategory(tag)).map((tag, index) => {
                                    const isSelected = selectedSuggestionIndex === suggestedTags.indexOf(tag);
                        return (
                          <div 
                                        key={`category-${index}`}
                                        className={`px-3 py-1.5 text-sm cursor-pointer m-1 rounded-md hover:bg-gray-50 ${
                                          isSelected ? 'bg-gray-50 ring-1 ring-blue-400' : ''
                                        }`}
                                        onClick={() => {
                                          if (selectedCategory) {
                                            addTag(tag);
                                          } else {
                                            selectCategory(tag);
                                          }
                                        }}
                                        data-suggestion-index={suggestedTags.indexOf(tag)}
                                      >
                                        <div className="flex items-center">
                                          <div 
                                            className={`rounded-full px-2 py-0.5 text-xs mr-2 flex items-center ${
                                              getColorForTag(tag).bg} ${getColorForTag(tag).text
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
                                            {tag}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              
                              {/* Tags group */}
                              {suggestedTags.some(tag => !isCategory(tag)) && (
                                <div>
                                  <div className="text-xs text-gray-500 font-medium px-2 mb-1">Tags</div>
                                  {suggestedTags.filter(tag => !isCategory(tag)).map((tag, index) => {
                                    const isSelected = selectedSuggestionIndex === suggestedTags.indexOf(tag);
                                    return (
                                      <div 
                                        key={`tag-${index}`}
                                        className={`px-3 py-1.5 text-sm cursor-pointer m-1 rounded-md hover:bg-gray-50 ${
                                          isSelected ? 'bg-gray-50 ring-1 ring-blue-400' : ''
                                        }`}
                            onClick={() => addTag(tag)}
                                        data-suggestion-index={suggestedTags.indexOf(tag)}
                          >
                                        <div className="flex items-center">
                                          <div 
                                            className="rounded-full px-2 py-0.5 text-xs mr-2 flex items-center bg-gray-100 text-gray-600"
                                          >
                                            <span className="mr-1 font-medium">#</span>
                            {tag}
                                          </div>
                                        </div>
                          </div>
                        );
                      })}
                                </div>
                              )}
                            </div>
                    </div>
                  )}
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
            ) : prompts.map(prompt => renderPrompt(prompt))
          }
        </div>
      </div>
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-md z-50 animate-fadeIn">
          {successMessage}
        </div>
      )}
    </div>
  );
}
