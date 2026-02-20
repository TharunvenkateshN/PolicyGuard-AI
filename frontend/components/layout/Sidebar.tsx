"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home, Shield, Activity, Settings, FileText,
    BarChart3, LogOut, Zap, MessageSquare, Plug,
    Flame, Database, AlertOctagon, GitBranch,
    ScanLine, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { useAuth } from '@/hooks/useAuth';

const navGroups = [
    {
        label: "Intelligence Layer",
        items: [
            { name: 'Command Center', href: '/dashboard', icon: Home },
            { name: 'Policy Vault', href: '/dashboard/policies', icon: FileText },
            { name: 'Rule Audit Log', href: '/dashboard/evaluate', icon: GitBranch },
        ]
    },
    {
        label: "Enforcement Fabric",
        items: [
            { name: 'Database Sentinel', href: '/dashboard/sentinel', icon: Database },
            { name: 'Live Scan Feed', href: '/dashboard/monitor', icon: ScanLine },
            { name: 'Violation Nexus', href: '/dashboard/remediate', icon: AlertOctagon },
        ]
    },
    {
        label: "Red Team & Analytics",
        items: [
            { name: 'Adversarial Hub', href: '/dashboard/redteam', icon: Flame },
            { name: 'AML Risk Analytics', href: '/dashboard/sla', icon: TrendingUp },
            { name: 'Integration Hub', href: '/dashboard/proxy', icon: Plug },
        ]
    }
];

interface SidebarProps {
    className?: string;
    onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
    const pathname = usePathname();
    const { profile } = useUser();
    const { logout } = useAuth();

    return (
        <div className={cn("flex h-full w-64 flex-col bg-[#070c0a]/80 border-r border-[rgba(26,255,140,0.1)] z-20 backdrop-blur-xl", className)}>

            {/* Logo */}
            <div className="flex h-16 items-center px-5 mb-1 border-b border-[rgba(26,255,140,0.08)]">
                <div className="flex items-center gap-3">
                    {/* Lexinel Hex Shield */}
                    <div className="relative">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path d="M16 3L27 9V23L16 29L5 23V9L16 3Z"
                                stroke="#1aff8c" strokeWidth="1.5" strokeLinejoin="round"
                                opacity="0.4" />
                            <path d="M16 7L23 11V21L16 25L9 21V11L16 7Z"
                                fill="rgba(26,255,140,0.06)" stroke="#1aff8c" strokeWidth="1.5" strokeLinejoin="round" />
                            <path d="M13 11V21H22" stroke="#1aff8c" strokeWidth="2.5"
                                strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="22" cy="21" r="2" fill="#1aff8c" opacity="0.9">
                                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                            </circle>
                        </svg>
                        <div className="absolute inset-0 rounded-full"
                            style={{ boxShadow: '0 0 12px rgba(26,255,140,0.3)' }} />
                    </div>
                    <div>
                        <span className="text-base font-bold tracking-widest text-white font-outfit">LEX<span className="text-neon">INEL</span></span>
                        <p className="text-[9px] text-[rgba(26,255,140,0.5)] tracking-[0.2em] uppercase">Compliance Sentinel</p>
                    </div>
                </div>
            </div>

            {/* Active Sentinel Badge */}
            <div className="mx-4 my-3">
                <div className="sentinel-badge w-full justify-center">
                    Active Sentinel
                </div>
            </div>

            {/* Nav */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
                {navGroups.map((group, groupIdx) => (
                    <div key={groupIdx}>
                        <h3 className="mb-2 px-3 text-[10px] font-bold text-[rgba(26,255,140,0.4)] uppercase tracking-[0.15em]">
                            {group.label}
                        </h3>
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        className={cn(
                                            "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group",
                                            isActive
                                                ? "bg-[rgba(26,255,140,0.1)] text-[#1aff8c] border border-[rgba(26,255,140,0.2)]"
                                                : "text-[rgba(255,255,255,0.45)] hover:bg-[rgba(26,255,140,0.05)] hover:text-[rgba(26,255,140,0.8)]"
                                        )}
                                        style={isActive ? { boxShadow: '0 0 12px rgba(26,255,140,0.1)' } : {}}
                                    >
                                        <Icon className={cn(
                                            "mr-3 h-4 w-4 transition-colors flex-shrink-0",
                                            isActive ? "text-[#1aff8c]" : "text-[rgba(255,255,255,0.3)] group-hover:text-[rgba(26,255,140,0.7)]"
                                        )} />
                                        {item.name}
                                        {isActive && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1aff8c]"
                                                style={{ boxShadow: '0 0 6px #1aff8c' }} />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[rgba(26,255,140,0.08)]">
                <div className="rounded-xl bg-[rgba(26,255,140,0.04)] border border-[rgba(26,255,140,0.1)] p-3">
                    <Link href="/dashboard/profile" onClick={onNavigate} className="flex items-center group mb-3">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-[rgba(26,255,140,0.3)]"
                            style={{ background: 'linear-gradient(135deg, #0d2918, #1aff8c33)', color: '#1aff8c' }}>
                            {profile?.name?.charAt(0) || 'L'}
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate group-hover:text-[#1aff8c] transition-colors">
                                {profile?.name || 'Compliance Officer'}
                            </p>
                            <p className="text-xs text-[rgba(255,255,255,0.3)] truncate">
                                {profile?.jobTitle || 'AML Analyst'}
                            </p>
                        </div>
                    </Link>

                    <button
                        onClick={async () => await logout()}
                        className="w-full flex items-center justify-center px-3 py-1.5 text-xs font-medium text-[rgba(255,255,255,0.3)] hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all"
                    >
                        <LogOut className="mr-2 h-3.5 w-3.5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
