"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Terminal, Fingerprint, Database, Shield, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export default function LoginPage() {
    const { login, loginAsGuest, user, isLoading } = useAuth() as any;
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [demoSequence, setDemoSequence] = useState(false);
    const [terminalLines, setTerminalLines] = useState<string[]>([]);

    useEffect(() => {
        if (!isLoading && user) router.push('/dashboard');
    }, [user, isLoading, router]);

    const triggerGuestLogin = async () => {
        setDemoSequence(true);
        const lines = [
            '> Initializing Lexinel Sentinel Protocol...',
            '> Verifying judge credentials...',
            '> Granting ANALYST_SUDO permissions...',
            '> Loading IBM AML enforcement engine...',
            '> ACCESS_GRANTED: Welcome to Lexinel.',
        ];
        for (const line of lines) {
            await new Promise(r => setTimeout(r, 600));
            setTerminalLines(prev => [...prev, line]);
        }
        await new Promise(r => setTimeout(r, 500));
        localStorage.setItem('pg_tour_active', 'true');
        window.dispatchEvent(new CustomEvent('pg-start-tour'));
        loginAsGuest();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await login(email, password);
        } catch (err: any) {
            setError((err.message || 'Invalid credentials.').replace('Firebase: ', ''));
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen font-outfit bg-background">
            {/* Theme Toggle */}
            <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="fixed top-4 right-4 z-50 p-2 rounded-full border border-[var(--border-neon)] bg-background/80 backdrop-blur text-[var(--neon)] hover:scale-110 transition-all"
            >
                {theme === 'dark'
                    ? <Sun className="w-4 h-4" />
                    : <Moon className="w-4 h-4" />
                }
            </button>

            {/* Demo Terminal Overlay */}
            <AnimatePresence>
                {demoSequence && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-[#030806] flex flex-col items-center justify-center font-mono p-8"
                    >
                        <div className="w-full max-w-lg">
                            <div className="flex items-center gap-2 text-[#1aff8c] mb-6 border-b border-[rgba(26,255,140,0.15)] pb-4">
                                <Terminal className="w-5 h-5" />
                                <span className="text-base font-bold tracking-widest">LEXINEL_SENTINEL_v2.0</span>
                            </div>
                            <div className="space-y-2">
                                {terminalLines.map((line, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                                        <span className="text-[rgba(26,255,140,0.4)]">$</span>
                                        <span className={i === terminalLines.length - 1 ? 'text-[#1aff8c] font-bold' : 'text-[rgba(26,255,140,0.7)]'}>{line}</span>
                                        {i === terminalLines.length - 1 && <span className="inline-block w-2 h-4 bg-[#1aff8c] animate-pulse ml-1" />}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Left Panel */}
            <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-[#070c0a]">
                <div className="absolute inset-0 bg-grid-cyber opacity-60" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[120px] bg-[rgba(26,255,140,0.06)]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[120px] bg-[rgba(26,255,140,0.04)]" />

                <div className="z-10">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-10">
                        <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
                            <path d="M16 3L27 9V23L16 29L5 23V9L16 3Z" stroke="#1aff8c" strokeWidth="1.5" strokeLinejoin="round" opacity="0.4" />
                            <path d="M16 7L23 11V21L16 25L9 21V11L16 7Z" fill="rgba(26,255,140,0.06)" stroke="#1aff8c" strokeWidth="1.5" strokeLinejoin="round" />
                            <path d="M13 11V21H22" stroke="#1aff8c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="22" cy="21" r="2" fill="#1aff8c" opacity="0.9" />
                        </svg>
                        <div>
                            <span className="text-lg font-bold tracking-widest text-white">LEX<span className="text-[#1aff8c]">INEL</span></span>
                            <p className="text-[9px] text-[rgba(26,255,140,0.5)] tracking-[0.2em] uppercase">Compliance Sentinel</p>
                        </div>
                    </div>

                    <h1 className="text-5xl font-bold text-white leading-tight mb-4">
                        AML Compliance,<br />
                        <span className="text-[#1aff8c]" style={{ textShadow: '0 0 30px rgba(26,255,140,0.4)' }}>Automated.</span>
                    </h1>
                    <p className="text-[rgba(255,255,255,0.45)] text-lg max-w-md leading-relaxed">
                        Lexinel ingests regulatory PDFs, synthesizes enforcement rules, and autonomously scans the IBM AML dataset — no human intervention required.
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="z-10 space-y-3">
                    {[
                        { icon: Database, label: 'Database Sentinel', sub: 'Real-time IBM AML scan engine' },
                        { icon: Shield, label: 'N2L Recompiler', sub: 'PDF → enforcement logic via Gemini' },
                        { icon: Activity, label: 'Red Team Hub', sub: 'Adversarial attack simulation' },
                    ].map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.15 }}
                            className="flex items-center gap-4 p-4 rounded-xl bg-[rgba(26,255,140,0.04)] border border-[rgba(26,255,140,0.1)] hover:border-[rgba(26,255,140,0.25)] transition-all"
                        >
                            <div className="p-2.5 rounded-lg bg-[rgba(26,255,140,0.1)]">
                                <f.icon className="w-5 h-5 text-[#1aff8c]" />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm">{f.label}</p>
                                <p className="text-[rgba(255,255,255,0.35)] text-xs">{f.sub}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex w-full items-center justify-center lg:w-1/2 px-4 sm:px-8">
                <div className="w-full max-w-md space-y-6">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-1">Welcome back</h2>
                        <p className="text-muted-foreground text-sm">Sign in to your Lexinel dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-foreground/80 text-sm">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="analyst@institution.com"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="h-11 bg-background border-border focus:border-[var(--neon)] focus:ring-1 focus:ring-[var(--neon)] transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-foreground/80 text-sm">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="h-11 bg-background border-border focus:border-[var(--neon)] focus:ring-1 focus:ring-[var(--neon)] transition-all"
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>
                        )}

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-11 text-sm font-bold text-[#070c0a] dark:text-[#070c0a] transition-all"
                            style={{ background: 'var(--neon)', boxShadow: '0 0 20px rgba(26,255,140,0.3)' }}
                        >
                            {isSubmitting ? 'Signing in...' : 'Sign In'}
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            No account?{' '}
                            <a href="/signup" className="font-medium" style={{ color: 'var(--neon)' }}>Sign up</a>
                        </p>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-3 bg-background text-muted-foreground font-mono uppercase tracking-widest">
                                Hackathon Judge Access
                            </span>
                        </div>
                    </div>

                    {/* One-Click Access */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={triggerGuestLogin}
                        className="w-full h-16 relative overflow-hidden group rounded-xl border p-1 transition-all"
                        style={{
                            background: 'rgba(26,255,140,0.06)',
                            borderColor: 'rgba(26,255,140,0.25)',
                            boxShadow: '0 0 20px rgba(26,255,140,0.05)'
                        }}
                    >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: 'rgba(26,255,140,0.08)' }} />
                        <div className="relative h-full flex items-center justify-between px-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg" style={{ background: 'rgba(26,255,140,0.15)', boxShadow: '0 0 12px rgba(26,255,140,0.2)' }}>
                                    <Fingerprint className="w-5 h-5 text-[#1aff8c]" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-foreground text-sm">One-Click Judge Access</p>
                                    <p className="text-xs text-muted-foreground">Full sandbox with live IBM AML data</p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-[#1aff8c] group-hover:translate-x-1 transition-transform" />
                        </div>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
