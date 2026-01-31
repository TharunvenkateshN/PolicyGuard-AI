"use client";

import React from 'react';
import {
    Shield,
    Wrench,
    Activity,
    Database,
    Crosshair,
    Code,
    FileCheck,
    Globe,
    Zap,
    Lock,
    Brain,
    ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function GovernancePage() {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="bg-[#020202] text-white min-h-screen font-sans selection:bg-blue-500/30 overflow-hidden">
            {/* Nav */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4 bg-black/60 backdrop-blur-xl border-b border-white/5' : 'py-8 bg-transparent'}`}>
                <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
                    <div className="flex flex-col items-start gap-1">
                        <div onClick={() => router.push('/')} className="flex items-center gap-3 group cursor-pointer">
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

            <section className="pt-40 pb-32 relative z-10">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="mb-24">
                        <div className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px] mb-6">
                            Architectural Framework
                        </div>
                        <h2 className="text-6xl md:text-7xl font-outfit font-black tracking-tighter uppercase italic leading-none">
                            THE DEPLOYMENT <br /><span className="text-white">PROTOCOLS.</span>
                        </h2>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Pre-Deployment: The Build Phase */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="bg-zinc-900/20 backdrop-blur-3xl border border-white/5 p-12 rounded-[3rem] relative group transition-all duration-500 hover:border-blue-500/30"
                        >
                            <div className="absolute top-10 right-10 text-[10px] font-black tracking-[0.3em] text-blue-500/50 group-hover:text-blue-500 transition-colors">PHASE_01 // PRE-DEPLOY</div>
                            <div className="flex items-center gap-4 mb-12">
                                <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                                    <Wrench className="w-8 h-8 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black uppercase italic text-white">BUILD & HARDEN</h3>
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Sandbox Environment</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {[
                                    { title: "Policy Embedding", desc: "Convert governance docs into machine-readable vector embeddings for real-time comparison.", icon: Database },
                                    { title: "Adversarial Pressure", desc: "Execute automated red-team simulations to discover latent logic flaws before launch.", icon: Crosshair },
                                    { title: "Remediation Snippets", desc: "Generate policy-aligned code guardrails to patch identified risk vectors automatically.", icon: Code },
                                    { title: "Compliance Scorecard", desc: "Quantify agent readiness with cryptographically verifiable risk reports.", icon: FileCheck }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-6 group/item">
                                        <div className="w-px h-12 bg-zinc-800 relative mt-2 group-hover/item:bg-blue-500/50 transition-colors">
                                            <div className="absolute top-0 -left-1 w-2 h-2 rounded-full bg-zinc-700 group-hover/item:bg-blue-500 transition-colors"></div>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black uppercase italic text-zinc-300 mb-1 group-hover/item:text-white transition-colors">{item.title}</h4>
                                            <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-md">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Post-Deployment: The Run Phase */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="bg-zinc-900/20 backdrop-blur-3xl border border-white/5 p-12 rounded-[3rem] relative group transition-all duration-500 hover:border-emerald-500/30"
                        >
                            <div className="absolute top-10 right-10 text-[10px] font-black tracking-[0.3em] text-emerald-500/50 group-hover:text-emerald-500 transition-colors">PHASE_02 // POST-DEPLOY</div>
                            <div className="flex items-center gap-4 mb-12">
                                <div className="p-4 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl">
                                    <Activity className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black uppercase italic text-white">RUN & GOVERN</h3>
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Operational Environment</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {[
                                    { title: "Live Streaming Proxy", desc: "Continuous, token-by-token inspection of every interaction through the secure gateway.", icon: Globe },
                                    { title: "Dynamic SLA Guard", desc: "Real-time enforcement of latency, reliability, and policy-compliance SLAs.", icon: Zap },
                                    { title: "Risk Containment", desc: "Automated intervention and notification when a policy breach is detected in production.", icon: Lock },
                                    { title: "Continuous Learning", desc: "Systematic feedback loop where telemetry data improves pre-deployment models.", icon: Brain }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-6 group/item">
                                        <div className="w-px h-12 bg-zinc-800 relative mt-2 group-hover/item:bg-emerald-500/50 transition-colors">
                                            <div className="absolute top-0 -left-1 w-2 h-2 rounded-full bg-zinc-700 group-hover/item:bg-emerald-500 transition-colors"></div>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black uppercase italic text-zinc-300 mb-1 group-hover/item:text-white transition-colors">{item.title}</h4>
                                            <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-md">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}
