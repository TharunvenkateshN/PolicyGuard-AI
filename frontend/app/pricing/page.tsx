"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Shield, Zap, Building, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
    const router = useRouter();
    const [isAnnual, setIsAnnual] = useState(true);

    const toggle = () => setIsAnnual(!isAnnual);

    const plans = [
        {
            name: "Starter",
            desc: "For individuals and side projects.",
            price: isAnnual ? 0 : 0,
            features: ["1 AI Agent Monitor", "Basic Policy Library", "Community Support", "7-day Log Retention"],
            icon: Shield,
            popular: false
        },
        {
            name: "Pro",
            desc: "For growing teams and startups.",
            price: isAnnual ? 49 : 59,
            features: ["10 AI Agent Monitors", "Advanced Governance Policies", "Email Support", "30-day Log Retention", "SLA Monitoring"],
            icon: Zap,
            popular: true
        },
        {
            name: "Enterprise",
            desc: "For large organizations with strict compliance needs.",
            price: "Custom",
            features: ["Unlimited Agents", "Custom Policy Engine", "24/7 Dedicated Support", "Unlimited Log Retention", "On-Prem Deployment"],
            icon: Building,
            popular: false
        }
    ];

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white pt-10 pb-20 px-6 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <div className="mb-12">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="hover:bg-white/10 hover:text-white text-gray-400 gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                </div>

                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                        Choose the plan that's right for your AI governance needs. No hidden fees.
                    </p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
                        <button
                            onClick={toggle}
                            className="w-14 h-8 bg-white/10 rounded-full relative p-1 transition-colors hover:bg-white/20"
                        >
                            <div className={`w-6 h-6 bg-[#7C3AED] rounded-full shadow-lg transition-transform duration-300 ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                        <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-gray-500'}`}>Annual <span className="text-[#7C3AED] text-xs font-bold ml-1">(Save 20%)</span></span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {plans.map((plan, i) => (
                            <div key={i} className={`relative p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-2 ${plan.popular ? 'bg-white/5 border-[#7C3AED] shadow-[0_0_40px_rgba(124,58,237,0.1)]' : 'bg-transparent border-white/10 hover:border-white/20'}`}>
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#7C3AED] text-white text-xs font-bold rounded-full uppercase tracking-widest">
                                        Most Popular
                                    </div>
                                )}
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 mx-auto">
                                    <plan.icon className="w-6 h-6 text-[#A78BFA]" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-gray-400 text-sm mb-6 h-10">{plan.desc}</p>
                                <div className="mb-8">
                                    <span className="text-4xl font-bold">{typeof plan.price === 'number' ? `$${plan.price}` : plan.price}</span>
                                    {typeof plan.price === 'number' && <span className="text-gray-500">/mo</span>}
                                </div>
                                <ul className="space-y-4 mb-8 text-left">
                                    {plan.features.map((feat, j) => (
                                        <li key={j} className="flex items-start gap-3 text-sm text-gray-300">
                                            <Check className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button className={`w-full rounded-full h-12 font-medium ${plan.popular ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                                    {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
