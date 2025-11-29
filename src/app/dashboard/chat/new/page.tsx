import { lucia } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import postgres from "postgres";

export default async function NewChatPage() {
    // 1. Verify Session (The Lucia Way)
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) redirect("/login");

    const { user } = await lucia.validateSession(sessionId);
    if (!user) redirect("/login");

    // 2. Database Connection (Direct & Reliable)
    // We use the same 'aws-1' string that passed your test.
    const connectionString = "postgres://postgres.hqwbtsevwmbsmrrthbkl:SecurePass20252025@aws-1-eu-north-1.pooler.supabase.com:6543/postgres";
    const sql = postgres(connectionString, {
        ssl: "require",
        prepare: false,
    });

    try {
        // 3. Create the New Chat Session directly in the DB
        const [newSession] = await sql`
            INSERT INTO chat_sessions (user_id, title)
            VALUES (${user.id}, 'New Conversation')
            RETURNING id
        `;

        if (!newSession) {
            throw new Error("Failed to create session");
        }

        // 4. Redirect to the new chat
        redirect(`/dashboard/chat/${newSession.id}`);

    } catch (error) {
        console.error("Error creating chat:", error);
        // If redirect throws (which is normal in Next.js), let it bubble up
        if ((error as any).digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        // Otherwise go back to dashboard
        redirect("/dashboard");
    } finally {
        // Close connection to prevent leaks
        await sql.end(); 
    }
}