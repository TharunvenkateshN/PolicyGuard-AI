"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowRight, Terminal, Fingerprint, ShieldCheck,
    Activity, Brain, Lock, Zap, Globe, FileCheck,
    CreditCard, Database, Target, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function LandingPage() {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const { loginAsGuest } = useAuth() as any;
    const [demoSequence, setDemoSequence] = useState(false);
    const [terminalLines, setTerminalLines] = useState<string[]>([]);

    const triggerGuestLogin = async () => {
        setDemoSequence(true);
        const lines = [
            '> Initializing Lexinel Sentinel Protocol...',
            '> Verifying judge credentials...',
            '> Granting ANALYST_SUDO permissions...',
            '> Loading IBM AML enforcement engine...',
            '> ACCESS_GRANTED: Welcome to Lexinel.',
        ];
        for (const line of lines) {
            await new Promise(r => setTimeout(r, 600));
            setTerminalLines(prev => [...prev, line]);
        }
        await new Promise(r => setTimeout(r, 700));
        localStorage.setItem('pg_tour_active', 'true');
        window.dispatchEvent(new CustomEvent('pg-start-tour'));
        loginAsGuest();
    };

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="bg-[#030806] text-white min-h-screen font-outfit selection:bg-[rgba(26,255,140,0.2)]">

            {/* Demo Terminal Overlay */}
            <AnimatePresence>
                {demoSequence && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-[#030806] flex flex-col items-center justify-center font-mono p-8"
                    >
                        <div className="w-full max-w-lg">
                            <div className="flex items-center gap-2 text-[#1aff8c] mb-6 border-b border-[rgba(26,255,140,0.15)] pb-4">
                                <Terminal className="w-5 h-5" />
                                <span className="text-base font-bold tracking-widest">LEXINEL_SENTINEL_v2.0</span>
                            </div>
                            <div className="space-y-2">
                                {terminalLines.map((line, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                                        <span className="text-[rgba(26,255,140,0.4)]">$</span>
                                        <span className={i === terminalLines.length - 1 ? 'text-[#1aff8c] font-bold' : 'text-[rgba(26,255,140,0.7)]'}>{line}</span>
                                        {i === terminalLines.length - 1 && <span className="inline-block w-2 h-4 bg-[#1aff8c] animate-pulse ml-1" />}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Nav */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-3 bg-[#030806]/80 backdrop-blur-xl border-b border-[rgba(26,255,140,0.08)]' : 'py-6 bg-transparent'}`}>
                <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path d="M16 3L27 9V23L16 29L5 23V9L16 3Z" stroke="#1aff8c" strokeWidth="1.5" strokeLinejoin="round" opacity="0.4" />
                            <path d="M16 7L23 11V21L16 25L9 21V11L16 7Z" fill="rgba(26,255,140,0.06)" stroke="#1aff8c" strokeWidth="1.5" strokeLinejoin="round" />
                            <path d="M13 11V21H22" stroke="#1aff8c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="22" cy="21" r="2" fill="#1aff8c" opacity="0.9" />
                        </svg>
                        <div>
                            <span className="text-lg font-black tracking-widest text-white">LEX<span className="text-[#1aff8c]">INEL</span></span>
                            <p className="text-[9px] text-[rgba(26,255,140,0.5)] tracking-[0.2em] uppercase -mt-0.5">AML Compliance Engine</p>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-10">
                        {[
                            { name: 'Features', href: '/features' },
                            { name: 'How It Works', href: '/how-it-works' },
                        ].map((item) => (
                            <Link key={item.name} href={item.href}
                                className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-white transition-colors relative group">
                                {item.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#1aff8c] transition-all group-hover:w-full" />
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={triggerGuestLogin}
                            className="hidden lg:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1aff8c] hover:text-[rgba(26,255,140,0.7)] transition-colors">
                            <Fingerprint className="w-3.5 h-3.5" />
                            Judge Access
                        </button>
                        <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors">Log In</Link>
                        <Link href="/signup">
                            <button className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg border border-[rgba(26,255,140,0.3)] text-[#1aff8c] bg-[rgba(26,255,140,0.06)] hover:bg-[rgba(26,255,140,0.12)] transition-all" style={{ boxShadow: '0 0 16px rgba(26,255,140,0.1)' }}>
                                Get Started
                            </button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative min-h-screen flex items-center pt-24 overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[180px] bg-[rgba(26,255,140,0.04)] pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#030806] via-transparent to-transparent pointer-events-none" />

                <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10 w-full">
                    <div className="space-y-8">
                        {/* Badge */}
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(26,255,140,0.25)] bg-[rgba(26,255,140,0.06)] text-[10px] font-black uppercase tracking-[0.2em] text-[#1aff8c]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1aff8c] animate-pulse" />
                                IBM AML Dataset · Gemini N2L Synthesis · Live
                            </span>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
                            <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase">
                                AML<br />
                                <span className="text-[#1aff8c]" style={{ textShadow: '0 0 60px rgba(26,255,140,0.35)' }}>COMPLIANCE</span><br />
                                <span className="text-zinc-500">AUTOMATED.</span>
                            </h1>
                        </motion.div>

                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                            className="text-lg text-zinc-400 max-w-xl leading-relaxed">
                            Lexinel ingests regulatory PDFs — BSA, FATF, EU AMLD6 — and uses <span className="text-white font-semibold">Neural-to-Logic synthesis</span> to generate enforcement rules that scan the IBM AML dataset in real-time. Zero manual configuration.
                        </motion.p>

                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-wrap gap-4">
                            <Link href="/signup">
                                <button className="h-14 px-8 font-black uppercase tracking-widest text-sm text-[#030806] rounded-lg transition-all hover:brightness-110"
                                    style={{ background: '#1aff8c', boxShadow: '0 0 40px rgba(26,255,140,0.3)' }}>
                                    Start Free Trial <span className="ml-1">→</span>
                                </button>
                            </Link>
                            <button onClick={triggerGuestLogin}
                                className="h-14 px-8 font-black uppercase tracking-widest text-sm text-[#1aff8c] rounded-lg border border-[rgba(26,255,140,0.3)] bg-[rgba(26,255,140,0.06)] hover:bg-[rgba(26,255,140,0.10)] transition-all flex items-center gap-2">
                                <Fingerprint className="w-4 h-4" />
                                Judge Test Access
                            </button>
                        </motion.div>

                        {/* Stats row */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                            className="flex gap-8 pt-4 border-t border-[rgba(26,255,140,0.08)]">
                            {[
                                { val: '8,720', label: 'IBM AML Records' },
                                { val: '5', label: 'Active AML Rules' },
                                { val: '< 2s', label: 'Synthesis Time' },
                                { val: '100%', label: 'Audit Trace' },
                            ].map((s, i) => (
                                <div key={i}>
                                    <div className="text-2xl font-black text-white">{s.val}</div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-0.5">{s.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Right: Terminal card */}
                    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
                        className="relative">
                        <div className="rounded-2xl overflow-hidden border border-[rgba(26,255,140,0.15)] bg-[#070c0a]"
                            style={{ boxShadow: '0 0 60px rgba(26,255,140,0.08)' }}>
                            {/* Terminal bar */}
                            <div className="flex items-center gap-1.5 px-4 py-3 bg-[#050a07] border-b border-[rgba(26,255,140,0.08)]">
                                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                                <div className="w-3 h-3 rounded-full bg-[#1aff8c]/60" />
                                <span className="ml-3 text-[10px] font-mono text-[rgba(26,255,140,0.35)]">lexinel.sentinel — enforcement-stream</span>
                                <div className="ml-auto flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1aff8c] animate-pulse" />
                                    <span className="text-[9px] font-mono text-[#1aff8c]">LIVE</span>
                                </div>
                            </div>

                            {/* Simulated output */}
                            <div className="p-5 font-mono text-xs space-y-1.5">
                                {[
                                    { t: '19:21:44', s: 'BLOCK', c: 'text-red-400', msg: 'AML-R01 | ACC-8912 · $14,200 wire → CTR threshold exceeded' },
                                    { t: '19:21:02', s: 'WARN', c: 'text-amber-400', msg: 'AML-R05 | ACC-3301 · SWIFT: BOFIUS3N→KY · tax-haven route' },
                                    { t: '19:20:18', s: 'PASS', c: 'text-[#1aff8c]', msg: 'BATCH  | 482 records scanned · 0 violations' },
                                    { t: '19:19:55', s: 'BLOCK', c: 'text-red-400', msg: 'AML-R02 | ACC-6671 · $1,800×4 txns / 6h · structuring' },
                                    { t: '19:19:11', s: 'PASS', c: 'text-[#1aff8c]', msg: 'N2L    | 6 rules active · Gemini synthesis OK' },
                                    { t: '19:18:44', s: 'WARN', c: 'text-amber-400', msg: 'AML-R04 | ACC-3345 · SSN field unencrypted in audit log' },
                                ].map((row, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-[rgba(26,255,140,0.35)] w-14 shrink-0">{row.t}</span>
                                        <span className={`w-10 shrink-0 text-[9px] font-black border rounded px-1 py-0.5 text-center ${row.s === 'BLOCK' ? 'border-red-700/40 bg-red-950/30 text-red-400' : row.s === 'WARN' ? 'border-amber-700/40 bg-amber-950/30 text-amber-400' : 'border-[rgba(26,255,140,0.25)] bg-[rgba(26,255,140,0.06)] text-[#1aff8c]'}`}>{row.s}</span>
                                        <span className="text-zinc-400 truncate">{row.msg}</span>
                                    </div>
                                ))}
                                <div className="flex items-center gap-2 pt-1 text-[rgba(26,255,140,0.4)]">
                                    <span>$</span>
                                    <span className="animate-pulse">_</span>
                                </div>
                            </div>
                        </div>

                        {/* Floating badge */}
                        <div className="absolute -bottom-4 -right-4 px-4 py-2 rounded-xl border border-[rgba(26,255,140,0.2)] bg-[#070c0a] text-[10px] font-black uppercase tracking-widest text-[#1aff8c]"
                            style={{ boxShadow: '0 0 20px rgba(26,255,140,0.1)' }}>
                            N2L Synthesis · Gemini 2.5 Pro
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-32 bg-[#030806]">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[rgba(26,255,140,0.5)] mb-3">The Pipeline</p>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
                            PDF In. <span className="text-[#1aff8c]">Violations Out.</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { step: '01', icon: FileCheck, title: 'Ingest Regulation', desc: 'Drop in BSA, FATF, or AMLD6 PDFs. Lexinel chunks and embeds them automatically.' },
                            { step: '02', icon: Brain, title: 'N2L Synthesis', desc: 'Gemini 2.5 Pro converts natural-language regulation into typed enforcement rules.' },
                            { step: '03', icon: Database, title: 'AML Scan', desc: 'Synthesized rules run against the IBM AML dataset. Every record checked in real-time.' },
                            { step: '04', icon: ShieldCheck, title: 'Violation Nexus', desc: 'Violations are scored, flagged, and queued for SAR drafting or human review.' },
                        ].map((s, i) => (
                            <motion.div key={i} whileHover={{ y: -6 }}
                                className="p-8 rounded-2xl border border-[rgba(26,255,140,0.08)] bg-[#070c0a] group hover:border-[rgba(26,255,140,0.2)] transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-5xl font-black text-[rgba(26,255,140,0.08)] group-hover:text-[rgba(26,255,140,0.15)] transition-colors">{s.step}</span>
                                    <div className="p-3 rounded-xl bg-[rgba(26,255,140,0.06)] border border-[rgba(26,255,140,0.1)] group-hover:bg-[rgba(26,255,140,0.12)] transition-all">
                                        <s.icon className="w-5 h-5 text-[#1aff8c]" />
                                    </div>
                                </div>
                                <h3 className="text-white font-black uppercase text-sm tracking-wide mb-3">{s.title}</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AML Rules */}
            <section className="py-32 bg-[#050a07]">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[rgba(26,255,140,0.5)] mb-3">Enforcement Rules</p>
                            <h2 className="text-4xl font-black uppercase tracking-tighter mb-6">
                                5 Rules.<br /><span className="text-[#1aff8c]">Every Violation Caught.</span>
                            </h2>
                            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                                Lexinel's N2L engine synthesizes AML rules directly from legislation. Each rule is typed, versioned, and auditable.
                            </p>
                            <Link href="/signup">
                                <button className="px-6 py-3 font-black uppercase tracking-widest text-xs text-[#030806] rounded-lg"
                                    style={{ background: '#1aff8c', boxShadow: '0 0 30px rgba(26,255,140,0.25)' }}>
                                    See All Rules →
                                </button>
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {[
                                { id: 'AML-R01', clause: 'BSA §1010.310', title: 'CTR Threshold', desc: 'Flag transactions exceeding $10,000', color: 'text-red-400', border: 'border-red-900/30' },
                                { id: 'AML-R02', clause: 'FATF Rec. 10', title: 'Structuring', desc: '≥3 sub-$2K transactions within 24h', color: 'text-amber-400', border: 'border-amber-900/30' },
                                { id: 'AML-R03', clause: 'FinCEN 103.29', title: 'Cross-Border', desc: 'International wire > $5,000 to high-risk jurisdictions', color: 'text-amber-400', border: 'border-amber-900/30' },
                                { id: 'AML-R04', clause: 'GDPR Art. 5', title: 'PII Exposure', desc: 'Unencrypted PII in audit records', color: 'text-[#1aff8c]', border: 'border-[rgba(26,255,140,0.15)]' },
                                { id: 'AML-R05', clause: 'AMLD6 Art. 3(4)', title: 'Tax-Haven Route', desc: 'Routing via Cayman, CH, BVI > $3,000', color: 'text-red-400', border: 'border-red-900/30' },
                            ].map((r) => (
                                <div key={r.id} className={`flex items-start gap-4 p-4 rounded-xl border ${r.border} bg-[#070c0a]`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-black font-mono ${r.color}`}>{r.id}</span>
                                            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">{r.clause}</span>
                                        </div>
                                        <p className="text-white font-semibold text-sm">{r.title}</p>
                                        <p className="text-zinc-500 text-xs">{r.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Compliance Standards */}
            <section className="py-32 bg-[#030806]">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black uppercase tracking-tighter">
                            Built for <span className="text-[#1aff8c]">Compliance.</span>
                        </h2>
                        <p className="text-zinc-500 text-lg mt-4">Lexinel maps to the world's most rigorous AML and security frameworks.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                            { name: 'BSA / FinCEN', icon: ShieldCheck },
                            { name: 'FATF Rec. 10', icon: Globe },
                            { name: 'EU AMLD6', icon: Lock },
                            { name: 'GDPR Art. 5', icon: FileCheck },
                            { name: 'PCI DSS', icon: CreditCard },
                            { name: 'NIST AI RMF', icon: Brain },
                        ].map((std) => (
                            <div key={std.name}
                                className="p-6 bg-[#070c0a] border border-[rgba(26,255,140,0.08)] rounded-2xl group hover:border-[rgba(26,255,140,0.2)] transition-all text-center flex flex-col items-center">
                                <div className="mb-4 p-3 bg-[rgba(26,255,140,0.04)] rounded-xl group-hover:bg-[rgba(26,255,140,0.1)] transition-all">
                                    <std.icon className="w-5 h-5 text-zinc-500 group-hover:text-[#1aff8c] transition-colors" />
                                </div>
                                <div className="text-xs font-black uppercase text-zinc-300 group-hover:text-white transition-colors">{std.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 bg-[#050a07]">
                <div className="max-w-[900px] mx-auto px-6 text-center">
                    <div className="rounded-3xl border border-[rgba(26,255,140,0.15)] bg-[#070c0a] p-16 relative overflow-hidden"
                        style={{ boxShadow: '0 0 80px rgba(26,255,140,0.06)' }}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[100px] bg-[rgba(26,255,140,0.05)] pointer-events-none" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[rgba(26,255,140,0.5)] mb-4">Hackathon Demo</p>
                            <h2 className="text-5xl font-black uppercase tracking-tighter mb-6">
                                See Lexinel<br /><span className="text-[#1aff8c]">In Action.</span>
                            </h2>
                            <p className="text-zinc-400 mb-10 text-lg max-w-lg mx-auto">
                                One click gets you a full sandbox with real IBM AML data, live rule synthesis, and violation detection.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={triggerGuestLogin}
                                    className="h-14 px-10 font-black uppercase tracking-widest text-sm text-[#030806] rounded-xl flex items-center gap-2 mx-auto sm:mx-0"
                                    style={{ background: '#1aff8c', boxShadow: '0 0 40px rgba(26,255,140,0.3)' }}>
                                    <Fingerprint className="w-4 h-4" />
                                    One-Click Judge Access
                                </button>
                                <Link href="/login">
                                    <button className="h-14 px-10 font-black uppercase tracking-widest text-sm text-[#1aff8c] rounded-xl border border-[rgba(26,255,140,0.3)] bg-[rgba(26,255,140,0.04)] hover:bg-[rgba(26,255,140,0.08)] transition-all">
                                        Sign In →
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 border-t border-[rgba(26,255,140,0.06)] bg-[#030806]">
                <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                            <path d="M16 7L23 11V21L16 25L9 21V11L16 7Z" fill="rgba(26,255,140,0.06)" stroke="#1aff8c" strokeWidth="1.5" strokeLinejoin="round" />
                            <path d="M13 11V21H22" stroke="#1aff8c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="22" cy="21" r="2" fill="#1aff8c" opacity="0.9" />
                        </svg>
                        <span className="text-base font-black tracking-widest text-white">LEX<span className="text-[#1aff8c]">INEL</span></span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-700">© 2026 Lexinel. AI-native AML Compliance Engine.</p>
                    <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                        <Link href="/features" className="hover:text-zinc-400 transition-colors">Features</Link>
                        <Link href="/how-it-works" className="hover:text-zinc-400 transition-colors">How It Works</Link>
                        <Link href="/login" className="hover:text-zinc-400 transition-colors">Sign In</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
