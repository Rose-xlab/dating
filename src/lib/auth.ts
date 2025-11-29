import { Lucia } from "lucia";
import postgres from "postgres";
import { PostgresJsAdapter } from "@lucia-auth/adapter-postgresql";

// ----------------------------------------------------------------
// THE FIX: Use Connection String + prepare: false
// ----------------------------------------------------------------
const connectionString = "postgres://postgres.hqwbtsevwmbsmrrthbkl:SecurePass20252025@aws-1-eu-north-1.pooler.supabase.com:6543/postgres";
const sql = postgres(connectionString, {
    ssl: "require",
    prepare: false,      // <--- REQUIRED for Port 6543
});

const adapter = new PostgresJsAdapter(sql, {
    user: "auth_user",
    session: "user_session"
});

export const lucia = new Lucia(adapter, {
    sessionCookie: {
        expires: false,
        attributes: {
            secure: process.env.NODE_ENV === "production"
        }
    },
    getUserAttributes: (attributes) => {
        return {
            email: attributes.email
        };
    }
});

declare module "lucia" {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: DatabaseUserAttributes;
    }
}

interface DatabaseUserAttributes {
    email: string;
}