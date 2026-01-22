"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext'; // Ensure this exists or mock it local logic

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Mock Auth Delay
        setTimeout(() => {
            // Set simple cookie or local storage to simulate session
            if (typeof window !== 'undefined') {
                localStorage.setItem("pg_auth_token", "mock-token-123");
                localStorage.setItem("pg_user_email", email);
            }

            router.push('/dashboard/connect'); // Redirect to connect after login as per user flow
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center">
                    <Shield className="w-10 h-10 text-[#7C3AED] mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white">Sign In</h1>
                </div>

                <div className="bg-[#111623] border border-white/10 rounded-xl p-6 shadow-xl">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED] outline-none transition-all placeholder:text-gray-600"
                                placeholder="name@company.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Password</label>
                                <a href="#" className="text-xs text-[#7C3AED] hover:text-white transition-colors">Forgot?</a>
                            </div>
                            <input
                                type="password"
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED] outline-none transition-all placeholder:text-gray-600"
                                placeholder="••••••••"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold h-10 rounded-lg transition-all"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-sm text-gray-500">
                    Don't have an account? <a href="#" className="text-[#7C3AED] hover:underline">Sign up</a>
                </p>
            </div>
        </div>
    );
}
