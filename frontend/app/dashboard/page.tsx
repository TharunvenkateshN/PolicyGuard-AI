"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CheckCircle, ShieldAlert, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DashboardStats {
    traces_analyzed: number;
    violations: number;
    active_policies: number;
    system_health: number;
    recent_evaluations: Array<{
        workflow_name: string;
        verdict: "PASS" | "FAIL";
        timestamp: string;
    }>;
}

export default function OverviewPage() {
    const [stats, setStats] = useState<DashboardStats>({
        traces_analyzed: 0,
        violations: 0,
        active_policies: 0,
        system_health: 100,
        recent_evaluations: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/v1/dashboard/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };

        fetchStats();
        // Poll every 10 seconds for live updates
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    const getRelativeTime = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Overview</h1>
                <p className="text-gray-500 dark:text-gray-400">System status and compliance metrics.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Traces Analyzed</CardTitle>
                        <Activity className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.traces_analyzed.toLocaleString()}</div>
                        <p className="text-xs text-gray-500">Total simulated traffic events</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Policy Violations</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.violations}</div>
                        <p className="text-xs text-gray-500">High severity incidents detected</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
                        <FileText className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.active_policies}</div>
                        <p className="text-xs text-gray-500">Currently enforced guardrails</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Health</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.system_health}%</div>
                        <p className="text-xs text-gray-500">Operational Status</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Activity Placeholder */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Recent Evaluations</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats.recent_evaluations.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No recent evaluations. Run an analysis to see data here.</div>
                        ) : (
                            stats.recent_evaluations.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                                    <div>
                                        <p className="font-medium">{item.workflow_name}</p>
                                        <p className="text-sm text-gray-500">Evaluated {getRelativeTime(item.timestamp)}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${item.verdict === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.verdict}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
