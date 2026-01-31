"use client";

import React from 'react';
import {
    Shield,
    Users,
    Linkedin,
    Github,
    ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function TeamPage() {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const team = [
        {
            name: "Tharun N V",
            role: "Co-Founder · Product & AI Architecture",
            details: [
                "Product vision & problem definition",
                "Gemini 3 reasoning workflows",
                "Policy evaluation & remediation",
                "System architecture & governance"
            ],
            image: "/team/tharun.png",
            linkedin: "https://www.linkedin.com/in/tharun-n-v-859794320/",
            github: "https://github.com/TharunvenkateshN"
        },
        {
            name: "Vishal M",
            role: "Co-Founder · Engineering & Platform",
            details: [
                "Application development & UI",
                "Frontend dashboards & visualization",
                "OWASP & PII scan engines",
                "API gateway & deployment"
            ],
            image: "/team/vishal.png",
            linkedin: "https://www.linkedin.com/in/vishal2601dev/",
            github: "https://github.com/shalcoder"
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

            <section id="team" className="pt-40 pb-32 bg-black relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="flex flex-col items-center text-center mb-24 gap-10">
                        <div className="max-w-3xl">
                            <Users className="w-12 h-12 text-blue-500 mb-8 mx-auto" />
                            <h2 className="text-6xl md:text-8xl font-outfit font-black tracking-tighter uppercase italic mb-8 leading-tight">
                                THE MINDS BEHIND <br /><span className="text-blue-500">THE SHIELD.</span>
                            </h2>
                            <p className="text-zinc-500 text-xl font-medium leading-relaxed max-w-2xl mx-auto">
                                Verifying compliance through advanced AI reasoning and platform engineering.
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                        {team.map((member, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                className="group relative p-1 rounded-[3rem] bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20 overflow-hidden"
                            >
                                <div className="bg-zinc-900/80 backdrop-blur-3xl rounded-[2.9rem] p-10 h-full border border-white/5 transition-all duration-500 relative">
                                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                                        <div className="w-40 h-40 shrink-0 rounded-[2rem] overflow-hidden border-2 border-zinc-800 shadow-2xl relative group-hover:border-blue-500/50 transition-colors duration-500">
                                            <img src={member.image} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
                                            {/* Scanner Animation */}
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                                <div className="absolute inset-0 bg-blue-500/10"></div>
                                                <motion.div
                                                    initial={{ top: "-10%" }}
                                                    animate={{ top: "110%" }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                    className="absolute left-0 right-0 h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-20"
                                                />
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-3xl font-black uppercase italic text-white mb-2">{member.name}</h3>
                                            <div className="text-blue-500 font-black uppercase tracking-[0.2em] text-[10px] mb-6">
                                                {member.role}
                                            </div>
                                            <ul className="space-y-2 mb-8">
                                                {member.details.map((detail, idx) => (
                                                    <li key={idx} className="text-zinc-500 text-xs font-medium flex items-center gap-2">
                                                        <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                                        {detail}
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="flex gap-4 justify-center md:justify-start">
                                                <a href={member.linkedin} target="_blank" className="p-3 bg-white/5 hover:bg-blue-600 transition-all rounded-xl"><Linkedin className="w-5 h-5 text-white" /></a>
                                                <a href={member.github} target="_blank" className="p-3 bg-white/5 hover:bg-zinc-800 transition-all rounded-xl"><Github className="w-5 h-5 text-white" /></a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
