import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { Session } from "next-auth";
import { User, Account, Profile } from "next-auth";

// Custom session type with isAdmin property
interface CustomSession extends Session {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isAdmin: boolean;
  };
}

// Define a list of admin emails that are allowed to access the admin page
// IMPORTANT: Add your own email address here to give yourself admin access
const allowedEmails: string[] = [
  // Add the email addresses of users who should have admin access
  // For example: "your.email@gmail.com"
];

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Allow all users to sign in (we'll restrict admin access elsewhere)
      return true;
    },
    async session({ session }) {
      // Add isAdmin flag to the session
      const customSession = session as CustomSession;
      customSession.user.isAdmin = customSession.user?.email 
        ? allowedEmails.includes(customSession.user.email) 
        : false;
      return customSession;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 