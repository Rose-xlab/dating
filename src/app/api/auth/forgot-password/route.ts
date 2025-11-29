import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { email } = await req.json();
    const supabase = createClient();

    // The redirectTo path must be part of your site's URL configured in your Supabase project.
    const redirectTo = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
    });

    if (error) {
        console.error("Supabase password reset error:", error);
        return NextResponse.json({ error: "Could not send password reset email. Please try again later." }, { status: 500 });
    }

    // Always return a success message to prevent email enumeration.
    return NextResponse.json({ message: "Password reset link has been sent to your email." });
}
