"use client"

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { InfiniteMovingCards } from '@/components/ui/infinite-cards';
import { Shield, CheckCircle2, Zap, Lock, ArrowRight, Play, Activity, Globe, Terminal, MessageSquare, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

export default function LandingPage() {
    const { loginAsGuest } = useAuth() as any;
    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 selection:bg-blue-500/30">

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <Shield className="w-6 h-6 text-blue-600" />
                        <span>PolicyGuard AI</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            className="font-medium hidden sm:flex border-dashed border-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => loginAsGuest()}
                        >
                            🧪 Test Mode
                        </Button>
                        <Link href="/login">
                            <Button variant="ghost" className="font-medium">Sign In</Button>
                        </Link>
                        <Link href="/signup">
                            <Button className="font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-white to-white dark:from-blue-900/20 dark:via-zinc-950 dark:to-zinc-950"></div>
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8 relative z-10"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Powering the Action Era
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                            The Trust Layer for <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                                Autonomous Agents.
                            </span>
                        </h1>

                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed">
                            Don't just deploy chatbots. Deploy <b>governed agents</b>.
                            We use <span className="text-blue-600 dark:text-blue-400 font-semibold">Adversarial Simulation (Red Teaming)</span> and
                            <span className="text-blue-600 dark:text-blue-400 font-semibold"> Post-Deployment Verification</span> to ensure your AI acts safely in the real world.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/signup">
                                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all hover:scale-105">
                                    Start Red Team Audit <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full border-2 hover:bg-gray-50 dark:hover:bg-zinc-900">
                                <Play className="mr-2 w-5 h-5" /> Live Demo
                            </Button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pt-4 text-sm text-gray-500 font-medium">
                            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Gemini 3 Pro Reasoning</span>
                            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> OWASP LLM Top 10</span>
                        </div>
                    </motion.div>

                    {/* Hero Visual - Dashboard Preview */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="relative rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden transform rotate-1 hover:rotate-0 transition-all duration-500">
                            {/* Mock Terminal Interface */}
                            <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <div className="ml-4 text-xs font-mono text-zinc-500">policyguard_cli — red_team_sim</div>
                            </div>
                            <div className="p-6 font-mono text-sm space-y-2 bg-zinc-950 text-green-400 h-[400px]">
                                <p>{">"} initializing_governance_protocol...</p>
                                <p>{">"} loading_context: <span className="text-white">medical_claims_agent_v3</span></p>
                                <p>{">"} active_policies: [HIPAA_Strict, GDPR_Article_22]</p>
                                <p className="text-yellow-500">{">"} simulating_attack_vector: PROMPT_INJECTION_JAILBREAK...</p>
                                <p className="text-red-500">{">"} ALERT: Potential PII Leak detected in trace #4029</p>
                                <p>{">"} auto_correcting_guardrails...</p>
                                <p className="text-blue-400">{">"} VERIFICATION_COMPLETE: Resilience Score 98/100</p>
                                <div className="mt-4 p-4 border border-green-900/50 bg-green-900/10 rounded flex items-center justify-between">
                                    <span>Deployment Status:</span>
                                    <span className="font-bold text-green-400">APPROVED</span>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badge */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -left-6 bottom-10 bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-700 flex items-center gap-3"
                        >
                            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-600 dark:text-blue-400 font-bold text-xl">
                                🔒
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 dark:text-white">Vibe Engineering</div>
                                <div className="text-xs text-gray-500">Autonomous Verification</div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Why Choose Us / What We Offer */}
            <section className="py-24 bg-gray-50 dark:bg-zinc-900/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Why PolicyGuard?</h2>
                        <p className="text-gray-500 text-lg">
                            We bridge the gap between "Cool Demo" and "Enterprise Production".
                            In the Action Era, you need more than just a prompt—you need a **Governance Layer**.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Feature 1: Red Team */}
                        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mb-6 text-red-600">
                                <Terminal className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Red Team Mode</h3>
                            <p className="text-gray-500 mb-4 text-sm">
                                "We hack your agent so hackers can't." Automated adversarial logic.
                            </p>
                            <ul className="space-y-2 text-xs text-gray-500">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Automated Attacks</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> OWASP LLM Testing</li>
                            </ul>
                        </div>

                        {/* Feature 2: Compliance Engine */}
                        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 bg-blue-600 text-white text-[10px] font-bold rounded-bl-xl">POPULAR</div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Compliance Engine</h3>
                            <p className="text-gray-500 mb-4 text-sm">
                                Turn PDF Policies into executable guardrails using multimodal reasoning.
                            </p>
                            <ul className="space-y-2 text-xs text-gray-500">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> PDF/Docx Ingestion</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Intent Analysis</li>
                            </ul>
                        </div>

                        {/* Feature 3: SLA Engine (NEW) */}
                        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center mb-6 text-amber-600">
                                <Cpu className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">SLA Risk Engine</h3>
                            <p className="text-gray-500 mb-4 text-sm">
                                Latency IS a compliance issue. We predict performance bottlenecks.
                            </p>
                            <ul className="space-y-2 text-xs text-gray-500">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Latency Forecasting</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Token Usage Opt.</li>
                            </ul>
                        </div>

                        {/* Feature 4: Advisory */}
                        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Chat Assistance</h3>
                            <p className="text-gray-500 mb-4 text-sm">
                                Your personal CISO. Ask questions about your architecture's safety.
                            </p>
                            <ul className="space-y-2 text-xs text-gray-500">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Architecture Review</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Real-time Q&A</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Infinite Scroll - User Flow */}
            <section className="py-20 overflow-hidden bg-white dark:bg-zinc-950">
                <div className="mb-8 text-center px-6">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">End-to-End Governance Flow</h3>
                </div>
                <InfiniteMovingCards
                    items={[
                        { title: "1. Policy Ingestion", image: "/mock_upload_ui.png" },
                        { title: "2. Intent Reasoning", image: "/mock_graph_ui.png" },
                        { title: "3. Deployment Verdict", image: "/mock_verdict_ui.png" },
                        { title: "4. Continuous Audit", image: "/mock_audit_ui.png" },
                    ]}
                    direction="left"
                    speed="slow"
                />
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-gray-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 font-bold text-xl tracking-tight mb-4">
                            <Shield className="w-6 h-6 text-blue-600" />
                            <span>PolicyGuard AI</span>
                        </div>
                        <p className="text-gray-500 max-w-sm">
                            Building the immune system for the Agentic Web.
                            Ensuring every autonomous action is safe, compliant, and verified.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Platform</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li>Red Team Mode</li>
                            <li>Compliance Audit</li>
                            <li>SLA Monitoring</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Hackathon</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li>Vibe Engineering</li>
                            <li>Action Era</li>
                            <li>Gemini 3 Pro</li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-100 dark:border-zinc-800 pt-8 text-center text-gray-500 text-sm">
                    <p>&copy; 2024 PolicyGuard AI. Built with ❤️ for the Gemini 3 Hackathon.</p>
                </div>
            </footer>
        </div>
    );
}

function Brain(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
        </svg>
    )
}
