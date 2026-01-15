"use client"

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { InfiniteMovingCards } from '@/components/ui/infinite-cards';
import { Shield, CheckCircle2, Zap, Lock, ArrowRight, Play, Activity, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
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
                        <Link href="/login">
                            <Button variant="ghost" className="font-medium">Sign In</Button>
                        </Link>
                        <Link href="/signup">
                            <Button className="font-medium bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8 relative z-10"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Now with Gemini 3 Pro Reasoning
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                            Deploy AI with <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                                Zero Risk.
                            </span>
                        </h1>

                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed">
                            The executive control plane for AI governance. We validate your AI agents using
                            <span className="font-semibold text-gray-900 dark:text-gray-200"> simulated post-deployment traces </span>
                            to ensure continuous compliance.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/signup">
                                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                                    Start Free Audit <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full border-2">
                                <Play className="mr-2 w-5 h-5" /> Watch Demo
                            </Button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pt-4 text-sm text-gray-500 font-medium">
                            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> SOC2 Compliant</span>
                            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> No Latency Impact</span>
                        </div>
                    </motion.div>

                    {/* Hero Interactive Visual - Placeholder for "Lively" Video/Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative h-[500px] md:h-[600px] w-full mt-24 lg:mt-0"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-3xl blur-3xl"></div>

                        {/* Main Dashboard Preview Card */}
                        <div className="relative h-full w-full bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden group">
                            {/* Use Next.js Image for optimization, assuming the generated image will be placed at /public/dashboard-mockup.png */}
                            {/* Replacing this with the actual generated artifact path later, for now using a placeholder div structure that looks like UI */}
                            <div className="absolute inset-0 bg-zinc-950">
                                <div className="absolute top-4 left-4 right-4 h-8 bg-zinc-900 rounded-lg flex items-center px-4 gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                {/* Mock UI Elements animating */}
                                <div className="absolute top-16 left-4 right-4 bottom-4 grid grid-cols-3 gap-4">
                                    <div className="col-span-2 bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
                                        <div className="h-8 w-1/3 bg-zinc-800 rounded mb-4 animate-pulse"></div>
                                        <div className="space-y-3">
                                            <div className="h-20 w-full bg-blue-500/10 border border-blue-500/20 rounded-lg"></div>
                                            <div className="h-20 w-full bg-zinc-800/50 rounded-lg"></div>
                                            <div className="h-20 w-full bg-zinc-800/50 rounded-lg"></div>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 flex flex-col items-center justify-center">
                                        <div className="w-32 h-32 rounded-full border-8 border-green-500/20 border-t-green-500 flex items-center justify-center">
                                            <span className="text-3xl font-bold text-white">98%</span>
                                        </div>
                                        <p className="mt-4 text-gray-400">Readiness Score</p>
                                    </div>
                                </div>
                            </div>

                            {/* Overlay for "Lively" effect */}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60"></div>
                            <Image
                                src="/dashboard_hero_mockup.png"
                                alt="PolicyGuard Dashboard"
                                fill
                                className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                            />
                        </div>

                        {/* Floating Cards */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="hidden 2xl:flex desktop-only-card absolute -left-12 bottom-20 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 items-center gap-4 max-w-xs z-20"
                        >
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">PII Leak Prevented</p>
                                <p className="text-xs text-gray-500">Just now • Customer Support Agent</p>
                            </div>
                        </motion.div>
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="hidden 2xl:flex desktop-only-card absolute -right-8 top-40 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 items-center gap-4 max-w-xs z-20"
                        >
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Policy Validated</p>
                                <p className="text-xs text-gray-500">HIPAA Compliance Check Passed</p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Infinite Scroll - User Flow */}
            <section className="py-2 overflow-hidden bg-white dark:bg-zinc-950">
                <div className="mb-8 text-center">
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

            {/* Trust Section */}
            <section className="py-12 border-y border-gray-100 dark:border-zinc-900 bg-gray-50 dark:bg-zinc-900/50">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-8">Trusted by Compliance Leaders at</p>
                    <div className="flex flex-wrap justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        {['Acme Corp', 'GlobalBank', 'HealthPlus', 'TechFlow', 'SecureNet'].map((brand) => (
                            <span key={brand} className="text-xl font-bold font-serif text-gray-400 dark:text-gray-500">{brand}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 max-w-7xl mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Continuous Compliance Layer</h2>
                    <p className="text-gray-500 text-lg">Simulate post-deployment traces to catch policy drifts before they happen.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { icon: Brain, title: "Simulated Traces", desc: "We generate synthetic user traffic to stress-test your agents against new policies." },
                        { icon: Lock, title: "Pre-Deployment Gates", desc: "Block unsafe workflows with executive-grade guardrails." },
                        { icon: Globe, title: "Continuous Monitoring", desc: "Real-time auditing of every decision trace, ensuring 24/7 compliance." }
                    ].map((feature, i) => (
                        <div key={i} className="p-8 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 border border-transparent hover:border-gray-200 dark:hover:border-zinc-800 transition-all duration-300 shadow-sm hover:shadow-xl">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                            <p className="text-gray-500 leading-relaxed">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-gray-100 dark:border-zinc-900 text-center text-gray-500 text-sm">
                <p>&copy; 2024 PolicyGuard AI. All rights reserved.</p>
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
