import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Shield, Activity, Settings, FileText, ChevronRight, BarChart3, LogOut, Zap, MessageSquare, Wrench, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';

// Grouped Navigation Configuration
const navGroups = [
    {
        label: "Governance Core",
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: Home },
            { name: 'Policies', href: '/dashboard/policies', icon: FileText },
            { name: 'AI Gatekeeper', href: '/dashboard/proxy', icon: Shield },
        ]
    },
    {
        label: "Defense Operations",
        items: [
            { name: 'Live Monitor', href: '/dashboard/monitor', icon: BarChart3 },
            { name: 'Red Team', href: '/dashboard/redteam', icon: Flame },
            { name: 'Remediate', href: '/dashboard/remediate', icon: Wrench },
        ]
    },
    {
        label: "Analytics & System",
        items: [
            { name: 'Evaluate', href: '/dashboard/evaluate', icon: Activity },
            { name: 'SLA Monitoring', href: '/dashboard/sla', icon: Zap },
            { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        ]
    }
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
        router.push('/');
    };

    return (
        <div className={cn("flex h-full w-64 flex-col bg-slate-50/50 dark:bg-slate-950/50 border-r-0 z-20", className)}>
            {/* Header */}
            <div className="flex h-16 items-center px-6 mb-2">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-500 mr-2 drop-shadow-sm" />
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">PolicyGuard AI</span>
            </div>

            {/* Scrollable Nav Area */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
                {navGroups.map((group, groupIdx) => (
                    <div key={groupIdx}>
                        <h3 className="mb-2 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {group.label}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        className={cn(
                                            "flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200",
                                            isActive
                                                ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 shadow-sm"
                                                : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                "mr-3 h-4 w-4 transition-colors",
                                                isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-500"
                                            )}
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Profile */}
            <div className="p-4 mt-auto">
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
                    <Link href="/dashboard/profile" onClick={onNavigate} className="flex items-center group mb-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-slate-800">
                            {profile?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">
                                {profile?.name || 'User'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                                {profile?.jobTitle || 'Administrator'}
                            </p>
                        </div>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                    >
                        <LogOut className="mr-2 h-3.5 w-3.5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
