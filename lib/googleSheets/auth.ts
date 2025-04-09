/**
 * Google Sheets Authentication Module
 * 
 * This module handles authentication with the Google Sheets API using a service account.
 * It provides a centralized function for obtaining an authenticated Google Sheets client
 * that can be used throughout the application for spreadsheet operations.
 * 
 * Key Concepts:
 * - Service Account: A special type of Google account that belongs to your application
 *   rather than an individual user. It's used for server-to-server interactions.
 * 
 * - JWT (JSON Web Token): An authentication mechanism used to securely transmit information
 *   between parties as a JSON object. Google APIs use JWT for service account authentication.
 * 
 * - Scopes: Permission levels requested for the Google API. In this case, we're requesting
 *   access to read and write to Google Sheets.
 * 
 * Authentication Flow:
 * 1. Load service account credentials from environment variables
 * 2. Create a JWT client with those credentials
 * 3. Initialize the Google Sheets API client with the JWT authentication
 * 4. Return the authenticated client for use in API operations
 */

import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { GOOGLE_SHEETS_CONFIG } from './config';

/**
 * Get Google Sheets Client
 * 
 * Creates and returns an authenticated Google Sheets API client.
 * 
 * This function:
 * 1. Validates that the required credentials are available
 * 2. Formats the private key (replacing escaped newlines)
 * 3. Creates a Google Auth JWT client with service account credentials
 * 4. Initializes and returns a Google Sheets API client
 * 
 * The returned client can be used to make authenticated requests to the
 * Google Sheets API for any operations (read, write, update, etc.)
 * 
 * Error Handling:
 * - Throws an error if credentials are missing
 * - Throws an error if authentication fails
 * 
 * @returns A Promise resolving to an authenticated Google Sheets API client
 * @throws Error if authentication fails or credentials are missing
 */
export async function getGoogleSheetsClient() {
  try {
    // Check if required environment variables are set
    if (!GOOGLE_SHEETS_CONFIG.SERVICE_ACCOUNT_EMAIL || !GOOGLE_SHEETS_CONFIG.PRIVATE_KEY) {
      throw new Error('Google Sheets credentials are not properly configured in environment variables');
    }

    // Format the private key correctly (handling escaped newlines)
    // Environment variables often store newlines as \n, but JWT needs actual newlines
    const privateKey = GOOGLE_SHEETS_CONFIG.PRIVATE_KEY.replace(/\\n/g, '\n');

    // Create a JWT client using service account credentials
    // This client will handle authentication using the service account
    // The scopes define what API access we're requesting
    const auth = new GoogleAuth({
      credentials: {
        client_email: GOOGLE_SHEETS_CONFIG.SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Full access to all spreadsheets
    });

    // Create and return the Google Sheets API client
    // This client will use the JWT auth for all API requests
    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error) {
    console.error('Error creating Google Sheets client:', error);
    throw error;
  }
} 