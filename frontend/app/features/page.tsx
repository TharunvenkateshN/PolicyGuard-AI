"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Shield,
    Target,
    Activity,
    Flame,
    Zap,
    ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function FeaturesPage() {
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
                    <div className="grid lg:grid-cols-12 gap-16 items-start">
                        <div className="lg:col-span-5 space-y-10">
                            <div className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px]">
                                Governance Core
                            </div>
                            <h2 className="text-7xl md:text-8xl font-outfit font-black tracking-tighter leading-[0.9] uppercase italic">
                                MONITOR. <br /><span className="text-white">REMEDIATE.</span><br />
                                <span className="text-zinc-500">PROTECT.</span>
                            </h2>
                            <p className="text-zinc-400 text-lg font-medium leading-relaxed max-w-xl">
                                PolicyGuard acts as a live semantic firewall. We inspect every token in your agent's
                                stream against codified security policies, providing unbroken observability and
                                immediate intervention for non-compliant signals.
                            </p>
                            <div className="flex gap-10">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Analysis Phase</div>
                                    <div className="text-xl font-black italic text-zinc-300">RED TEAMING</div>
                                </div>
                                <div className="w-px h-12 bg-white/10"></div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Runtime Phase</div>
                                    <div className="text-xl font-black italic text-zinc-300">PROXIED SLA</div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                            <motion.div whileHover={{ y: -8 }} className="group bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-10 h-[320px] rounded-3xl flex flex-col justify-between transition-all duration-500 hover:border-blue-500/50">
                                <div>
                                    <Target className="w-10 h-10 text-blue-500 mb-6" />
                                    <h3 className="text-2xl font-black italic uppercase text-white mb-2">Evaluate</h3>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Systematic analysis of agent trace logs against enterprise-ready policy controls.</p>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-700">TRACE-SCAN // ACTIVE</div>
                            </motion.div>

                            <motion.div whileHover={{ y: -8 }} className="group bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-10 h-[320px] rounded-3xl flex flex-col justify-between transition-all duration-500 hover:border-emerald-500/50">
                                <div>
                                    <Activity className="w-10 h-10 text-emerald-500 mb-6" />
                                    <h3 className="text-2xl font-black italic uppercase text-white mb-2">Live Monitor</h3>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Continuous, low-latency streaming of agent interactions and hidden reasoning traces.</p>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-700">PROTO-STREAM // LIVE</div>
                            </motion.div>

                            <motion.div whileHover={{ y: -8 }} className="group bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-10 h-[320px] rounded-3xl flex flex-col justify-between transition-all duration-500 hover:border-orange-500/50">
                                <div>
                                    <Flame className="w-10 h-10 text-orange-500 mb-6" />
                                    <h3 className="text-2xl font-black italic uppercase text-white mb-2">Red Team</h3>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Automated adversarial simulations to pressure test agent boundaries.</p>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-700">ADV-SIM // STRESS</div>
                            </motion.div>

                            <motion.div whileHover={{ y: -8 }} className="group bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-10 h-[320px] rounded-3xl flex flex-col justify-between shadow-2xl transition-all duration-500 hover:border-yellow-500/50">
                                <div>
                                    <Zap className="w-10 h-10 text-yellow-500 mb-6" />
                                    <h3 className="text-2xl font-black italic uppercase text-white mb-2">SLA Guard</h3>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Enforce latency, reliability, and policy compliance SLAs at runtime.</p>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-700">SLA-99.9 // ENFORCED</div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
