"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/header';
import { PromptService } from '@/lib/api/promptService';

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isInitializing, setIsInitializing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Check authentication status
  useEffect(() => {
    if (status === 'loading') return; // Still loading auth status
    
    if (status === 'unauthenticated') {
      // Redirect to sign-in page if not authenticated
      router.push('/auth/signin');
      return;
    } else if (session && !session.user?.isAdmin) {
      // Redirect to error page if authenticated but not an admin
      router.push('/auth/error?error=AccessDenied');
      return;
    }
  }, [status, session, router]);

  // Initialize the Google Sheets database
  const initializeDatabase = async () => {
    try {
      setIsInitializing(true);
      setMessage(null);
      
      const result = await PromptService.initializeDatabase();
      
      setMessage({
        text: result.message,
        type: result.success ? 'success' : 'error',
      });
    } catch (error) {
      console.error('Error initializing database:', error);
      setMessage({
        text: error instanceof Error ? error.message : 'An unknown error occurred',
        type: 'error',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // If still loading auth or not authenticated, show loading state
  if (status === 'loading' || status === 'unauthenticated' || !session?.user?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header isCreateView={false} />
        
        <div className="px-6 py-8 flex-1 mx-auto max-w-2xl w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header isCreateView={false} />
      
      <div className="px-6 py-8 flex-1 mx-auto max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center">
              <div className="text-sm text-gray-600 mr-4">
                Signed in as: {session.user.email}
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Google Sheets Database</h2>
            <p className="text-gray-600 mb-4">
              Initialize or reset the Google Sheets database. This will create the necessary sheets and headers
              if they don't already exist.
            </p>
            
            <button 
              onClick={initializeDatabase}
              disabled={isInitializing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isInitializing ? 'Initializing...' : 'Initialize Database'}
            </button>
            
            {message && (
              <div className={`mt-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message.text}
              </div>
            )}
          </div>
          
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <p className="text-gray-600 mb-4">
              Ensure the following environment variables are set correctly in your <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code> file:
            </p>
            
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><code className="bg-gray-100 px-1 py-0.5 rounded">GOOGLE_SHEET_ID</code> - The ID of your Google Sheet</li>
              <li><code className="bg-gray-100 px-1 py-0.5 rounded">GOOGLE_SERVICE_ACCOUNT_EMAIL</code> - Your Google Service Account email</li>
              <li><code className="bg-gray-100 px-1 py-0.5 rounded">GOOGLE_PRIVATE_KEY</code> - Your Google Service Account private key</li>
              <li><code className="bg-gray-100 px-1 py-0.5 rounded">GOOGLE_CLIENT_ID</code> - Your Google OAuth Client ID</li>
              <li><code className="bg-gray-100 px-1 py-0.5 rounded">GOOGLE_CLIENT_SECRET</code> - Your Google OAuth Client Secret</li>
            </ul>
            
            <p className="text-gray-600">
              To set up a Google Service Account, follow the instructions in the <a href="https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Sheets API documentation</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 