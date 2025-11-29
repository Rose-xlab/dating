import { lucia } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(_req: NextRequest) {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { session } = await lucia.validateSession(sessionId);
    if (session) {
        await lucia.invalidateSession(session.id);
    }

    const sessionCookie = lucia.createBlankSessionCookie();
    return new NextResponse(null, {
        status: 302,
        headers: {
            "Location": "/login",
            "Set-Cookie": sessionCookie.serialize()
        }
    });
}




