import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Shield, Activity, Settings, FileText, ChevronRight, BarChart3, LogOut, Zap, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';

// Navigation Items Configuration
const navItems = [
    { name: 'Overview', href: '/dashboard', icon: Home },
    { name: 'Policies', href: '/dashboard/policies', icon: FileText },
    { name: 'AI Gatekeeper', href: '/dashboard/proxy', icon: Shield },
    { name: 'Evaluate', href: '/dashboard/evaluate', icon: Activity },
    { name: 'Monitor', href: '/dashboard/monitor', icon: BarChart3 },
    { name: 'SLA Designer', href: '/dashboard/sla', icon: Zap },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
    className?: string;
    onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { profile } = useUser();

    const handleLogout = () => {
        // Clear any auth tokens if they existed (mock)
        router.push('/');
    };

    return (
        <div className={cn("flex h-full w-64 flex-col border-r border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-[#020617]/80 backdrop-blur-xl z-20", className)}>
            <div className="flex h-16 items-center px-6 border-b border-gray-100 dark:border-slate-800/50">
                <Shield className="h-6 w-6 text-cyan-500 mr-2 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">PolicyGuard AI</span>
            </div>

            <div className="flex-1 overflow-y-auto py-6">
                <nav className="space-y-1.5 px-3">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onNavigate}
                                className={cn(
                                    "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                                    isActive
                                        ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 dark:shadow-[inset_0_0_10px_rgba(6,182,212,0.05)] border-l-2 border-cyan-500"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-cyan-300"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                        isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400 dark:text-slate-500 group-hover:text-cyan-500"
                                    )}
                                />
                                {item.name}
                                {isActive && <ChevronRight className="ml-auto h-4 w-4 text-cyan-400 animate-pulse" />}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 space-y-3">
                <Link href="/dashboard/profile" onClick={onNavigate} className="flex items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg p-2.5 transition-all">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 overflow-hidden flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-cyan-500/20">
                        {profile.name.charAt(0)}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{profile.name}</p>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-cyan-500/70 uppercase tracking-widest truncate">{profile.jobTitle}</p>
                    </div>
                </Link>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 rounded-lg transition-all"
                >
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
