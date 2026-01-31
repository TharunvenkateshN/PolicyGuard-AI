"use client";

import React from 'react';
import {
    Shield,
    Zap,
    Building,
    CreditCard,
    ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function PricingPage() {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const plans = [
        {
            name: "Starter",
            price: "0",
            features: ["1 AI Agent Monitor", "Basic Policy Library", "Community Support", "7-day Log Retention"],
            icon: Shield,
            color: "blue"
        },
        {
            name: "Pro",
            price: "49",
            features: ["10 AI Agent Monitors", "Advanced Governance Policies", "Email Support", "30-day Retention", "SLA Monitoring"],
            icon: Zap,
            color: "purple",
            popular: true
        },
        {
            name: "Enterprise",
            price: "Custom",
            features: ["Unlimited Agents", "Custom Policy Engine", "24/7 Dedicated Support", "Unlimited Logs", "On-Prem Deployment"],
            icon: Building,
            color: "emerald"
        }
    ];

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

            <section id="pricing" className="pt-40 pb-32 bg-[#050505] relative overflow-hidden">
                <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="text-center mb-24">
                        <CreditCard className="w-10 h-10 text-blue-500 mx-auto mb-6" />
                        <h2 className="text-5xl md:text-6xl font-outfit font-black tracking-tighter uppercase italic mb-6">Simple, Transparent <span className="text-blue-500">Pricing</span></h2>
                        <p className="text-zinc-500 text-lg font-medium max-w-2xl mx-auto">Choose the plan that fits your AI governance scale. No complex tiers.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {plans.map((plan, i) => {
                            const hoverColors: Record<string, string> = {
                                blue: 'hover:border-blue-500/50',
                                purple: 'hover:border-purple-500/50',
                                emerald: 'hover:border-emerald-500/50'
                            };

                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    whileHover={{ y: -10 }}
                                    className={`relative p-12 rounded-[2.5rem] border transition-all duration-500 ${plan.popular ? 'bg-white/5 border-blue-500/50 shadow-[0_0_80px_rgba(37,99,235,0.1)]' : 'bg-transparent border-white/10'} ${hoverColors[plan.color]} backdrop-blur-3xl overflow-hidden`}
                                >
                                    {plan.popular && (
                                        <div className="absolute top-0 right-0 py-2 px-6 bg-blue-600 text-[10px] font-black uppercase italic tracking-widest rounded-bl-3xl">Most Popular</div>
                                    )}
                                    <plan.icon className={`w-12 h-12 mb-8 ${plan.popular ? 'text-blue-400' : 'text-zinc-600'}`} />
                                    <h3 className="text-3xl font-black uppercase italic mb-2 tracking-tight">{plan.name}</h3>
                                    <div className="mb-10 flex items-baseline gap-1">
                                        <span className="text-6xl font-black italic">
                                            {plan.price !== "Custom" ? `$${plan.price}` : plan.price}
                                        </span>
                                        {plan.price !== "Custom" && <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">/mo</span>}
                                    </div>
                                    <ul className="space-y-4 mb-12">
                                        {plan.features.map((feat, j) => (
                                            <li key={j} className="flex items-center gap-3 text-zinc-400 text-sm font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button onClick={() => router.push('/login')} className={`w-full h-14 font-black uppercase italic tracking-widest rounded-none ${plan.popular ? 'bg-blue-600 hover:bg-blue-500' : 'bg-white/5 hover:bg-white/10'}`}>
                                        Get Started
                                    </Button>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
}
