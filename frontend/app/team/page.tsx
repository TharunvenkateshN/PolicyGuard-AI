"use client";

import React from 'react';
import { Github, Linkedin, Shield, Hexagon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TeamPage() {
    const team = [
        {
            name: "Tharun N V",
            role: "Co-Founder · Product & AI Architecture",
            details: [
                "Product vision & problem definition",
                "Gemini 3 reasoning workflows",
                "Policy evaluation & remediation logic",
                "System architecture & governance design"
            ],
            image: "/team/tharun.jpg",
            linkedin: "https://www.linkedin.com/in/tharun-n-v-859794320/?isSelfProfile=true",
            github: "https://github.com/TharunvenkateshN"
        },
        {
            name: "Vishal M",
            role: "Co-Founder · Engineering & Platform",
            details: [
                "Application development & integrations",
                "Frontend dashboards & visualization",
                "OWASP Top 10 & PII scan engines",
                "API gateway & runtime enforcement",
                "Demo, deployment & system wiring"
            ],
            image: "/team/vishal.jpg",
            linkedin: "https://www.linkedin.com/in/vishal2601dev/",
            github: "https://github.com/shalcoder"
        }
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 pt-32 pb-20 px-6 font-sans relative overflow-hidden">
            {/* Cyber Grid Overlay */}
            <div className="absolute inset-0 bg-grid-cyber pointer-events-none opacity-20 z-0"></div>

            {/* Decorative Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] -z-10"></div>

            <div className="max-w-7xl mx-auto text-center mb-16 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 text-cyan-400 text-xs font-bold uppercase tracking-widest border border-cyan-500/20 mb-8 backdrop-blur-sm">
                        <Hexagon className="w-3 h-3 fill-cyan-400/20" />
                        Executive Leadership
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-white">
                        The Minds behind <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">the Shield.</span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-20 leading-relaxed uppercase tracking-wider font-mono text-sm opacity-60">
                        Verifying Policy Compliance through AI Reasoning.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto px-4">
                    {team.map((member, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.2, duration: 0.5 }}
                            className="group relative p-1 rounded-[2.2rem] bg-gradient-to-br from-cyan-500/20 via-transparent to-blue-500/20 overflow-hidden shadow-2xl"
                        >
                            <div className="bg-slate-900/80 backdrop-blur-3xl rounded-[2.1rem] p-8 h-full border border-slate-800/50 group-hover:border-cyan-500/30 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative z-10">
                                    <div className="w-44 h-44 mx-auto rounded-[2rem] overflow-hidden mb-8 border-2 border-slate-700 group-hover:border-cyan-500 transition-all duration-300 transform group-hover:scale-105 shadow-2xl relative">
                                        <img
                                            src={member.image}
                                            alt={member.name}
                                            className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                                        {/* Scanline Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent h-4 w-full animate-scanline pointer-events-none" />
                                    </div>

                                    <h3 className="text-3xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors tracking-tight">{member.name}</h3>
                                    <div className="text-cyan-500 font-mono text-xs uppercase tracking-[0.2em] mb-8 bg-cyan-500/10 inline-block px-4 py-1.5 rounded-full border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                        {member.role}
                                    </div>

                                    <div className="space-y-3 mb-10 text-left max-w-[280px] mx-auto">
                                        {member.details.map((detail, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-slate-400 group-hover:text-slate-200 transition-colors">
                                                <div className="mt-1.5 h-1 w-1 rounded-full bg-cyan-500 shrink-0 shadow-[0_0_5px_rgba(6,182,212,1)]" />
                                                <span className="text-sm font-medium leading-tight">{detail}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-center gap-5">
                                        <a
                                            href={member.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3.5 rounded-2xl bg-slate-800/50 text-slate-400 hover:bg-cyan-600 hover:text-white transition-all shadow-lg hover:shadow-cyan-500/30 active:scale-90 border border-slate-700/50 hover:border-cyan-400"
                                        >
                                            <Linkedin className="w-5 h-5" />
                                        </a>
                                        <a
                                            href={member.github}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3.5 rounded-2xl bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-all shadow-lg active:scale-90 border border-slate-700/50 hover:border-slate-500"
                                        >
                                            <Github className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
