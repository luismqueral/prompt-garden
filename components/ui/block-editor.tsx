import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MdAdd } from 'react-icons/md';
import { PromptBlock } from '@/components/ui/prompt-block';
import { NoteBlock } from '@/components/ui/note-block';

export type Block = {
  id: string;
  type: 'prompt' | 'note';
  content: string;
};

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [showMenuAt, setShowMenuAt] = useState<number | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);
      
      onChange(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const handleBlockChange = (id: string, content: string) => {
    const newBlocks = blocks.map(block => 
      block.id === id ? { ...block, content } : block
    );
    onChange(newBlocks);
  };

  const handleDeleteBlock = (id: string) => {
    const newBlocks = blocks.filter(block => block.id !== id);
    onChange(newBlocks);
  };

  const addBlockAtIndex = (type: 'prompt' | 'note', index: number) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: ''
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index, 0, newBlock);
    onChange(newBlocks);
    setShowMenuAt(null);
  };

  return (
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={blocks.map(block => block.id)}
          strategy={verticalListSortingStrategy}
        >
          <div>
            {blocks.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <div className="relative">
                  <button
                    onClick={() => setShowMenuAt(-1)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 shadow-sm transition-colors group relative"
                    aria-label="Add new block"
                  >
                    <MdAdd size={20} />
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Add new prompt or note
                    </div>
                  </button>
                  {showMenuAt === -1 && (
                    <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-white rounded shadow-lg p-2 z-10 min-w-[180px]">
                      <div 
                        className="px-3 py-1.5 hover:bg-gray-100 rounded cursor-pointer text-sm"
                        onClick={() => addBlockAtIndex('prompt', 0)}
                      >
                        Add Follow-Up Prompt
                      </div>
                      <div 
                        className="px-3 py-1.5 hover:bg-gray-100 rounded cursor-pointer text-sm"
                        onClick={() => addBlockAtIndex('note', 0)}
                      >
                        Add Contextual Note
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {blocks.map((block, index) => (
                  <React.Fragment key={block.id}>
                    {/* Render the current block */}
                    <div className="mb-2">
                      {block.type === 'prompt' ? (
                        <PromptBlock
                          id={block.id}
                          content={block.content}
                          onChange={(content) => handleBlockChange(block.id, content)}
                          onDelete={() => handleDeleteBlock(block.id)}
                        />
                      ) : (
                        <NoteBlock
                          id={block.id}
                          content={block.content}
                          onChange={(content) => handleBlockChange(block.id, content)}
                          onDelete={() => handleDeleteBlock(block.id)}
                        />
                      )}
                    </div>
                  </React.Fragment>
                ))}
                
                {/* Add button - only at the end of all blocks */}
                <div className="relative h-6 mt-2">
                  <div className="absolute left-1/2 transform -translate-x-1/2">
                    <button
                      onClick={() => setShowMenuAt(blocks.length)}
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 shadow-sm group relative"
                      aria-label="Add new block"
                    >
                      <MdAdd size={14} />
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Add new prompt or note
                      </div>
                    </button>
                    
                    {showMenuAt === blocks.length && (
                      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white rounded shadow-lg p-2 z-10 min-w-[180px]">
                        <div 
                          className="px-3 py-1.5 hover:bg-gray-100 rounded cursor-pointer text-sm"
                          onClick={() => addBlockAtIndex('prompt', blocks.length)}
                        >
                          Add Follow-Up Prompt
                        </div>
                        <div 
                          className="px-3 py-1.5 hover:bg-gray-100 rounded cursor-pointer text-sm"
                          onClick={() => addBlockAtIndex('note', blocks.length)}
                        >
                          Add Contextual Note
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
} 