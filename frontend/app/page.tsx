"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2, ArrowRight, Play, Globe, Terminal, Cpu, Check, AlertTriangle, Code, LayoutDashboard, Lock, Zap, MessageSquare, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import dynamic from 'next/dynamic';
import { MobileNav } from '@/components/layout/MobileNav';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

export default function LandingPage() {
    const { loginAsGuest } = useAuth() as any;
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Mock Data for Graph
    const gData = {
        nodes: [
            { id: 'Agent Core', group: 1 },
            { id: 'Billing API', group: 2 },
            { id: 'User DB', group: 2 },
            { id: 'Email Svc', group: 2 },
            { id: 'LLM Gateway', group: 3 },
            { id: 'Policy: HIPAA', group: 4 },
            { id: 'Policy: RBAC', group: 4 },
        ],
        links: [
            { source: 'Agent Core', target: 'Billing API' },
            { source: 'Agent Core', target: 'User DB' },
            { source: 'Agent Core', target: 'LLM Gateway' },
            { source: 'Billing API', target: 'Email Svc' },
            { source: 'Policy: HIPAA', target: 'User DB' },
            { source: 'Policy: RBAC', target: 'Agent Core' },
        ]
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-200 selection:bg-cyan-500/30 font-sans relative">
            {/* Cyber Grid Overlay */}
            <div className="absolute inset-0 bg-grid-cyber pointer-events-none opacity-20 z-0"></div>

            <MobileNav />

            {/* Desktop Navbar */}
            <nav className={`hidden lg:flex fixed top-0 w-full z-40 transition-all duration-300 ${scrolled ? 'bg-[#0B0F19]/90 backdrop-blur-md border-b border-cyan-900/30' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
                        <Shield className="w-6 h-6 text-cyan-400" />
                        <span>PolicyGuard AI</span>
                    </div>

                    <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
                        <Link href="/how-it-works" className="hover:text-cyan-400 transition-colors">How It Works</Link>
                        <Link href="/pricing" className="hover:text-cyan-400 transition-colors">Pricing</Link>
                        <Link href="/team" className="hover:text-cyan-400 transition-colors">Team</Link>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                            Login
                        </Link>
                        <Link href="/signup">
                            <Button className="bg-cyan-600 hover:bg-cyan-500 text-white rounded px-6 border border-cyan-400/20 shadow-[0_0_20px_rgba(8,145,178,0.3)] transition-all hover:scale-105 font-semibold tracking-wide">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 overflow-hidden z-10">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px] -z-10"></div>

                <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 text-cyan-400 text-xs font-bold uppercase tracking-widest border border-cyan-500/20 mb-8 hover:bg-cyan-900/40 transition-colors cursor-pointer backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            PolicyGuard V2: Full Lifecycle Governance
                        </div>

                        <h1 className="text-5xl lg:text-8xl font-extrabold tracking-tight leading-[1.1] mb-8 text-white">
                            Secure AI Agents <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Pre & Post Deployment.</span>
                        </h1>

                        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
                            The complete trust layer for Autonomous Systems. Red Team your agents before launch, then protect them with real-time guardrails in production.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/signup">
                                <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg rounded bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_30px_rgba(8,145,178,0.4)] transition-all hover:scale-105 text-white font-bold">
                                    Start Security Audit <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full sm:w-auto h-14 px-10 text-lg rounded border-cyan-500/30 text-cyan-100 hover:bg-cyan-950/30 bg-cyan-950/10 backdrop-blur-sm"
                                onClick={() => loginAsGuest()}
                            >
                                <Play className="mr-2 w-5 h-5 fill-cyan-400 text-cyan-400" /> Live Demo
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Lifecycle Stages Section */}
            <section className="py-24 bg-[#080C14] border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-5xl font-bold mb-4">Complete Lifecycle Protection</h2>
                        <p className="text-gray-400">From the first line of code to millions of interactions.</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Pre-Deployment */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-blue-900/10 rounded-3xl blur-xl -z-10 group-hover:bg-blue-800/20 transition-all"></div>
                            <div className="bg-[#0f141f] border border-blue-500/20 rounded-3xl p-8 h-full">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                                        <Code className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-blue-100">Pre-Deployment</h3>
                                    <span className="px-2 py-1 rounded bg-blue-500/10 text-xs font-mono text-blue-400 border border-blue-500/20">BUILD PHASE</span>
                                </div>

                                <div className="space-y-6">
                                    {[
                                        { title: "Adversarial Red Teaming", desc: "Simulate OWASP Top 10 attacks (Injection, Jailbreaks) to find holes.", icon: Terminal },
                                        { title: "Auto-Remediation", desc: "Generate secure Python/TS guardrail code automatically.", icon: Zap },
                                        { title: "AI Policy Assistant", desc: "Chat with your governance docs. Ask 'Is this HIPAA compliant?' to get citations.", icon: MessageSquare },
                                    ].map((feat, i) => (
                                        <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                            <feat.icon className="w-6 h-6 text-gray-400 mt-1" />
                                            <div>
                                                <h4 className="font-bold text-white">{feat.title}</h4>
                                                <p className="text-sm text-gray-400 mt-1">{feat.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Post-Deployment */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-purple-900/10 rounded-3xl blur-xl -z-10 group-hover:bg-purple-800/20 transition-all"></div>
                            <div className="bg-[#0f141f] border border-purple-500/20 rounded-3xl p-8 h-full">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                                        <Globe className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-purple-100">Post-Deployment</h3>
                                    <span className="px-2 py-1 rounded bg-purple-500/10 text-xs font-mono text-purple-400 border border-purple-500/20">RUN PHASE</span>
                                </div>

                                <div className="space-y-6">
                                    {[
                                        { title: "SLA & Latency Intelligence", desc: "Enforce strict latency budgets (<100ms) and predict cost overruns.", icon: Activity },
                                        { title: "Shadow AI Detection", desc: "Identify unauthorized agent activity and API endpoints.", icon: AlertTriangle },
                                        { title: "3D Visual Monitoring", desc: "Interactive map of all data flows and policy violations.", icon: LayoutDashboard },
                                    ].map((feat, i) => (
                                        <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                            <feat.icon className="w-6 h-6 text-gray-400 mt-1" />
                                            <div>
                                                <h4 className="font-bold text-white">{feat.title}</h4>
                                                <p className="text-sm text-gray-400 mt-1">{feat.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Visual Compliance Mapping (Graph) */}
            <section className="py-32 bg-[#080C14] border-y border-white/5 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-500/20 mb-6">
                            Graph Viz
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-bold mb-6">Visual Compliance Mapping</h2>
                        <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                            See your agent's brain. We map every API call, database query, and external interaction to your compliance policies in a 3D interactive graph.
                        </p>
                        <ul className="space-y-4 mb-8">
                            {[
                                "Real-time Data Flow Analysis",
                                "Policy Violation Highlighting",
                                "Infrastructure Dependency Mapping"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-300">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8">
                            Explore Graph View
                        </Button>
                    </div>

                    {/* Graph Container */}
                    <div className="relative h-[500px] w-full bg-black/50 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                        <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs font-mono text-blue-400 border border-blue-500/30">
                            LIVE_MONITORING: ACTIVE
                        </div>
                        <ForceGraph3D
                            graphData={gData}
                            backgroundColor="#000000"
                            nodeColor={node => {
                                // @ts-ignore
                                return node.group === 1 ? '#ef4444' : node.group === 4 ? '#3b82f6' : '#ffffff'
                            }}
                            linkColor={() => '#ffffff33'}
                            nodeLabel="id"
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 border-t border-white/5 bg-[#080C14]">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 font-bold text-xl tracking-tight mb-6">
                            <Shield className="w-6 h-6 text-blue-500" />
                            <span>PolicyGuard AI</span>
                        </div>
                        <p className="text-gray-500 max-w-sm mb-8 text-sm leading-relaxed">
                            The comprehensive governance platform for the next generation of autonomous AI agents. Secure, monitor, and deploy with absolute confidence.
                        </p>
                        <div className="flex gap-4">
                            {[1, 2, 3, 4].map((_, i) => (
                                <div key={i} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer">
                                    <Globe className="w-4 h-4" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Product</h4>
                        <ul className="space-y-4 text-sm text-gray-500">
                            <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Enterprise</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Legal</h4>
                        <ul className="space-y-4 text-sm text-gray-500">
                            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
                    <p>&copy; 2026 PolicyGuard AI. All rights reserved.</p>
                    <p>Designed for the Future of AI.</p>
                </div>
            </footer>
        </div>
    );
}
