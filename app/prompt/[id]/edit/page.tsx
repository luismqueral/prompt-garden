"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PromptService } from '@/lib/api/promptService';
import { Header } from '@/components/header';

export default function EditPromptPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const promptId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication and load prompt data
  useEffect(() => {
    async function loadAndRedirect() {
      // Check if user is authenticated
      if (status === 'loading') return;
      
      if (status === 'unauthenticated') {
        // Redirect to sign-in if not authenticated
        router.push('/api/auth/signin?callbackUrl=' + encodeURIComponent(`/prompt/${promptId}/edit`));
        return;
      }
      
      if (!promptId) {
        setError('Invalid prompt ID');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        // Fetch the prompt data
        const promptData = await PromptService.getPromptById(promptId);
        
        // Redirect to the create view with the prompt data for editing
        // Using editId instead of forkId to indicate this is for editing an existing prompt
        router.push(`/?view=create&editId=${promptId}`);
      } catch (err) {
        console.error('Error loading prompt for editing:', err);
        setError('Failed to load prompt for editing. It may have been deleted or there was a server error.');
        setIsLoading(false);
      }
    }
    
    loadAndRedirect();
  }, [promptId, router, status]);
  
  // Loading state
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
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="max-w-3xl mx-auto p-6 text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            <h2 className="text-lg font-medium mb-2">Error</h2>
            <p>{error}</p>
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
  
  // This should never render as we redirect in the useEffect
  return null;
} 