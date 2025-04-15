import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Create the handler using the authOptions
const handler = NextAuth(authOptions);

// Export the GET and POST handlers only
export { handler as GET, handler as POST }; 