"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2, ArrowRight, Play, Globe, Terminal, Cpu, Check, AlertTriangle } from 'lucide-react';
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
        <div className="min-h-screen bg-[#0B0F19] text-white selection:bg-[#7C3AED]/30 font-sans">

            <MobileNav />

            {/* Desktop Navbar */}
            <nav className={`hidden lg:flex fixed top-0 w-full z-40 transition-all duration-300 ${scrolled ? 'bg-[#0B0F19]/90 backdrop-blur-md border-b border-white/5' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <Shield className="w-6 h-6 text-[#7C3AED]" />
                        <span>PolicyGuard AI</span>
                    </div>

                    <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-300">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                        <Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
                        <Link href="/login" className="hover:text-white transition-colors text-[#7C3AED] font-bold">Start Connecting</Link>
                        <Link href="/team" className="hover:text-white transition-colors">Team</Link>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                            Login
                        </Link>
                        <Link href="/signup">
                            <Button className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-full px-8 shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all hover:scale-105">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#7C3AED]/20 rounded-full blur-[120px] -z-10"></div>

                <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7C3AED]/10 text-[#A78BFA] text-xs font-bold uppercase tracking-widest border border-[#7C3AED]/20 mb-8 hover:bg-[#7C3AED]/20 transition-colors cursor-pointer">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A78BFA] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C4B5FD]"></span>
                            </span>
                            v2.0 Now Live: Automated Remediation
                        </div>

                        <h1 className="text-5xl lg:text-8xl font-extrabold tracking-tight leading-[1.1] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                            Governance for the <br />
                            <span className="text-white">Action Era.</span>
                        </h1>

                        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12">
                            Deploy autonomous agents with confidence. We provide the <span className="text-[#A78BFA]">Trust Layer</span> that validates, monitors, and fixes your AI's behavior in real-time.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/signup">
                                <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all hover:scale-105">
                                    Start Free Audit <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full sm:w-auto h-14 px-10 text-lg rounded-full border-white/10 text-white hover:bg-white/5 bg-transparent backdrop-blur-sm"
                                onClick={() => loginAsGuest()}
                            >
                                <Play className="mr-2 w-5 h-5 fill-white" /> Live Demo
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-[#0B0F19] relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: Terminal, title: "Red Team Mode", desc: "Adversarial simulation to find vulnerabilities before deployment." },
                            { icon: Shield, title: "Compliance Engine", desc: "Turn PDF policies into executable guardrails automatically." },
                            { icon: Cpu, title: "SLA Risk Engine", desc: "Forecast latency and token usage bottlenecks." },
                        ].map((feature, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-[#7C3AED]/50 transition-all hover:-translate-y-2 group">
                                <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center mb-6 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                                    <feature.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Connect Agent Feature */}
            <section className="py-24 bg-[#080C14] border-t border-white/5 relative overflow-hidden">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1">
                        <div className="relative rounded-2xl border border-white/10 bg-[#0B0F19] p-2 shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl pointer-events-none" />
                            {/* Code Snippet Visual */}
                            <div className="bg-[#111623] rounded-xl overflow-hidden font-mono text-sm leading-relaxed p-6 text-gray-400">
                                <div className="flex gap-2 mb-4 text-xs opacity-50">
                                    <span className="text-blue-400">import</span> openai
                                </div>
                                <div className="text-gray-500"># Point to PolicyGuard Proxy</div>
                                <div>
                                    <span className="text-purple-400">client</span> = <span className="text-yellow-400">openai.OpenAI</span>(
                                </div>
                                <div className="pl-4">
                                    <span className="text-blue-300">base_url</span>=<span className="text-green-400">"https://api.policyguard.ai/v1"</span>,
                                </div>
                                <div className="pl-4">
                                    <span className="text-blue-300">api_key</span>=<span className="text-green-400">os.getenv("OPENAI_KEY")</span>
                                </div>
                                <div>)</div>
                                <br />
                                <div className="text-gray-500"> # Requests are now governed automatically</div>
                                <div>
                                    response = client.chat.completions.create(...)
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-500/20 mb-6">
                            Universal Proxy
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-bold mb-6">Connect in 2 lines of code.</h2>
                        <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                            No complex SDKs. Just change your <code className="bg-white/10 px-2 py-1 rounded text-white font-mono text-sm">base_url</code> and instantly get full observability, PII protection, and policy enforcement for your existing agents.
                        </p>
                        <div className="space-y-4 mb-8">
                            {[
                                "Works with OpenAI, Anthropic, and Local Models",
                                "Zero latency impact (<10ms overhead)",
                                "Drop-in replacement for existing stacks"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-gray-300">
                                    <Check className="w-5 h-5 text-blue-500" />
                                    {item}
                                </div>
                            ))}
                        </div>
                        <Link href="/login">
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 h-12">
                                Start Connecting <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
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

            {/* Automated Remediation Panel */}
            <section className="py-32 bg-[#0B0F19] relative">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center lg:grid-flow-col-dense">
                    {/* Visual Panel Side */}
                    <div className="lg:col-start-2">
                        <div className="relative rounded-2xl border border-white/10 bg-[#111623] p-1 shadow-2xl">
                            {/* Window Header */}
                            <div className="bg-[#1A202E] px-4 py-3 rounded-t-xl flex items-center gap-2 border-b border-white/5">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                </div>
                                <span className="ml-4 text-xs font-mono text-gray-500">remediation_engine.tsx</span>
                            </div>

                            {/* Code/Panel Content */}
                            <div className="p-6 space-y-6">
                                {/* Alert Item */}
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                    <div className="flex items-start gap-4">
                                        <AlertTriangle className="w-6 h-6 text-red-500 mt-1" />
                                        <div>
                                            <h4 className="text-red-400 font-bold mb-1">Critical: PII Leak Detected</h4>
                                            <p className="text-red-400/80 text-sm mb-3">Response contains unmasked SSN pattern.</p>
                                            <div className="bg-black/40 p-3 rounded-lg font-mono text-xs text-gray-400 mb-3">
                                                {`{ "user_data": "SSN: 123-45-..." }`}
                                            </div>
                                            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white border-none h-8 text-xs">
                                                Auto-Fix Rule Applied
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Suggestion Item */}
                                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        <span className="text-green-400 text-sm font-medium">Policy 'HIPAA_v2' successfully enforced.</span>
                                    </div>
                                    <span className="text-xs text-green-500/60 font-mono">12ms</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Text Side */}
                    <div className="lg:col-start-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-widest border border-green-500/20 mb-6">
                            Remediation
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-bold mb-6">Don't just detect.<br />Fix it automatically.</h2>
                        <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                            Why wake up at 3AM? Our Remediation Engine patches vulnerabilities and enforces guardrails instantly, without human intervention.
                        </p>
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="space-y-2">
                                <h4 className="text-white font-bold">Auto-Redacting</h4>
                                <p className="text-sm text-gray-500">Automatically mask PII and sensitive data before it leaves the gateway.</p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-white font-bold">Policy Enforcement</h4>
                                <p className="text-sm text-gray-500">Block or reroute requests that violate defined safety policies.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 border-t border-white/5 bg-[#080C14]">

                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 font-bold text-xl tracking-tight mb-6">
                            <Shield className="w-6 h-6 text-[#7C3AED]" />
                            <span>PolicyGuard AI</span>
                        </div>
                        <p className="text-gray-500 max-w-sm mb-8 text-sm leading-relaxed">
                            The comprehensive governance platform for the next generation of autonomous AI agents. Secure, monitor, and deploy with absolute confidence.
                        </p>
                        <div className="flex gap-4">
                            {[1, 2, 3, 4].map((_, i) => (
                                <div key={i} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#7C3AED] hover:text-white transition-colors cursor-pointer">
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
            </footer >
        </div >
    );
}

function MockGraph() {
    return (
        <div className="w-full h-full flex items-center justify-center text-gray-500">
            [3D Force Graph Interactive Visualization]
        </div>
    )
}
