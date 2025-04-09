"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { PromptService } from '@/lib/api/promptService';

export default function AdminPage() {
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header isCreateView={false} />
      
      <div className="px-6 py-8 flex-1 mx-auto max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
          
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