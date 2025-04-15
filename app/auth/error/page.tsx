"use client";

import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import Link from "next/link";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  let errorMessage = "An unexpected error occurred during authentication.";

  if (error === "AccessDenied") {
    errorMessage = "You don't have permission to access the admin area. Please contact the site administrator.";
  } else if (error === "Verification") {
    errorMessage = "The sign-in link is no longer valid. It may have been used already or it may have expired.";
  } else if (error === "Configuration") {
    errorMessage = "There is a problem with the server configuration. Please contact the site administrator.";
  } else if (error === "OAuthSignin" || error === "OAuthCallback" || error === "OAuthCreateAccount") {
    errorMessage = "There was a problem with the Google sign-in process. Please try again.";
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header isCreateView={false} />
      
      <div className="px-6 py-8 flex-1 mx-auto max-w-md w-full flex flex-col justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Authentication Error</h1>
          
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            <p>{errorMessage}</p>
          </div>
          
          <div className="flex justify-center">
            <Link 
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 