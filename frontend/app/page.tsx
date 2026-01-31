"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Shield,
    ShieldCheck,
    ArrowRight,
    Activity,
    Brain,
    LayoutDashboard,
    Terminal,
    Lock,
    ExternalLink,
    Play,
    Flame,
    Wrench,
    Zap,
    Github,
    Linkedin,
    Check,
    Building,
    Hexagon,
    Atom,
    Target,
    Users,
    CreditCard,
    Globe,
    CheckCircle2,
    Database,
    Crosshair,
    FileCheck,
    Code,
    ShieldAlert,
    Link2
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function LandingPage() {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="bg-[#020202] text-white min-h-screen font-sans selection:bg-blue-500/30">
            {/* Nav */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4 bg-black/60 backdrop-blur-xl border-b border-white/5' : 'py-8 bg-transparent'}`}>
                <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
                    <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="w-10 h-10 bg-blue-600 flex items-center justify-center rounded-none border border-blue-400/50 shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:scale-110 transition-transform">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-black uppercase italic tracking-tighter">Policy<span className="text-blue-500">Guard</span> AI</span>
                        </div>
                        <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[7px] font-black uppercase tracking-[0.2em] text-blue-400 backdrop-blur-md">
                            <span className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]"></span>
                            AI Governance Framework
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-12">
                        {[
                            { name: 'Features', href: '/features' },
                            { name: 'Governance', href: '/governance' },
                            { name: 'Pricing', href: '/pricing' },
                            { name: 'Team', href: '/team' }
                        ].map((item) => (
                            <Link key={item.name} href={item.href} className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-white transition-colors relative group">
                                {item.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-px bg-blue-500 transition-all group-hover:w-full"></span>
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-6">
                        <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">Log In</Link>
                        <Button onClick={() => router.push('/login')} className="bg-white text-black hover:bg-zinc-200 rounded-none px-6 font-black uppercase italic tracking-widest text-[10px] h-11 border border-white/20">
                            Initialize Shell
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
                <div
                    className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center relative z-10"
                >
                    <div className="space-y-10">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <h1 className="text-6xl md:text-8xl font-outfit font-black tracking-tighter leading-[0.9] uppercase italic">
                                THE <span className="text-blue-600">CONTROL LAYER</span><br />
                                <span className="text-zinc-400">FOR AI AGENTS.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-zinc-400 max-w-xl mt-8 leading-relaxed font-medium">
                                A policy-driven governance framework for continuous, live-stream observability of autonomous agent workflows.
                                Secure your AI fleet with proactive, real-time intervention.
                            </p>
                        </motion.div>

                        <div className="flex flex-wrap gap-4 pt-10">
                            <Button size="lg" onClick={() => router.push('/login')} className="h-16 px-10 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic tracking-widest border-none rounded-none shadow-[0_0_50px_rgba(37,99,235,0.3)]">
                                Enter Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                            <Button size="lg" variant="outline" onClick={() => router.push('/login')} className="h-16 px-10 border-white/20 text-white font-black uppercase italic tracking-widest hover:bg-white/5 bg-transparent rounded-none outline-none">
                                <span className="flex items-center gap-2">
                                    <Play className="w-4 h-4 fill-white" /> View Demo <ExternalLink className="w-3 h-3 ml-2 opacity-50" />
                                </span>
                            </Button>
                        </div>
                    </div>

                    <div className="relative pointer-events-none flex items-center justify-center">
                        <div className="grid grid-cols-2 grid-rows-4 gap-4 w-full max-w-[550px]">
                            {/* Card 1: Activity Metric */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="row-span-1 bg-[#0A0A0A]/80 backdrop-blur-3xl border border-white/10 p-6 rounded-[2rem] flex flex-col justify-center"
                            >
                                <div className="text-4xl font-black text-white italic tracking-tighter">500+</div>
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-2">Threat Vectors Scanned</div>
                            </motion.div>

                            {/* Card 2: Highlight Asset (Iridescent Feel) */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="row-span-4 col-start-2 bg-[#050505] border border-white/5 p-10 rounded-[3rem] flex flex-col justify-between relative overflow-hidden shadow-2xl"
                            >
                                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent"></div>
                                {/* Iridescent Line Pattern */}
                                <div className="absolute -top-1/2 -right-1/4 w-[200%] h-[200%] opacity-20 pointer-events-none rotate-12">
                                    <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent blur-3xl"></div>
                                </div>

                                <div className="relative z-10">
                                    <div className="text-7xl font-black text-white italic tracking-tighter leading-none">100%</div>
                                    <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mt-4">Audit Transparency</div>
                                </div>
                                <div className="relative flex justify-center py-10">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full animate-pulse"></div>
                                    <div className="w-40 h-40 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                        <Shield className="w-20 h-20 text-blue-500" />
                                    </div>
                                </div>
                                <div className="relative z-10 text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                                    PG-SECURITY // OPS-72
                                </div>
                            </motion.div>

                            {/* Card 3: Policies Metric */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="row-span-2 bg-[#0A0A0A]/40 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] flex flex-col justify-center overflow-hidden group"
                            >
                                <div className="text-5xl font-black text-white italic tracking-tighter leading-none">30+</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-3">Governance Policies</div>
                                <div className="mt-8 relative h-16">
                                    <Atom className="w-16 h-16 text-zinc-800 absolute -bottom-4 -left-4 animate-spin-slow group-hover:text-blue-500/20 transition-colors" />
                                </div>
                            </motion.div>

                            {/* Card 4: High Contrast Text */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.9 }}
                                className="row-span-1 bg-white p-6 rounded-[2rem] flex items-center justify-center text-center shadow-[0_0_50px_rgba(255,255,255,0.15)]"
                            >
                                <div className="text-black font-black uppercase tracking-tighter leading-none text-[11px] italic">
                                    SEMANTIC <br />
                                    <span className="text-blue-600 block my-1">RISK</span>
                                    CONTROLLER
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Vertical Decorative Strips */}
                <div className="absolute right-0 top-0 bottom-0 w-24 border-l border-white/5 hidden xl:flex flex-col items-center justify-end py-20 gap-10">
                    <p className="rotate-90 text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600 whitespace-nowrap mb-20 origin-center">
                        Secure AI Protocol v4.0.2
                    </p>
                    <div className="w-px h-40 bg-gradient-to-b from-transparent via-zinc-800 to-transparent"></div>
                </div>
            </section>


            {/* Section 3: The Architecture Pillars */}
            <section className="py-32 bg-[#020202]">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Pillar 1 */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="p-12 bg-zinc-900/20 border border-white/5 rounded-[3rem] group"
                        >
                            <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-10 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <ShieldAlert className="w-8 h-8 text-blue-500 group-hover:text-white" />
                            </div>
                            <h3 className="text-3xl font-black uppercase italic text-white mb-6">Hallucination <br />Deflector</h3>
                            <p className="text-zinc-500 leading-relaxed font-medium">
                                Real-time semantic comparison between agent output and verified knowledge base to intercept false claims before they reach the user.
                            </p>
                        </motion.div>

                        {/* Pillar 2 */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="p-12 bg-zinc-900/20 border border-white/5 rounded-[3rem] group"
                        >
                            <div className="w-16 h-16 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-10 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                <Lock className="w-8 h-8 text-emerald-500 group-hover:text-white" />
                            </div>
                            <h3 className="text-3xl font-black uppercase italic text-white mb-6">Autonomous <br />SLA Guard</h3>
                            <p className="text-zinc-500 leading-relaxed font-medium">
                                Hard latency and reliability constraints enforced at the proxy layer. If the agent exceeds parameters, the system executes failover protocols.
                            </p>
                        </motion.div>

                        {/* Pillar 3 */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="p-12 bg-zinc-900/20 border border-white/5 rounded-[3rem] group"
                        >
                            <div className="w-16 h-16 bg-purple-600/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mb-10 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                <Target className="w-8 h-8 text-purple-500 group-hover:text-white" />
                            </div>
                            <h3 className="text-3xl font-black uppercase italic text-white mb-6">PII Redaction <br />Engines</h3>
                            <p className="text-zinc-500 leading-relaxed font-medium">
                                Multi-layered scanning for secrets, crypto-keys, and sensitive personal data within agent trace logs and live response streams.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Section 4: Global Standards Grid */}
            <section className="py-32 bg-[#050505] relative">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-outfit font-black uppercase italic mb-6">Built for <span className="text-blue-500">Compliance.</span></h2>
                        <p className="text-zinc-500 text-lg font-medium max-w-2xl mx-auto">PolicyGuard mapped to the world's most rigorous security frameworks.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[
                            { name: "SOC2 Type II", level: "L3" },
                            { name: "GDPR", level: "L3" },
                            { name: "HIPAA", level: "L2" },
                            { name: "ISO 27001", level: "L3" },
                            { name: "NIST AI RMF", level: "L1" },
                            { name: "PCI DSS", level: "L2" }
                        ].map((std) => (
                            <div key={std.name} className="p-8 bg-zinc-900/40 border border-white/5 rounded-3xl group hover:border-blue-500/30 transition-all text-center">
                                <div className="text-[10px] font-black tracking-widest text-blue-500 mb-4 uppercase">Protocol_{std.level}</div>
                                <div className="text-sm font-black uppercase italic text-zinc-300 group-hover:text-white transition-colors">{std.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 5: The Invisible Shield (Value Statement) */}
            <section className="py-40 bg-black relative">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[4rem] p-20 border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-20">
                            <ShieldCheck className="w-64 h-64 text-white" />
                        </div>
                        <div className="max-w-2xl relative z-10">
                            <h2 className="text-5xl md:text-7xl font-outfit font-black uppercase italic tracking-tighter mb-10 leading-none">
                                THE <span className="text-white">INVISIBLE SHIELD</span> <br />
                                <span className="text-blue-500">BETWEEN AI & APPS.</span>
                            </h2>
                            <p className="text-zinc-400 text-xl font-medium leading-relaxed mb-12">
                                PolicyGuard operates at the network periphery, intercepting and inspecting every token in milliseconds.
                                We enable enterprises to deploy agents with the confidence that their core values and security protocols are hard-coded into the infrastructure.
                            </p>
                            <div className="flex gap-10">
                                <div>
                                    <div className="text-4xl font-black text-white italic">8ms</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-2">Avg Overhead</div>
                                </div>
                                <div className="w-px h-12 bg-zinc-800"></div>
                                <div>
                                    <div className="text-4xl font-black text-white italic">99.9%</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-2">Uptime Verifier</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-20 bg-black text-center border-t border-white/5">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-4xl md:text-5xl font-outfit font-black uppercase italic mb-10 tracking-tighter">Ready to secure your fleet?</h2>
                    <Button size="lg" onClick={() => router.push('/login')} className="h-16 px-12 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic tracking-widest rounded-none">
                        Establish Protocol
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-white/5 bg-[#020202] relative z-20">
                <div className="max-w-[1400px] mx-auto px-6 grid md:grid-cols-4 gap-12">
                    <div className="col-span-2">
                        <div className="flex items-center gap-3 mb-8">
                            <Shield className="w-8 h-8 text-blue-500" />
                            <span className="text-xl font-black uppercase italic tracking-tighter">PolicyGuard AI</span>
                        </div>
                        <p className="text-zinc-500 text-sm max-w-sm leading-relaxed">
                            A specialized observability and governance core for securing
                            autonomous agent fleets and complex AI workflows.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8 italic">Platform</h4>
                        <ul className="space-y-4 text-zinc-500 text-xs font-bold uppercase transition-colors">
                            <Link href="/features" className="hover:text-white cursor-pointer transition-colors block">Risk Core</Link>
                            <Link href="/governance" className="hover:text-white cursor-pointer transition-colors block">Proxy Hub</Link>
                            <Link href="/pricing" className="hover:text-white cursor-pointer transition-colors block">Pricing</Link>
                            <Link href="/team" className="hover:text-white cursor-pointer transition-colors block">Team</Link>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8 italic">Company</h4>
                        <ul className="space-y-4 text-zinc-500 text-xs font-bold uppercase transition-colors">
                            <li className="hover:text-white cursor-pointer transition-colors">Research</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Security</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Legal</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Contact</li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-[1400px] mx-auto px-6 mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-700">
                    <p>© 2026 PolicyGuard AI Framework. All rights reserved.</p>
                    <div className="flex gap-10">
                        <span className="hover:text-zinc-400 cursor-pointer">Privacy Protocol</span>
                        <span className="hover:text-zinc-400 cursor-pointer">SLA Agreement</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
