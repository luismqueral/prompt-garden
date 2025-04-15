import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MdDragIndicator, MdContentCopy, MdDelete } from 'react-icons/md';
import { toast } from 'sonner';

interface PromptBlockProps {
  id: string;
  content: string;
  onChange: (content: string) => void;
  onDelete: () => void;
}

export function PromptBlock({ id, content, onChange, onDelete }: PromptBlockProps) {
  const [localContent, setLocalContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  useEffect(() => {
    setLocalContent(content);
  }, [content]);
  
  // Focus the textarea when the component mounts with empty content
  useEffect(() => {
    if (textareaRef.current) {
      // Always focus the textarea
      textareaRef.current.focus();
      
      // If there's content (like from a snippet), select it all
      if (content) {
        textareaRef.current.select();
      }
    }
  }, [content]);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onChange(newContent);
  };
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localContent);
      toast.success('Copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };
  
  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="group relative border border-gray-200 rounded bg-white overflow-hidden transition-all hover:border-gray-300"
    >
      <div className="flex items-center py-1 px-2 bg-gray-50 text-xs text-gray-500">
        <span 
          {...attributes} 
          {...listeners}
          className="cursor-grab hover:text-gray-700 p-1"
        >
          <MdDragIndicator size={16} />
        </span>
        <span className="font-medium ml-1">Prompt</span>
        
        <div className="ml-auto flex space-x-1">
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            aria-label="Copy prompt"
          >
            <MdContentCopy size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-400 hover:text-red-500"
            aria-label="Delete prompt block"
          >
            <MdDelete size={16} />
          </button>
        </div>
      </div>
      
      <textarea
        ref={textareaRef}
        value={localContent}
        onChange={handleChange}
        placeholder="Enter your prompt here..."
        className="w-full p-2 min-h-[240px] border-0 focus:ring-0 text-sm resize-y font-mono"
        style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
        spellCheck="false"
      />
    </div>
  );
} 