"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, CheckCircle, ShieldAlert, FileText, TrendingUp, AlertTriangle, ShieldCheck, DollarSign, Scale, Megaphone } from 'lucide-react';
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
        icon: React.ReactNode;
        text: string;
        subtext: string;
        type: string;
    } | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const res = await fetch(`${apiUrl}/api/v1/dashboard/stats`);
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

            {/* KPI Cards Row - Animated & Interactive */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-lg border-l-4 border-l-cyan-500 hover:scale-105 transition-transform duration-200 cursor-default bg-white bg-card dark:shadow-cyan-900/20 border-y-0 border-r-0 ring-1 ring-gray-200 dark:ring-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Traces Analyzed</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.traces_analyzed.toLocaleString()}</div>
                        <p className="text-xs text-gray-500">Total AI workflow evaluations</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-red-500 hover:scale-105 transition-transform duration-200 cursor-default bg-white bg-card dark:shadow-cyan-900/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Critical Violations</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.violations}</div>
                        <p className="text-xs text-gray-500">Blocked high-risk deployments</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-indigo-500 hover:scale-105 transition-transform duration-200 cursor-default bg-white bg-card dark:shadow-cyan-900/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
                        <FileText className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.active_policies}</div>
                        <p className="text-xs text-gray-500">Enforced across all agents</p>
                    </CardContent>
                </Card>
                <Card id="compliance-score-card" className="shadow-sm border-l-4 border-l-green-500 hover:scale-105 transition-transform duration-200 cursor-default bg-white bg-card dark:shadow-cyan-900/20">
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

            {/* Main Content Grid: Charts + Risk Widget */}
            <div className="grid gap-4 md:grid-cols-7">

                {/* 1. Compliance Trend Chart (Left - Wider) */}
                <Card className="col-span-4 lg:col-span-5 shadow-sm border-0 ring-1 ring-gray-200 dark:ring-zinc-800">
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
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: '1px solid #1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)', color: '#f8fafc' }}
                                    />
                                    <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Compact Business Risk Widget (Right) */}
                <Card className="col-span-3 lg:col-span-2 shadow-sm border-0 ring-1 ring-gray-200 dark:ring-zinc-800 bg-gray-50/50 bg-card dark:shadow-cyan-900/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            Business Impact
                        </CardTitle>
                        <CardDescription className="text-xs">Projected risks based on current violations.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.top_business_risks ? (
                            <Tabs defaultValue="financial" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-4">
                                    <TabsTrigger value="financial" className="text-xs flex items-center justify-center gap-1"><DollarSign className="w-3 h-3" /> Cost</TabsTrigger>
                                    <TabsTrigger value="legal" className="text-xs flex items-center justify-center gap-1"><Scale className="w-3 h-3" /> Legal</TabsTrigger>
                                    <TabsTrigger value="brand" className="text-xs flex items-center justify-center gap-1"><Megaphone className="w-3 h-3" /> Brand</TabsTrigger>
                                </TabsList>

                                <TabsContent value="financial" className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm">
                                        <h4 className="font-bold text-red-600 mb-1">{stats.top_business_risks.financial_cost}</h4>
                                        <p className="text-xs text-gray-500 mb-2">Est. Remediation</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                                            {stats.top_business_risks.financial}
                                        </p>
                                    </div>
                                    <button
                                        className="text-xs text-blue-600 hover:underline w-full text-right"
                                        onClick={() => setSelectedRisk({
                                            title: "Financial Exposure", icon: <DollarSign className="w-8 h-8 text-orange-500" />, text: stats.top_business_risks!.financial, subtext: stats.top_business_risks!.financial_cost, type: "Cost Estimate"
                                        })}
                                    >
                                        Read Analysis →
                                    </button>
                                </TabsContent>

                                <TabsContent value="legal" className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-blue-100 dark:border-blue-900/30 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">GDPR/CCPA</span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug line-clamp-4">
                                            {stats.top_business_risks.regulatory}
                                        </p>
                                    </div>
                                    <button
                                        className="text-xs text-blue-600 hover:underline w-full text-right"
                                        onClick={() => setSelectedRisk({
                                            title: "Regulatory Penalty", icon: <Scale className="w-8 h-8 text-blue-500" />, text: stats.top_business_risks!.regulatory, subtext: "Legal Liability Analysis", type: "Compliance Impact"
                                        })}
                                    >
                                        Read Analysis →
                                    </button>
                                </TabsContent>

                                <TabsContent value="brand" className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-purple-100 dark:border-purple-900/30 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Trust Score</span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug line-clamp-4">
                                            {stats.top_business_risks.brand}
                                        </p>
                                    </div>
                                    <button
                                        className="text-xs text-blue-600 hover:underline w-full text-right"
                                        onClick={() => setSelectedRisk({
                                            title: "Brand Reputation", icon: <Megaphone className="w-8 h-8 text-purple-500" />, text: stats.top_business_risks!.brand, subtext: "Public Trust Impact Analysis", type: "Reputation Impact"
                                        })}
                                    >
                                        Read Analysis →
                                    </button>
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
                                <ShieldCheck className="w-8 h-8 mb-2 opacity-50" />
                                <span className="text-xs">No critical business risks detected.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row: Recent & Distribution */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                {/* Recent Activity */}
                <Card id="recent-evaluations-list" className="col-span-1 lg:col-span-5 shadow-sm border-0 ring-1 ring-gray-200 dark:ring-zinc-800">
                    <CardHeader>
                        <CardTitle>Recent Evaluations</CardTitle>
                        <CardDescription>Latest audit logs from the AI Gatekeeper</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recent_evaluations.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 bg-card dark:shadow-cyan-900/20 rounded-lg border border-dashed border-gray-200">
                                    No evaluations yet. Run an audit to populate this feed.
                                </div>
                            ) : (
                                stats.recent_evaluations.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-gray-100 dark:bg-slate-800/40 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
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

                {/* Risk Distribution Chart (3 cols) */}
                <Card className="col-span-1 lg:col-span-2 shadow-sm border-0 ring-1 ring-gray-200 dark:ring-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                            Risk Distribution
                        </CardTitle>
                        <CardDescription>Breakdown of detected issues</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        <div className="h-[250px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.risk_distribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={5}
                                    >
                                        {/* Use specific colors: High (Red), Medium (Orange), Low (Green/Blue) */}
                                        {stats.risk_distribution?.map((entry, index) => {
                                            let color = '#3b82f6'; // Default Blue
                                            if (entry.name === 'High') color = '#ef4444'; // Red
                                            if (entry.name === 'Medium') color = '#f97316'; // Orange
                                            if (entry.name === 'Low') color = '#22c55e'; // Green
                                            return <Cell key={`cell-${index}`} fill={color} />;
                                        })}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#374151' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value, entry: any) => <span className="text-xs font-medium text-gray-600 ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text Overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats.risk_distribution?.reduce((a, b) => a + b.value, 0) || 0}
                                </span>
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Risks</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>



            {/* Risk Detail Modal */}
            {selectedRisk && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedRisk(null)}>
                    <div className="bg-white bg-card dark:shadow-cyan-900/20 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
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
