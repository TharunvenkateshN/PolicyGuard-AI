"use client"

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed top-0 w-full z-50 lg:hidden flex items-center justify-between p-4 border-b border-[rgba(26,255,140,0.1)] bg-[#070c0a]/90 dark:bg-[#070c0a]/90 backdrop-blur-xl">
            <div className="flex items-center gap-2">
                <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                    <path d="M16 7L23 11V21L16 25L9 21V11L16 7Z" fill="rgba(26,255,140,0.08)" stroke="#1aff8c" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M13 11V21H22" stroke="#1aff8c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-base font-bold tracking-widest text-white">LEX<span className="text-[#1aff8c]">INEL</span></span>
            </div>

            <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} className="text-white hover:bg-white/10">
                <Menu className="w-6 h-6" />
            </Button>

            {/* Mobile Full Screen Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-50 bg-[#070c0a] dark:bg-[#070c0a] bg-[#f0faf5] flex flex-col overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[rgba(26,255,140,0.1)]">
                            <div className="flex items-center gap-2">
                                <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                                    <path d="M16 7L23 11V21L16 25L9 21V11L16 7Z" fill="rgba(26,255,140,0.08)" stroke="#1aff8c" strokeWidth="1.5" strokeLinejoin="round" />
                                    <path d="M13 11V21H22" stroke="#1aff8c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="text-base font-bold tracking-widest text-white">LEX<span className="text-[#1aff8c]">INEL</span></span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        {/* Menu Links */}
                        <div className="flex-1 px-6 py-8 space-y-6">
                            <nav className="space-y-6 text-lg font-medium text-gray-300">
                                <Link href="/" className="block hover:text-white transition-colors" onClick={() => setIsOpen(false)}>Home</Link>
                                <div className="h-px bg-white/5 w-full" />
                                <Link href="/pricing" className="block hover:text-white transition-colors" onClick={() => setIsOpen(false)}>Pricing</Link>
                                <div className="h-px bg-white/5 w-full" />
                                <Link href="/how-it-works" className="block hover:text-white transition-colors" onClick={() => setIsOpen(false)}>How It Works</Link>
                                <div className="h-px bg-white/5 w-full" />
                                <Link href="#" className="block hover:text-white transition-colors" onClick={() => setIsOpen(false)}>Support</Link>
                                <div className="h-px bg-white/5 w-full" />
                                <Link href="/team" className="block hover:text-white transition-colors" onClick={() => setIsOpen(false)}>Team</Link>
                                <div className="h-px bg-white/5 w-full" />
                            </nav>

                            <div className="pt-8 space-y-4">
                                <div className="text-center">
                                    <a href="/login" className="text-gray-300 hover:text-white font-medium">Login</a>
                                </div>
                                <Button
                                    className="w-full h-12 text-base font-bold rounded-xl text-[#070c0a] transition-all"
                                    style={{ background: '#1aff8c', boxShadow: '0 0 20px rgba(26,255,140,0.3)' }}
                                    onClick={() => setIsOpen(false)}
                                >
                                    Get Started
                                </Button>
                            </div>

                            {/* Secondary Links */}
                            <div className="pt-8 space-y-4 text-sm text-gray-500">
                                <a href="#" className="block hover:text-gray-300">FAQs</a>
                                <a href="#" className="block hover:text-gray-300">Contact Us</a>
                            </div>

                            {/* Legal */}
                            <div className="pt-8 space-y-4">
                                <h4 className="text-white font-bold">Legal</h4>
                                <div className="space-y-2 text-sm text-gray-500">
                                    <a href="#" className="block hover:text-gray-300">Terms of Service</a>
                                    <a href="#" className="block hover:text-gray-300">Privacy Policy</a>
                                    <a href="#" className="block hover:text-gray-300">Cookie Policy</a>
                                </div>
                            </div>

                            {/* Connect With Us */}
                            <div className="pt-8 space-y-4 pb-8">
                                <h4 className="text-white font-bold">Connect With Us</h4>
                                <div className="flex gap-4">
                                    {/* Social placeholders */}
                                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer"><span className="text-xs">FB</span></div>
                                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer"><span className="text-xs">TW</span></div>
                                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer"><span className="text-xs">IG</span></div>
                                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer"><span className="text-xs">IN</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/5 text-center text-xs text-gray-600">
                            © 2026 Lexinel. All rights reserved.
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
