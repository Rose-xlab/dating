import { lucia } from "@/lib/auth";
import { Argon2id } from "oslo/password";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();
        const supabase = createClient();

        // 1. Find User
        const { data: existingUser } = await supabase
            .from("auth_user")
            .select()
            .eq("email", email)
            .single();

        if (!existingUser) {
            return NextResponse.json({ error: "Incorrect email or password" }, { status: 400 });
        }

        // 2. Get Password Key
        const { data: userKey } = await supabase
            .from("user_key")
            .select()
            .eq("user_id", existingUser.id)
            .single();

        if (!userKey || !userKey.hashed_password) {
            return NextResponse.json({ error: "Incorrect email or password" }, { status: 400 });
        }

        // 3. Verify Password
        const validPassword = await new Argon2id().verify(userKey.hashed_password, password);
        if (!validPassword) {
            return NextResponse.json({ error: "Incorrect email or password" }, { status: 400 });
        }

        // 4. Create Session
        const session = await lucia.createSession(existingUser.id, {});
        const sessionCookie = lucia.createSessionCookie(session.id);

        // --------------------------------------------------------------------------------
        // THE FIX: Return 200 OK (JSON) instead of 302 Redirect
        // This ensures the browser sets the cookie reliably before navigating.
        // --------------------------------------------------------------------------------
        return NextResponse.json(
            { success: true },
            {
                status: 200, // OK
                headers: {
                    "Set-Cookie": sessionCookie.serialize() // The Cookie is attached here
                }
            }
        );

    } catch (e) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
