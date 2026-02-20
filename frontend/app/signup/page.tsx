"use client"

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ArrowRight, UserPlus, Building, Briefcase, Terminal, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function SignUpPage() {
    const { signup, loginAsGuest } = useAuth() as any;
    const { updateProfile } = useUser();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [company, setCompany] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [demoSequence, setDemoSequence] = useState(false);
    const [terminalLines, setTerminalLines] = useState<string[]>([]);

    const triggerGuestLogin = async () => {
        setDemoSequence(true);
        // Simulate Terminal Sequence
        const lines = [
            "Initializing Test Protocol...",
            "Bypassing SSO...",
            "Granting 'Judge' Permissions...",
            "ACCESS_GRANTED: Welcome to Lexinel."
        ];

        for (const line of lines) {
            await new Promise(r => setTimeout(r, 600)); // Delay per line
            setTerminalLines(prev => [...prev, line]);
        }

        await new Promise(r => setTimeout(r, 800)); // Final pause for wow factor

        // Start Tour
        localStorage.setItem('pg_tour_active', 'true');
        window.dispatchEvent(new CustomEvent('pg-start-tour'));

        // Login
        loginAsGuest();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // 1. Create Auth User
            await signup(email, password, name);

            // 2. Update Profile Context with extra details
            updateProfile({
                name: name,
                organization: company || 'My Organization',
                jobTitle: jobTitle || 'Member',
                team: 'General',
                systemRole: 'Admin' // First user is Admin
            });

        } catch (err: any) {
            console.error("Signup Error:", err);
            // Clean up Firebase error message
            const errorMessage = err.message || "An unexpected error occurred.";
            setError(errorMessage.replace("Firebase: ", "").replace(" (auth/email-already-in-use).", ""));
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen font-outfit">
            {/* Demo Sequence Overlay */}
            <AnimatePresence>
                {demoSequence && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-mono text-green-400 p-8"
                    >
                        <div className="w-full max-w-lg space-y-4">
                            <div className="flex items-center gap-2 text-white mb-6 border-b border-white/10 pb-4">
                                <Terminal className="w-6 h-6" />
                                <span className="text-xl font-bold tracking-widest">JUDGE_TERMINAL_V1.0</span>
                            </div>

                            <div className="space-y-2">
                                {terminalLines.map((line, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="text-green-600">➜</span>
                                        <span>{line}</span>
                                        {i === terminalLines.length - 1 && (
                                            <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-2" />
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Left Side - Visuals */}
            <div className="hidden w-1/2 bg-gray-900 lg:flex flex-col justify-between p-12 relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="z-10">
                    <div className="flex items-center gap-2 text-white/90 font-bold text-xl tracking-tight mb-8">
                        <Shield className="w-8 h-8 text-blue-500" />
                        Lexinel
                    </div>

                    <h1 className="text-5xl font-bold text-white leading-tight mb-6">
                        Join the future of<br />
                        <span className="text-blue-500">AI Governance.</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-md">
                        Create an account to start auditing your AI workflows with enterprise-grade precision.
                    </p>
                </div>

                {/* Abstract Metrics Visual */}
                <div className="z-10 grid gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"
                    >
                        <div className="p-2 bg-indigo-500/20 rounded-full">
                            <UserPlus className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h4 className="text-white font-medium">Team Collaboration</h4>
                            <p className="text-sm text-gray-500">Invite compliance officers & devs</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex w-full items-center justify-center lg:w-1/2 bg-white dark:bg-zinc-950">
                <div className="w-full max-w-md space-y-8 px-4 sm:px-6">
                    <div className="space-y-2 text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Create Account</h2>
                        <p className="text-gray-500 dark:text-gray-400">Get started with Lexinel today</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-11"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company">Company</Label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="company"
                                        type="text"
                                        placeholder="Acme Inc."
                                        required
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        className="h-11 pl-10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="jobTitle">Job Title</Label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="jobTitle"
                                        type="text"
                                        placeholder="CTO"
                                        required
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        className="h-11 pl-10"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="executive@company.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-11"
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 text-base group"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Creating Account...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Sign Up <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-gray-500">
                        Already have an account? <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">Sign in</Link>
                    </p>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-zinc-950 px-2 text-gray-500 font-mono">For Hackathon Judges</span>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={triggerGuestLogin}
                        className="w-full h-16 relative overflow-hidden group rounded-xl bg-gradient-to-r from-cyan-900/10 to-cyan-800/10 border border-cyan-500/30 p-1"
                    >
                        <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors"></div>
                        <div className="relative h-full flex items-center justify-between px-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-500 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                    <Fingerprint className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">One-Click Test Access</h3>
                                    <p className="text-xs text-cyan-600 dark:text-cyan-400">Instant Sandbox Environment</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-cyan-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
