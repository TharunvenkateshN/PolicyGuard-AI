"use client"

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X, Shield, Home, FileText, MessageSquare, Activity, BarChart3, Zap, Settings, LogOut, ChevronRight, Wrench, Flame } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';

const navItems = [
    { name: 'Overview', href: '/dashboard', icon: Home },
    { name: 'Policies', href: '/dashboard/policies', icon: FileText },
    { name: 'AI Gatekeeper', href: '/dashboard/proxy', icon: Shield },
    { name: 'Evaluate', href: '/dashboard/evaluate', icon: Activity },
    { name: 'Remediate', href: '/dashboard/remediate', icon: Wrench },
    { name: 'Red Team', href: '/dashboard/redteam', icon: Flame },
    { name: 'Monitor', href: '/dashboard/monitor', icon: BarChart3 },
    { name: 'SLA Monitoring', href: '/dashboard/sla', icon: Zap },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardMobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { profile } = useUser();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = () => {
        router.push('/');
    };

    const menuOverlay = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, x: '100%' }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[9999] bg-zinc-950 flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                            <Shield className="h-6 w-6 text-blue-600" />
                            <span className="text-lg font-bold tracking-tight text-white">Menu</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-zinc-800">
                            <X className="w-6 h-6" />
                        </Button>
                    </div>

                    {/* Menu Links */}
                    <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "group flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-200",
                                        isActive
                                            ? "bg-blue-900/20 text-blue-400 border border-blue-900/50"
                                            : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                            isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-400"
                                        )}
                                    />
                                    {item.name}
                                    {isActive && <ChevronRight className="ml-auto h-4 w-4 text-blue-400" />}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Footer / Profile */}
                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                        <div className="flex items-center mb-4 px-2">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                {profile?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-white">{profile?.name || 'User'}</p>
                                <p className="text-xs text-zinc-500">{profile?.jobTitle || 'Role'}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-red-400 bg-red-950/20 border border-red-900/30 rounded-xl hover:bg-red-900/30 transition-colors"
                        >
                            <LogOut className="mr-2 h-5 w-5" />
                            Sign Out
                        </button>
                    </div>

                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950 text-white backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-blue-600" />
                    <span className="text-lg font-bold tracking-tight">Lexinel</span>
                </div>

                <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} className="text-white hover:bg-zinc-800">
                    <Menu className="w-6 h-6" />
                </Button>
            </div>

            {mounted && createPortal(menuOverlay, document.body)}
        </>
    );
}
