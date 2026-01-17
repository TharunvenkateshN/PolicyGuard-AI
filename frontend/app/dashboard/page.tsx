"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, CheckCircle, ShieldAlert, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

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
    risk_distribution?: Array<{ name: string; value: number; }>;
    compliance_trend?: Array<{ date: string; score: number; }>;
    top_business_risks?: {
        financial: string;
        financial_cost: string;
        regulatory: string;
        brand: string;
    };
}

const COLORS = ['#ef4444', '#f59e0b', '#22c55e']; // Red (High), Amber (Medium), Green (Low)

export default function OverviewPage() {
    const [stats, setStats] = useState<DashboardStats>({
        traces_analyzed: 0,
        violations: 0,
        active_policies: 1, // Start with 1 to avoid /0 visual glitches if loading
        system_health: 100,
        recent_evaluations: [],
        risk_distribution: [
            { name: "High", value: 0 },
            { name: "Medium", value: 0 },
            { name: "Low", value: 1 }
        ],
        compliance_trend: []
    });

    const [selectedRisk, setSelectedRisk] = useState<{
        title: string;
        icon: string;
        text: string;
        subtext: string;
        type: string;
    } | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('http://127.0.0.1:8000/api/v1/dashboard/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 5000); // 5s poll for demo feel
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
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">CISO Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Real-time compliance posture and risk analytics.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Traces Analyzed</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.traces_analyzed.toLocaleString()}</div>
                        <p className="text-xs text-gray-500">Total AI workflow evaluations</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Critical Violations</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.violations}</div>
                        <p className="text-xs text-gray-500">Blocked high-risk deployments</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-indigo-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
                        <FileText className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.active_policies}</div>
                        <p className="text-xs text-gray-500">Enforced across all agents</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.system_health}%</div>
                        <p className="text-xs text-gray-500">Overall hygiene rating</p>
                    </CardContent>
                </Card>
            </div>

            {/* Business Impact Signals (BizOps) */}
            {stats.top_business_risks && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card
                        className="bg-gradient-to-br from-white to-red-50 dark:from-zinc-900 dark:to-red-950/20 shadow-sm border-l-4 border-l-orange-500 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedRisk({
                            title: "Financial Exposure",
                            icon: "💰",
                            text: stats.top_business_risks!.financial,
                            subtext: stats.top_business_risks!.financial_cost,
                            type: "Cost Estimate"
                        })}
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center text-orange-700 dark:text-orange-400">
                                <span className="mr-2">💰</span> Financial Exposure
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.top_business_risks.financial}</div>
                            <p className="text-sm font-semibold text-red-600 mt-1">{stats.top_business_risks.financial_cost}</p>
                            <p className="text-xs text-gray-500 mt-1">Est. Remediation Cost</p>
                            <button className="text-xs text-blue-600 dark:text-blue-400 underline mt-2">Read full report</button>
                        </CardContent>
                    </Card>

                    <Card
                        className="bg-gradient-to-br from-white to-blue-50 dark:from-zinc-900 dark:to-blue-950/20 shadow-sm border-l-4 border-l-blue-500 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedRisk({
                            title: "Regulatory Penalty",
                            icon: "⚖️",
                            text: stats.top_business_risks!.regulatory,
                            subtext: "Legal Liability Analysis",
                            type: "Compliance Impact"
                        })}
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center text-blue-700 dark:text-blue-400">
                                <span className="mr-2">⚖️</span> Regulatory Penalty
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-3">
                                {stats.top_business_risks.regulatory}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Legal Liability</p>
                            <button className="text-xs text-blue-600 dark:text-blue-400 underline mt-2">Read full report</button>
                        </CardContent>
                    </Card>

                    <Card
                        className="bg-gradient-to-br from-white to-purple-50 dark:from-zinc-900 dark:to-purple-950/20 shadow-sm border-l-4 border-l-purple-500 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedRisk({
                            title: "Brand Reputation",
                            icon: "📢",
                            text: stats.top_business_risks!.brand,
                            subtext: "Public Trust Impact Analysis",
                            type: "Reputation Impact"
                        })}
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center text-purple-700 dark:text-purple-400">
                                <span className="mr-2">📢</span> Brand Reputation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-3">
                                {stats.top_business_risks.brand}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Public Trust Impact</p>
                            <button className="text-xs text-blue-600 dark:text-blue-400 underline mt-2">Read full report</button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Chart Section */}
            <div className="grid gap-4 md:grid-cols-7">
                {/* Trend Chart (4 cols) */}
                <Card className="col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
                            Use Compliance Trend (7 Days)
                        </CardTitle>
                        <CardDescription>Historical compliance score analysis</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.compliance_trend}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Risk Distribution Chart (3 cols) */}
                <Card className="col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                            Risk Distribution
                        </CardTitle>
                        <CardDescription>Breakdown of detected issues</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.risk_distribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.risk_distribution?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="col-span-4 shadow-sm">
                <CardHeader>
                    <CardTitle>Recent Evaluations</CardTitle>
                    <CardDescription>Latest audit logs from the AI Gatekeeper</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats.recent_evaluations.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-dashed border-gray-200">
                                No evaluations yet. Run an audit to populate this feed.
                            </div>
                        ) : (
                            stats.recent_evaluations.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 rounded-lg hover:shadow-md transition-shadow">
                                    <div className="flex items-center">
                                        <div className={`h-2 w-2 rounded-full mr-3 ${item.verdict === 'PASS' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{item.workflow_name}</p>
                                            <p className="text-xs text-gray-500">{getRelativeTime(item.timestamp)}</p>
                                        </div>
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

            {/* Risk Detail Modal */}
            {selectedRisk && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedRisk(null)}>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">{selectedRisk.icon}</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedRisk.title}</h3>
                                        <p className="text-sm text-gray-500">{selectedRisk.type}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedRisk(null)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <span className="sr-only">Close</span>
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg mb-6 max-h-[60vh] overflow-y-auto">
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {selectedRisk.text}
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setSelectedRisk(null)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-900 dark:text-gray-100 rounded-md text-sm font-medium transition-colors"
                                >
                                    Close Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
