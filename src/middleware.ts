import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
    // 1. Get the session cookie (Default Lucia name is "auth_session")
    // We CANNOT check the database here, so we just check if the cookie exists.
    const sessionCookie = req.cookies.get("auth_session");

    const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");
    const isApi = req.nextUrl.pathname.startsWith("/api");

    // 2. If trying to access Dashboard without a cookie -> Redirect to Login
    if (isDashboard && !sessionCookie) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // 3. If trying to access protected API without a cookie -> 401 Error
    // (We exclude /api/auth because that is for login/signup)
    if (isApi && !req.nextUrl.pathname.startsWith("/api/auth") && !sessionCookie) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 4. Allow the request to continue
    return NextResponse.next();
}

export const config = {
    // Only run this middleware on dashboard and protected API routes
    matcher: ["/dashboard/:path*", "/api/((?!auth).*)"],
};