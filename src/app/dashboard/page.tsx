import { lucia } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export default async function DashboardPage() {
    // 1. Verify Session (Security Check)
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) redirect("/login");
    
    const { user } = await lucia.validateSession(sessionId);
    if (!user) redirect("/login");

    // 2. Render the "Welcome" View
    // This component renders INSIDE the `children` prop of your DashboardLayout
    return (
        <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="max-w-lg w-full text-center space-y-6">
                
                {/* Welcome Card */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                    <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                        <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        Welcome back!
                    </h2>
                    
                    <p className="text-gray-600 mb-8">
                        Your safety assistant is ready. Start a new conversation to analyze chat screenshots or text for red flags.
                    </p>

                    {/* Action Button: Links to your existing 'New Chat' route */}
                    <Link 
                        href="/dashboard/chat/new"
                        className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Start New Analysis</span>
                    </Link>
                </div>

                {/* Footer Info */}
                <div className="text-sm text-gray-400">
                    Logged in as {user.email}
                </div>
            </div>
        </div>
    );
}