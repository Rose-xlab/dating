//src\app\api\auth\signup\route.ts

import { lucia } from "@/lib/auth";
import { generateId } from "lucia";
import { Argon2id } from "oslo/password";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // Use the server client

export async function POST(req: NextRequest) {
    const { email, password } = await req.json();
    const supabase = createClient();

    if (!email || typeof email !== "string" || email.length < 3) {
        return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const hashedPassword = await new Argon2id().hash(password);
    const userId = generateId(15);

    try {
        const { error: userError } = await supabase.from("auth_user").insert({
            id: userId,
            email: email,
        });

        if (userError) {
            return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }

        const { error: keyError } = await supabase.from("user_key").insert({
            id: `email:${email}`,
            user_id: userId,
            hashed_password: hashedPassword,
        });

        if (keyError) {
            // Clean up the user if the key insertion fails
            await supabase.from("auth_user").delete().eq("id", userId);
            return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
        }

        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);

        return new NextResponse(null, {
            status: 302,
            headers: {
                "Location": "/dashboard",
                "Set-Cookie": sessionCookie.serialize()
            }
        });
    } catch (e) {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
