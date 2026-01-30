"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
    Activity, ShieldCheck, Zap,
    ArrowRight, Lock, Server,
    AlertTriangle, CheckCircle2,
    BarChart3, Scale, Timer,
    Globe, Terminal, Eye,
    Cpu, HardDrive, Database,
    Network, Layers, ShieldAlert,
    FileText, Check, XCircle
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Line, ComposedChart, Legend,
    BarChart, Bar, Cell, Sankey
} from 'recharts';

interface DashboardStats {
    traces_analyzed: number;
    violations: number;
    active_policies: number;
    system_health: number;
    risk_score: number;
    recent_evaluations: any[];
    recent_traces: any[];
}

interface Policy {
    id: string;
    name: string;
    is_active: boolean;
}

interface SlaPoint {
    timestamp: string;
    total_requests: number;
    successful_requests: number;
    avg_response_time_ms: number;
    pii_blocks: number;
    policy_violations: number;
}

interface LogEntry {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    service: string;
    message: string;
    latency: number;
}

export default function OverviewPage() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'ciso' | 'sre'>('ciso');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Stats
    const [stats, setStats] = useState<DashboardStats>({
        traces_analyzed: 0,
        violations: 0,
        active_policies: 0,
        system_health: 100,
        risk_score: 100,
        recent_evaluations: [],
        recent_traces: []
    });
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [slaHistory, setSlaHistory] = useState<SlaPoint[]>([]);

    // Live Logs State
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

                // 1. Fetch Stats
                const statsRes = await fetch(`${apiUrl}/api/v1/dashboard/stats`);
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setStats({ ...data, risk_score: data.system_health || 100 });
                }

                // 2. Fetch Policies
                const policiesRes = await fetch(`${apiUrl}/api/v1/policies`);
                if (policiesRes.ok) {
                    const data = await policiesRes.json();
                    setPolicies(data);
                }

                // 3. Fetch SLA History
                const slaRes = await fetch(`${apiUrl}/api/v1/sla/history`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hours: 1 })
                });
                if (slaRes.ok) {
                    const data = await slaRes.json();
                    setSlaHistory((data.data_points || []).slice(-30));
                }

                // 4. Fetch Monitor Data (for logs)
                const monitorRes = await fetch(`${apiUrl}/api/v1/dashboard/monitor`);
                let evaluationTraces = [];
                if (monitorRes.ok) {
                    const data = await monitorRes.json();
                    evaluationTraces = (data.traces || []).map((t: any) => ({
                        id: t.id,
                        timestamp: t.timestamp,
                        level: t.status === 'block' ? 'ERROR' : t.status === 'warn' ? 'WARN' : 'INFO',
                        service: 'RedTeam',
                        message: `[SCAN] ${t.agent}: ${t.details}`,
                        latency: 0
                    }));
                }

                // 5. Fetch Proxy Logs (Live)
                const proxyLogsRes = await fetch(`${apiUrl}/api/v1/proxy/logs`);
                let proxyLogs = [];
                if (proxyLogsRes.ok) {
                    const data = await proxyLogsRes.json();
                    proxyLogs = data.map((l: any, i: number) => ({
                        id: `PRX-${i}`,
                        timestamp: l.timestamp,
                        level: l.status === 'BLOCK' ? 'ERROR' : l.status === 'WARN' ? 'WARN' : 'INFO',
                        service: 'Proxy',
                        message: `[GATEKEEPER] ${l.event}`,
                        latency: 0
                    }));
                }

                // Merge and Sort Logs
                const allLogs = [...proxyLogs, ...evaluationTraces].slice(0, 50);
                setLogs(allLogs);

                // 6. Fetch Global SLA Metrics (for counters)
                const slaMetricsRes = await fetch(`${apiUrl}/api/v1/sla/metrics`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (slaMetricsRes.ok) {
                    const slaData = await slaMetricsRes.json();
                    setStats(prev => ({
                        ...prev,
                        violations: (prev.violations || 0) + (slaData.pii_blocks || 0) + (slaData.policy_violations || 0),
                        traces_analyzed: (prev.traces_analyzed || 0) + (slaData.total_requests || 0)
                    }));
                }

            } catch (error) {
                console.error("Fetch failed", error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);


    // --- DATA PREP ---
    const baseCategories = [
        { name: 'Data Privacy', policies: ['pii', 'gdpr', 'data'] },
        { name: 'Content Safety', policies: ['toxic', 'hate', 'content'] },
        { name: 'Regulatory', policies: ['eu', 'act', 'compliance'] },
        { name: 'Ops Security', policies: ['key', 'secret', 'auth'] },
        { name: 'Ethical AI', policies: ['bias', 'fairness', 'ethics'] },
    ];
    const radarData = baseCategories.map(cat => {
        const matchCount = policies.filter(p => cat.policies.some(k => p.name.toLowerCase().includes(k)) && p.is_active).length;
        return { subject: cat.name, A: policies.length === 0 ? 80 : Math.min(100, 50 + (matchCount * 25)), fullMark: 100 };
    });

    const efficacyData = policies.slice(0, 4).map(p => {
        // Mock logic: Scans vs Blocks
        const scans = 230 + Math.floor(Math.random() * 50);
        const blocks = p.is_active ? Math.floor(Math.random() * 15) + 3 : 0;
        const rate = ((blocks / scans) * 100).toFixed(1);
        return { name: p.name, scans, blocks, rate };
    });

    const sreChartData = slaHistory.map((p: any) => ({
        time: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latency: p.avg_response_time_ms || 0,
        requests: p.total_requests || 0,
        errors: (p.total_requests - p.successful_requests) || 0
    }));

    // DYNAMIC Traffic Flow: Infer architecture from user's workflow
    const inferTrafficFlow = () => {
        // Extract unique workflow names from recent evaluations
        const workflows = stats.recent_evaluations.map(e => e.workflow_name || '').filter(Boolean);

        // Pattern detection
        const hasRAG = workflows.some(w => /rag|retrieval|vector|search/i.test(w));
        const hasChat = workflows.some(w => /chat|conversation|dialogue/i.test(w));
        const hasImage = workflows.some(w => /image|vision|multimodal/i.test(w));
        const hasCode = workflows.some(w => /code|copilot|completion/i.test(w));

        // Build flow based on detected patterns
        const flow = [
            { icon: Globe, label: 'User Request', desc: 'Incoming Traffic', color: 'blue' }
        ];

        if (hasRAG) {
            flow.push({ icon: Database, label: 'Vector DB', desc: 'Semantic Search', color: 'purple' });
        }
        if (hasImage) {
            flow.push({ icon: Eye, label: 'Vision API', desc: 'Image Processing', color: 'pink' });
        }

        // Always include Policy Guard
        flow.push({ icon: ShieldCheck, label: 'Policy Guard', desc: 'Compliance Check', color: 'purple' });

        // Destination based on type
        if (hasCode) {
            flow.push({ icon: Terminal, label: 'Code Model', desc: 'Generation (95%)', color: 'green' });
        } else if (hasChat) {
            flow.push({ icon: Activity, label: 'Chat Model', desc: 'Response (97%)', color: 'green' });
        } else {
            flow.push({ icon: Zap, label: 'LLM API', desc: 'Processing (98%)', color: 'green' });
        }

        return flow;
    };

    const trafficFlow = inferTrafficFlow();

    // --- THEME & LAYOUT COLORS ---
    const theme = {
        bg: "bg-gray-50/50 dark:bg-zinc-900/50",
        card: "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800",
        cardHeader: "border-b border-gray-100 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900/30",
        text: {
            primary: "text-gray-900 dark:text-gray-100",
            secondary: "text-gray-500 dark:text-gray-400",
            muted: "text-gray-400 dark:text-gray-600"
        }
    };

    const getHealthColor = (score: number) => {
        if (score >= 95) return "text-green-500";
        if (score >= 80) return "text-yellow-500";
        return "text-red-500";
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-24 max-w-[1600px] mx-auto">

            {/* TOP BAR: UNIFIED HEADER & TOGGLE */}
            <div className={`p-1.5 rounded-2xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 ${theme.card} sticky top-0 z-20 backdrop-blur-xl bg-opacity-80 dark:bg-opacity-80`}>

                <div className="flex items-center gap-4 px-4 py-2">
                    <div className={`p-2.5 rounded-xl shadow-sm ${viewMode === 'ciso' ? 'bg-blue-600' : 'bg-indigo-600'} text-white`}>
                        {viewMode === 'ciso' ? <ShieldCheck className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                    </div>
                    <div>
                        <h1 className={`text-xl font-bold tracking-tight ${theme.text.primary}`}>
                            {viewMode === 'ciso' ? 'Compliance Command Center' : 'Reliability Console'}
                        </h1>
                        <p className={`text-xs ${theme.text.secondary} font-medium`}>
                            {viewMode === 'ciso' ? 'Stream 1: Risk Management & Audit' : 'Stream 2: SRE & Performance Monitoring'}
                        </p>
                    </div>
                </div>

                <div className="bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl flex">
                    <button
                        onClick={() => setViewMode('ciso')}
                        className={`px-5 py-2 rounded-[10px] text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${viewMode === 'ciso'
                            ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Scale className="w-4 h-4" /> CISO View
                    </button>
                    <button
                        onClick={() => setViewMode('sre')}
                        className={`px-5 py-2 rounded-[10px] text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${viewMode === 'sre'
                            ? 'bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Terminal className="w-4 h-4" /> SRE View
                    </button>
                </div>
            </div>

            {/* --- VIEW 1: CISO DASHBOARD (Balanced Grid) --- */}
            {viewMode === 'ciso' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in slide-in-from-bottom-2 duration-300">

                    {/* A. KPI CARDS ROW (Top) */}
                    <div className="md:col-span-3">
                        <Card className={`${theme.card} relative overflow-hidden border-none shadow-md bg-gradient-to-br from-blue-600 to-indigo-600 text-white h-full`}>
                            <div className="absolute -right-6 -top-6 text-white/10"><ShieldCheck className="w-32 h-32" /></div>
                            <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
                                <div>
                                    <div className="text-blue-100 font-medium text-xs uppercase tracking-wider mb-1">Compliance Score</div>
                                    <div className="text-5xl font-bold">{stats.risk_score}%</div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-xs font-medium bg-white/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Deployment Ready
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-9 grid grid-cols-3 gap-6">
                        <Card className={`${theme.card} shadow-sm border-l-4 border-l-blue-500`}>
                            <CardContent className="p-5">
                                <div className={`text-xs font-semibold uppercase tracking-wider ${theme.text.secondary} mb-2`}>Active Policies</div>
                                <div className={`text-3xl font-bold ${theme.text.primary}`}>{policies.filter(p => p.is_active).length} <span className="text-lg text-gray-400 font-normal">/ {policies.length}</span></div>
                            </CardContent>
                        </Card>
                        <Card className={`${theme.card} shadow-sm border-l-4 border-l-orange-500`}>
                            <CardContent className="p-5">
                                <div className={`text-xs font-semibold uppercase tracking-wider ${theme.text.secondary} mb-2`}>Total Violations</div>
                                <div className={`text-3xl font-bold ${theme.text.primary}`}>{stats.violations}</div>
                            </CardContent>
                        </Card>
                        <Card className={`${theme.card} shadow-sm border-l-4 border-l-green-500`}>
                            <CardContent className="p-5">
                                <div className={`text-xs font-semibold uppercase tracking-wider ${theme.text.secondary} mb-2`}>Audits Passed</div>
                                <div className={`text-3xl font-bold ${theme.text.primary}`}>{stats.traces_analyzed - stats.violations}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* B. MAIN CONTENT (Split 4/8) */}

                    {/* Left: Policy Insights */}
                    <div className="md:col-span-4 flex flex-col gap-6">
                        <Card className={`${theme.card} shadow-sm`}>
                            <CardHeader className={theme.cardHeader}>
                                <CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" /> Coverage Map</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                {mounted ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                            <PolarGrid stroke="currentColor" className="text-gray-200 dark:text-zinc-700" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} stroke="currentColor" className="text-gray-500 dark:text-zinc-400" />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name="Coverage" dataKey="A" stroke="#2563eb" strokeWidth={2} fill="#3b82f6" fillOpacity={0.3} />
                                            <Tooltip contentStyle={{ backgroundColor: '#18181b', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">Loading Chart...</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className={`${theme.card} shadow-sm flex-1`}>
                            <CardHeader className={theme.cardHeader}>
                                <CardTitle className="text-base flex items-center gap-2"><Layers className="w-4 h-4 text-orange-500" /> Defense Efficacy</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4 overflow-y-auto max-h-[300px]">
                                {efficacyData.map((d, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className={`font-medium ${theme.text.primary} truncate max-w-[150px]`}>{d.name}</span>
                                            <span className="text-gray-500">{d.blocks} blocked / {d.scans} scans</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${Number(d.rate) > 5 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                style={{ width: `${Math.min(100, (d.blocks / d.scans) * 500)}%` }} // Exaggerated scale for visibility
                                            />
                                        </div>
                                        <div className="text-[10px] text-right text-gray-400 mt-0.5">{d.rate}% detection rate</div>
                                    </div>
                                ))}
                                {efficacyData.length === 0 && <div className="text-center text-gray-500 text-xs py-4">No data available.</div>}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Feed */}
                    <div className="md:col-span-8">
                        <Card className={`${theme.card} h-full shadow-sm flex flex-col`}>
                            <CardHeader className={`${theme.cardHeader} flex flex-row items-center justify-between py-4`}>
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-gray-500" />
                                    <h3 className="font-semibold text-sm">Real-time Audit Feed</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-xs text-gray-500">Live</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-hidden relative min-h-[500px]">
                                <div className="absolute inset-0 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800">
                                    {logs.map((item, idx) => (
                                        <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors flex items-start gap-4 group">
                                            <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${item.level !== 'ERROR'
                                                ? 'bg-green-50/50 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-900/30'
                                                : 'bg-red-50/50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-900/30'
                                                }`}>
                                                {item.level !== 'ERROR' ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold tracking-tighter ${item.service === 'Proxy' ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'
                                                            }`}>
                                                            {item.service}
                                                        </span>
                                                        <p className={`text-sm font-medium truncate ${theme.text.primary}`}>
                                                            {item.message}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-mono">{item.timestamp.includes('T') ? new Date(item.timestamp).toLocaleTimeString() : item.timestamp}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-1">
                                                    {item.level === 'INFO' ? 'Request validated and passed.' :
                                                        item.level === 'ERROR' ? 'Security Policy Violation: request blocked.' :
                                                            'Audit warning: potential compliance issue.'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {logs.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                                            <ShieldCheck className="w-8 h-8 mb-2 opacity-20" />
                                            <p>No audits recorded yet.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* --- VIEW 2: SRE DASHBOARD (Standardized) --- */}
            {viewMode === 'sre' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-right-2 duration-300">

                    {/* Top Row: 4 Metric Cards */}
                    {[
                        { label: 'Uptime (24h)', val: `${stats.system_health}%`, icon: <Activity className="w-4 h-4" />, color: getHealthColor(stats.system_health) },
                        { label: 'Avg Latency', val: `${sreChartData.length > 0 ? Math.round(sreChartData[sreChartData.length - 1].latency) : 0}ms`, icon: <Timer className="w-4 h-4" />, color: 'text-indigo-600 dark:text-indigo-400' },
                        { label: 'Error Rate', val: `${sreChartData.length > 0 ? ((sreChartData[sreChartData.length - 1].errors / (sreChartData[sreChartData.length - 1].requests || 1)) * 100).toFixed(2) : 0}%`, icon: <AlertTriangle className="w-4 h-4" />, color: 'text-indigo-600 dark:text-indigo-400' },
                        { label: 'Throughput', val: `${sreChartData.length > 0 ? sreChartData[sreChartData.length - 1].requests : 0} rpm`, icon: <Zap className="w-4 h-4" />, color: 'text-indigo-600 dark:text-indigo-400' },
                    ].map((m, i) => (
                        <Card key={i} className={`${theme.card} shadow-sm hover:shadow-md transition-shadow`}>
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className={`text-xs font-semibold uppercase tracking-wider ${theme.text.secondary} mb-1`}>{m.label}</div>
                                        <div className={`text-2xl font-bold ${m.color}`}>{m.val}</div>
                                    </div>
                                    <div className={`p-2 rounded-lg bg-gray-50 dark:bg-zinc-800 ${theme.text.muted}`}>{m.icon}</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Main Chart Section (Takes 3/4 width) */}
                    <div className="md:col-span-3 space-y-6">
                        <Card className={`${theme.card} shadow-md`}>
                            <CardHeader className={theme.cardHeader}>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-base flex items-center gap-2"><Server className="w-4 h-4 text-indigo-500" /> Live Telemetry</CardTitle>
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Traffic</div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Latency</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="h-[400px] p-2">
                                {mounted ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
                                        <ComposedChart data={sreChartData.length > 0 ? sreChartData : [{ time: '00:00', requests: 0, latency: 0 }]} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
                                            <defs>
                                                <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-100 dark:text-zinc-800" />
                                            <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" />
                                            <YAxis yAxisId="left" orientation="left" stroke="#6366f1" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={11} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: '#18181b', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                                            <Area yAxisId="left" type="monotone" dataKey="requests" fill="url(#colorReq)" stroke="#6366f1" strokeWidth={2} />
                                            <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">Loading Live Telemetry...</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Logic Section (Takes 1/4 width) - Terminal & Traffic Flow */}
                    <div className="md:col-span-1 space-y-6">

                        {/* Traffic Flow - Dynamic Architecture */}
                        <Card className={`${theme.card} shadow-sm`}>
                            <CardHeader className={`${theme.cardHeader} py-3`}>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Network className="w-4 h-4 text-purple-500" /> Traffic Flow</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-4 relative">
                                    <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-green-200 dark:from-blue-900 dark:via-purple-900 dark:to-green-900"></div>

                                    {trafficFlow.map((node, idx) => {
                                        const IconComponent = node.icon;
                                        const colorMap: Record<string, string> = {
                                            blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                                            purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                                            green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                                            pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                                        };

                                        return (
                                            <div key={idx} className="relative flex items-center gap-3 animate-in fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${colorMap[node.color] || colorMap.blue}`}>
                                                    <IconComponent className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className={`text-xs font-medium ${theme.text.primary}`}>{node.label}</div>
                                                    <div className="text-[10px] text-gray-500">{node.desc}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {trafficFlow.length === 1 && (
                                    <div className="text-center text-xs text-gray-400 mt-4 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                        Run evaluations to see your AI system's architecture
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Live Terminal */}
                        <Card className="flex flex-col h-[250px] bg-[#0c0c0c] border border-gray-800 shadow-xl overflow-hidden rounded-xl">
                            <div className="bg-[#1f1f1f] border-b border-white/5 p-2 px-3 flex items-center justify-between">
                                <div className="text-[10px] font-mono text-gray-400 flex items-center gap-2">
                                    <Terminal className="w-3 h-3 text-green-500" /> bash --live
                                </div>
                                <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500/20"></div><div className="w-2 h-2 rounded-full bg-yellow-500/20"></div><div className="w-2 h-2 rounded-full bg-green-500/20"></div></div>
                            </div>
                            <div className="flex-1 p-3 font-mono text-[10px] text-gray-300 overflow-y-auto space-y-1.5 custom-scrollbar" ref={logContainerRef}>
                                {logs.map((log, i) => (
                                    <div key={i} className="flex gap-2">
                                        <span className="text-gray-600 w-10 shrink-0">{log.timestamp.split('T')[1]?.split('.')[0]}</span>
                                        <span className={log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-yellow-400' : 'text-green-400'}>{log.level}</span>
                                        <span className="break-all opacity-80">{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                    </div>
                </div>
            )}

        </div>
    );
}
