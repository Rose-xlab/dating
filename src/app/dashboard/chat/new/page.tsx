import { lucia } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import postgres from "postgres";

// Helper function to detect Next.js redirect errors
function isRedirectError(error: any) {
  return (
    error && 
    typeof error === 'object' && 
    error.digest && 
    error.digest.startsWith('NEXT_REDIRECT')
  );
}

export default async function NewChatPage() {
    // 1. Verify Session
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) redirect("/login");

    const { user } = await lucia.validateSession(sessionId);
    if (!user) redirect("/login");

    // 2. Database Connection
    // Using the direct connection string ensures we bypass any remaining RLS issues on the server side.
    const connectionString = process.env.SUPABASE_CONN_STRING!; 
    
    if (!connectionString) {
        console.error("Missing SUPABASE_CONN_STRING in environment variables");
        redirect("/dashboard");
    }

    // Configure the connection for the Transaction Pooler (Port 6543)
    const sql = postgres(connectionString, {
        ssl: "require",
        prepare: false, // Mandatory for Supabase Transaction Pooler
    });

    try {
        // 3. Create the New Chat Session
        // We insert the user.id (which is now confirmed to be TEXT) directly.
        const [newSession] = await sql`
            INSERT INTO chat_sessions (user_id, title)
            VALUES (${user.id}, 'New Conversation')
            RETURNING id
        `;

        if (!newSession) {
            throw new Error("Failed to create session in database");
        }

        // 4. Redirect to the new chat page
        // This command effectively throws a special error to change the page.
        redirect(`/dashboard/chat/${newSession.id}`);

    } catch (error) {
        // 5. CRITICAL FIX:
        // If the error is Next.js trying to redirect, we must re-throw it so the navigation happens.
        if (isRedirectError(error)) {
            throw error;
        }

        // If it's a real error (like a DB crash), we log it.
        console.error("Error creating chat:", error);
        
        // Fallback: Send user back to the main dashboard if something actually broke.
        redirect("/dashboard");
    } finally {
        // 6. Cleanup
        // Always close the connection to prevent running out of slots.
        await sql.end(); 
    }
}