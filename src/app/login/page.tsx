//src\app\login\page.tsx

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            router.push("/dashboard");
        } else {
            const data = await response.json();
            setError(data.error || "Something went wrong.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center">Login</h1>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input"
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                    <button type="submit" className="button w-full">
                        Login
                    </button>
                    <div className="text-sm text-center">
                        <Link href="/forgot-password">
                            <p className="font-medium text-blue-600 hover:underline">Forgot your password?</p>
                        </Link>
                    </div>
                    <div className="text-sm text-center">
                        <p>
                            Don't have an account?{" "}
                            <Link href="/signup">
                                <span className="font-medium text-blue-600 hover:underline">Sign up</span>
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}