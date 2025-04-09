"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onAddPromptClick?: () => void;
  // If true, we're in the create view and shouldn't show the Add Prompt button
  isCreateView?: boolean;
}

export function Header({ onAddPromptClick, isCreateView = false }: HeaderProps) {
  const router = useRouter();
  
  // Handler to navigate to homepage
  const goToHome = () => {
    if (isCreateView) {
      // If we're in create view, ask for confirmation before navigating away
      if (window.confirm('Are you sure you want to leave? Any unsaved changes will be lost.')) {
        window.location.href = "/"; // Use direct navigation instead of router.push
      }
    } else {
      router.push("/");
    }
  };

  // Default handler if none provided - navigate to create view
  const handleAddPromptClick = () => {
    if (onAddPromptClick) {
      onAddPromptClick();
    } else {
      router.push("/?view=create");
    }
  };

  return (
    <div className="bg-transparent px-6 py-4 flex justify-between items-center w-full min-h-[72px]">
      <div className="flex items-center">
        <div className="flex items-center cursor-pointer" onClick={goToHome}>
          <span className="text-xl font-bold">🪴</span>
          <span className="text-xl font-bold hover:underline">Prompt Garden</span>
          <span className="text-gray-500 ml-3 text-sm hidden sm:inline">An assorted collection of LMM prompts</span>
        </div>
      </div>
      <div className="flex space-x-4 items-center">
        <div className="text-gray-600 hover:underline text-sm cursor-pointer" onClick={goToHome}>
          Browse All Prompts
        </div>
        <Link 
          href="/tips" 
          className="text-gray-600 hover:underline text-sm"
          onClick={(e) => {
            if (isCreateView) {
              e.preventDefault(); // Prevent default link behavior
              // If we're in create view, ask for confirmation before navigating away
              if (window.confirm('Are you sure you want to leave? Any unsaved changes will be lost.')) {
                window.location.href = "/tips"; // Use direct navigation
              }
            }
          }}
        >
          Prompting Tips
        </Link>
        {!isCreateView && (
          <button
            onClick={handleAddPromptClick}
            className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
          >
            + Add Prompt
          </button>
        )}
      </div>
    </div>
  );
} 