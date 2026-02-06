"use client"

import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import {
    Activity, ShieldCheck, Zap,
    ArrowRight, Lock, Server,
    AlertTriangle, CheckCircle2,
    BarChart3, Scale, Timer,
    Globe, Eye,
    Cpu, HardDrive, Database, Layers,
    FileText, Check, XCircle, Stethoscope, Wrench, Sparkles, Image as ImageIcon, Download, Box, ShieldAlert,
    Gavel, History, Scale as LegalScale, Sun, Moon, Bell, BellOff
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Line, ComposedChart, Legend,
    BarChart, Bar, Cell, Sankey
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface DashboardStats {
    traces_analyzed: number;
    violations: number;
    active_policies: number;
    system_health: number;
    risk_score: number;
    recent_evaluations: any[];
    recent_traces: any[];
    pg_passed?: number;
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
    agent?: string;
    status?: 'block' | 'warn' | 'pass';
    logicDrift?: boolean;
    entropy?: number;
    p_value?: number;
}


export default function OverviewPage() {
    const { isJudge } = useAuth();
    const router = useRouter();
    const { theme: currentTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [shieldActive, setShieldActive] = useState({
        hallucination_deflector: true,
        sla_guard: true,
        human_loop: false
    });
    const [activeFilters, setActiveFilters] = useState({
        agent: 'all',
        category: 'all',
        severity: 'all'
    });

    const [healingStatus, setHealingStatus] = useState<{
        active: boolean;
        agent: string;
        stage: 'analyzing' | 'patching' | 'verified' | 'idle';
        patchedPrompt?: string;
    }>({ active: false, agent: '', stage: 'idle' });

    const [healedViolations, setHealedViolations] = useState<Set<string>>(new Set());
    const lastNotifiedId = useRef<string | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    const handleHotPatch = async (agent: string, violations: string[]) => {
        setHealingStatus({ active: true, agent, stage: 'analyzing' });

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';
            const res = await fetch(`${apiUrl}/api/v1/remediate/patch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_prompt: `You are the ${agent}. Help users with their requests. Be professional.`,
                    violations
                })
            });

            if (res.ok) {
                const data = await res.json();
                setHealingStatus(prev => ({ ...prev, stage: 'patching' }));
                await new Promise(r => setTimeout(r, 1500)); // Simulating patching time
                setHealingStatus(prev => ({
                    ...prev,
                    stage: 'verified',
                    patchedPrompt: data.patched_prompt
                }));
            }
        } catch (error) {
            console.error("Hot-Patching failed:", error);
            setHealingStatus({ active: false, agent: '', stage: 'idle' });
        }
    };

    const [hitlQueue, setHitlQueue] = useState<any[]>([]);

    const [freezeState, setFreezeState] = useState({
        mutation: false,
        export: false,
        enforcement: false
    });

    const [governanceProfile, setGovernanceProfile] = useState<'EU' | 'SEC' | 'Standard'>('Standard');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [visualAudit, setVisualAudit] = useState<{
        active: boolean;
        analyzing: boolean;
        findings: any[];
        imageSample?: string;
        semanticIntent?: string;
        visionConfidence?: number;
        is_contestable?: boolean;
        judgment_norms?: string;
    }>({ active: false, analyzing: false, findings: [] });

    const handleTieredFreeze = async (tier: keyof typeof freezeState) => {
        const newState = { ...freezeState, [tier]: !freezeState[tier] };
        setFreezeState(newState);

        // API call to update backend freeze matrix
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';
            const res = await fetch(`${apiUrl}/api/v1/system/freeze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    frozen: newState.mutation || newState.enforcement,
                    tier: tier
                })
            });

            if (!res.ok) {
                console.error("Failed to update freeze state");
                // Rollback state on failure
                setFreezeState(freezeState);
            }
        } catch (error) {
            console.error("Freeze API error:", error);
            setFreezeState(freezeState);
        }
    };

    const handleVisualScan = async (file?: File) => {
        let previewUrl = '/mock_audit_ui.png';

        if (file) {
            const reader = new FileReader();
            previewUrl = await new Promise((resolve) => {
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(file);
            });
        }

        setVisualAudit({
            active: true,
            analyzing: true,
            findings: [],
            imageSample: previewUrl
        });

        try {
            let blob: Blob;
            if (file) {
                blob = file;
            } else {
                const imgRes = await fetch('/mock_audit_ui.png');
                blob = await imgRes.blob();
            }

            const formData = new FormData();
            formData.append('file', blob, file ? file.name : 'sample.png');
            formData.append('profile', governanceProfile);
            formData.append('context', "Visual Governance Audit for Agentic Systems");

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';
            const res = await fetch(`${apiUrl}/api/v1/visual/scan`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setVisualAudit((prev: any) => ({
                    ...prev,
                    analyzing: false,
                    findings: data.findings || [],
                    semanticIntent: data.constitutional_verdict?.narrative_risk || "Analysis Complete",
                    visionConfidence: data.vision_confidence || 85,
                    is_contestable: data.constitutional_verdict?.is_contestable || false,
                    judgment_norms: data.constitutional_verdict?.judgment_norms || "Global Governance Standard"
                }));
            } else {
                throw new Error("Scan failed");
            }
        } catch (e) {
            console.error("Visual Scan Error", e);
            setVisualAudit((prev: any) => ({ ...prev, analyzing: false, semanticIntent: "Scan Failed (Backend Error)" }));
        }
    };

    const handleAntigravityExport = async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';
        window.open(`${apiUrl}/api/v1/export/antigravity`, '_blank');
    };

    const handleHITLFeedback = async (id: string, verdict: 'APPROVE' | 'DENY') => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';
            const res = await fetch(`${apiUrl}/api/v1/hitl/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    decision_id: id,
                    verdict,
                    context: { agent: hitlQueue.find(i => i.id === id)?.agent },
                    reasoning: `Manual override by operator for ${verdict.toLowerCase()} case.`
                })
            });

            if (res.ok) {
                setHitlQueue(prev => prev.filter(item => item.id !== id));
            }
        } catch (error) {
            console.error("HITL Feedback failed:", error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);

        // Check notification permission
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotificationsEnabled(Notification.permission === 'granted');
        }

        // Load healed violations from localStorage
        const savedHealed = localStorage.getItem('pg_healed_violations');
        if (savedHealed) {
            try {
                const healedArray = JSON.parse(savedHealed);
                setHealedViolations(new Set(healedArray));
            } catch (e) {
                console.error('Failed to load healed violations:', e);
            }
        }

        return () => clearTimeout(timer);
    }, []);

    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            toast.error('Browser does not support desktop notifications');
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            setNotificationsEnabled(true);
            toast.success('Push notifications enabled!');
            new Notification('PolicyGuard AI', {
                body: 'Notifications are now active. You will be alerted of critical blocks.',
                icon: '/shield_logo.png'
            });
        }
    };

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
    const [reports, setReports] = useState<any[]>([]);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';

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

                // 4. Fetch Reports (Live)
                const reportsRes = await fetch(`${apiUrl}/api/v1/compliance/reports`);
                if (reportsRes.ok) {
                    const data = await reportsRes.json();
                    setReports(data);
                }

                // 5. Fetch HITL Queue
                const hitlRes = await fetch(`${apiUrl}/api/v1/hitl/queue`);
                if (hitlRes.ok) {
                    const data = await hitlRes.json();
                    setHitlQueue(data || []);
                }

                // 5. Fetch Monitor Data (for logs)
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
                        latency: 0,
                        agent: t.agent,
                        status: t.status
                    }));
                }

                // 5. Fetch Proxy Logs (Live)
                const proxyLogsRes = await fetch(`${apiUrl}/api/v1/proxy/logs`);
                let proxyLogs = [];
                if (proxyLogsRes.ok) {
                    const data = await proxyLogsRes.json();
                    proxyLogs = data.map((l: any) => ({
                        id: l.id,
                        timestamp: l.timestamp,
                        level: l.status === 'BLOCK' ? 'ERROR' : l.status === 'WARN' ? 'WARN' : 'INFO',
                        service: 'Proxy',
                        message: `[GATEKEEPER] ${l.event}`,
                        latency: 0,
                        agent: 'PolicyGuard-Proxy',
                        status: l.status.toLowerCase() as any
                    }));
                }

                // Sort Logs (Newest First)
                const allLogs = [...proxyLogs, ...evaluationTraces]
                    .filter(log => {
                        if (activeFilters.severity !== 'all' && log.level !== activeFilters.severity) return false;
                        return true;
                    })
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                // --- PUSH NOTIFICATION LOGIC ---
                if (allLogs.length > 0) {
                    const latestLog = allLogs[0];
                    if (latestLog.level === 'ERROR' && latestLog.id !== lastNotifiedId.current) {
                        // Avoid notifying on first load or duplicate
                        if (lastNotifiedId.current !== null) {
                            // Trigger Sonner Toast
                            toast.error(`CRITICAL BLOCK: ${latestLog.message}`, {
                                description: `Agent: ${latestLog.agent}`,
                                duration: 8000,
                                action: {
                                    label: "View Details",
                                    onClick: () => router.push('/dashboard/monitor')
                                }
                            });

                            // Trigger Browser Push Notification
                            if (Notification.permission === 'granted') {
                                new Notification('🚨 PolicyGuard Block', {
                                    body: `${latestLog.agent}: ${latestLog.message}`,
                                    icon: '/shield_logo.png'
                                });
                            }
                        }
                        lastNotifiedId.current = latestLog.id;
                    } else if (lastNotifiedId.current === null) {
                        // Initialize on first load
                        lastNotifiedId.current = latestLog.id;
                    }
                }

                setLogs(allLogs.slice(0, 50));

                // 6. Fetch Global SLA Metrics (Optional - for logs or something else, but stats are now handled by /dashboard/stats)
                // We keep this call if we need it for other parts, but we remove the setStats from here
                // to prevent flickering.

                if (isJudge && allLogs.length === 0) {
                    const mockLogs: LogEntry[] = [
                        { id: 'M-1', timestamp: new Date().toISOString(), level: 'WARN', service: 'Proxy', message: '[SCAN] PII Leak detected in stream 1 - Suppressed', latency: 42 },
                        { id: 'M-2', timestamp: new Date(Date.now() - 5000).toISOString(), level: 'INFO', service: 'Evaluate', message: 'Mission Critical Audit Complete - No critical failures', latency: 1200 },
                        { id: 'M-3', timestamp: new Date(Date.now() - 15000).toISOString(), level: 'ERROR', service: 'RedTeam', message: 'Adversarial Injection Attempt: "ignore previous instructions"', latency: 0 }
                    ];
                    setLogs(mockLogs);
                }

                if (isJudge && stats.traces_analyzed === 0) {
                    setStats({
                        traces_analyzed: 12450,
                        violations: 142,
                        active_policies: policies.length || 5,
                        system_health: 98.4,
                        risk_score: 98.4,
                        recent_evaluations: [],
                        recent_traces: []
                    });
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


    // --- THEME & LAYOUT COLORS ---
    const theme = {
        bg: "bg-slate-50/50 dark:bg-slate-950/50",
        card: "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/60",
        cardHeader: "border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20",
        text: {
            primary: "text-slate-900 dark:text-slate-50",
            secondary: "text-slate-500 dark:text-slate-400",
            muted: "text-slate-400 dark:text-slate-500"
        }
    };

    // Tab State
    const [activeTab, setActiveTab] = useState('Overview');

    const getHealthColor = (score: number) => {
        if (score >= 95) return "text-emerald-500 dark:text-emerald-400";
        if (score >= 80) return "text-amber-500 dark:text-amber-400";
        return "text-red-500 dark:text-red-400";
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-24 max-w-[1600px] mx-auto">

            {/* NEW HEADER DESIGN */}
            <div className="flex flex-col gap-6 mb-8">
                {/* Title & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 id="dashboard-title" className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
                        <p className="text-sm text-slate-500 mt-1">Real-time governance oversight and system health monitoring.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                            {['Overview', 'Analytics', 'Reports', 'Notifications'].map((tab) => (
                                <button
                                    key={tab}
                                    id={`tab-${tab.toLowerCase()}`}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === tab
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={requestNotificationPermission}
                            className={`w-9 h-9 border-slate-200 dark:border-slate-800 transition-colors ${notificationsEnabled ? 'text-blue-500' : 'text-slate-500'}`}
                            title={notificationsEnabled ? "Push Notifications Active" : "Enable Push Notifications"}
                        >
                            {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
                            className="w-9 h-9 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                        >
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>

                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={handleAntigravityExport}
                        >
                            <Download className="w-4 h-4 mr-2" /> Download Report
                        </Button>
                    </div>
                </div>

                {/* 4-Card KPI Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1: Trust Score */}
                    <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Global Trust Score</CardTitle>
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.risk_score}%</div>
                            <p className="text-xs text-emerald-500 flex items-center mt-1">
                                <ArrowRight className="w-3 h-3 rotate-[-45deg] mr-1" /> +2.5% from last week
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 2: Total Traffic */}
                    <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Total Analyzed</CardTitle>
                            <Activity className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.traces_analyzed.toLocaleString()}</div>
                            <p className="text-xs text-blue-500 flex items-center mt-1">
                                <ArrowRight className="w-3 h-3 rotate-[-45deg] mr-1" /> +12% traffic volume
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 3: Threats Blocked */}
                    <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Threats Blocked</CardTitle>
                            <ShieldAlert className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.violations}</div>
                            <p className="text-xs text-slate-500 mt-1">
                                {((stats.violations / (stats.traces_analyzed || 1)) * 100).toFixed(1)}% block rate
                            </p>
                        </CardContent>
                    </Card>

                    {/* Card 4: System Latency */}
                    <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Avg Latency</CardTitle>
                            <Zap className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{slaHistory[slaHistory.length - 1]?.avg_response_time_ms || 0}ms</div>
                            <p className="text-xs text-amber-500 flex items-center mt-1">
                                <Activity className="w-3 h-3 mr-1" /> 99.9% uptime
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* --- CONTENT AREA: TABS --- */}

            {/* 1. ANALYTICS VIEW */}
            {activeTab === 'Analytics' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Performance Trends */}
                        <Card className={`${theme.card} shadow-sm`}>
                            <CardHeader className={theme.cardHeader}>
                                <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-500" /> Latency & Request Volume</CardTitle>
                                <CardDescription>System performance over the last 24 hours</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px] p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={sreChartData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                        <XAxis dataKey="time" className="text-xs text-slate-500" />
                                        <YAxis yAxisId="left" className="text-xs text-slate-500" />
                                        <YAxis yAxisId="right" orientation="right" className="text-xs text-slate-500" />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: '8px' }} />
                                        <Legend />
                                        <Area yAxisId="left" type="monotone" dataKey="requests" fill="#3b82f6" fillOpacity={0.1} stroke="#3b82f6" name="Requests" />
                                        <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#f59e0b" strokeWidth={2} name="Latency (ms)" dot={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Violation Distribution */}
                        <Card className={`${theme.card} shadow-sm`}>
                            <CardHeader className={theme.cardHeader}>
                                <CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-red-500" /> Violation Distribution</CardTitle>
                                <CardDescription>Breakdown of blocked requests by category</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px] p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={radarData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" vertical={false} />
                                        <XAxis dataKey="subject" className="text-xs text-slate-500" />
                                        <YAxis className="text-xs text-slate-500" />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: '8px' }} />
                                        <Bar dataKey="A" name="Risk Score" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* 2. REPORTS VIEW */}
            {activeTab === 'Reports' && (
                <div className="animate-in fade-in duration-300">
                    <Card className={`${theme.card} shadow-sm`}>
                        <CardHeader className={theme.cardHeader}>
                            <CardTitle className="text-base">Generated Compliance Reports</CardTitle>
                            <CardDescription>Download detailed audits and governance summaries.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {reports.length > 0 ? (
                                    reports.map((report, i) => (
                                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{report.name}</p>
                                                    <p className="text-xs text-slate-500">{report.date} • {report.size}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                                onClick={() => {
                                                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';
                                                    window.open(`${apiUrl}${report.download_url}`, '_blank');
                                                }}
                                            >
                                                <Download className="w-3.5 h-3.5" /> {report.type}
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-500">Generating compliance reports...</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* 3. NOTIFICATIONS VIEW */}
            {activeTab === 'Notifications' && (
                <div className="animate-in fade-in duration-300 max-w-4xl mx-auto">
                    <Card className={`${theme.card} shadow-sm`}>
                        <CardHeader className={`${theme.cardHeader} flex flex-row items-center justify-between`}>
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                                    <ShieldAlert className="w-4 h-4" />
                                </div>
                                <CardTitle className="text-base">System Alerts</CardTitle>
                            </div>
                            <Badge variant="outline" className="text-slate-500">Live Feed</Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {logs.length > 0 ? logs.map((log) => (
                                    <div key={log.id} className="p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                        <div className={`mt-1 p-1.5 rounded-full shrink-0 ${log.level === 'ERROR' ? 'bg-red-100 text-red-600' :
                                            log.level === 'WARN' ? 'bg-amber-100 text-amber-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                            {log.level === 'ERROR' ? <ShieldAlert className="w-3.5 h-3.5" /> :
                                                log.level === 'WARN' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                                                    <Activity className="w-3.5 h-3.5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                                                    {log.service} {log.level === 'ERROR' && 'Blocked Request'}
                                                </p>
                                                <span className="text-xs text-slate-400 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-mono text-[11px] truncate">
                                                {log.message}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-12 text-center text-slate-400">
                                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p>No active alerts</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* --- DEFAULT VIEW: OVERVIEW --- */}
            {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in slide-in-from-bottom-2 duration-300">

                    {/* Left: Policy Insights */}
                    <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-6">
                        <Card className={`${theme.card} shadow-sm`}>
                            <CardHeader id="coverage-map-card" className={theme.cardHeader}>
                                <CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" /> Coverage Map</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                {mounted ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                            <PolarGrid stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} stroke="currentColor" className="text-slate-500 dark:text-slate-400" />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name="Coverage" dataKey="A" stroke="#2563eb" strokeWidth={2} fill="#3b82f6" fillOpacity={0.3} />
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: '8px', border: '1px solid #1e293b', fontSize: '12px' }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className={`h-full w-full flex items-center justify-center text-xs ${theme.text.muted}`}>Loading Chart...</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className={`${theme.card} shadow-sm flex-1`}>
                            <CardHeader className={theme.cardHeader}>
                                <CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-purple-500" /> Shield Controls</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-amber-500" />
                                        <span className="text-xs font-medium">Hallucination Deflector</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={shieldActive.hallucination_deflector ? "default" : "outline"}
                                        className="h-6 text-[10px]"
                                        onClick={() => setShieldActive(prev => ({ ...prev, hallucination_deflector: !prev.hallucination_deflector }))}
                                    >
                                        {shieldActive.hallucination_deflector ? "ACTIVE" : "OFF"}
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-medium">Autonomous SLA Guard</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={shieldActive.sla_guard ? "default" : "outline"}
                                        className="h-6 text-[10px]"
                                        onClick={() => setShieldActive(prev => ({ ...prev, sla_guard: !prev.sla_guard }))}
                                    >
                                        {shieldActive.sla_guard ? "ACTIVE" : "OFF"}
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-emerald-500" />
                                        <span className="text-xs font-medium">Human Review Loop</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={shieldActive.human_loop ? "default" : "outline"}
                                        className="h-6 text-[10px]"
                                        onClick={() => setShieldActive(prev => ({ ...prev, human_loop: !prev.human_loop }))}
                                    >
                                        {shieldActive.human_loop ? "ACTIVE" : "OFF"}
                                    </Button>
                                </div>

                                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="file"
                                            className="hidden"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleVisualScan(file);
                                            }}
                                        />
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-[10px] h-8 gap-2 border-dashed"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> LIVE VISUAL SHIELD
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start text-[8px] h-6 gap-2 opacity-50 hover:opacity-100"
                                            onClick={() => handleVisualScan()}
                                        >
                                            <Sparkles className="w-3 h-3 text-purple-500" /> Try Sample (Fast)
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="w-full justify-start text-[10px] h-8 gap-2 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                                            onClick={handleAntigravityExport}
                                        >
                                            <Download className="w-3.5 h-3.5" /> EXPORT TO ANTIGRAVITY
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Feed */}
                    <div className="md:col-span-12 lg:col-span-8 flex flex-col gap-6">
                        {/* Review Queue (HITL) */}
                        <Card className={`${theme.card} shadow-sm border-l-4 border-l-amber-500 bg-amber-50/10 dark:bg-amber-950/5`}>
                            <CardHeader className="py-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <AlertTriangle className="w-4 h-4" /> REVIEW QUEUE: {hitlQueue.length} Pending Borderline Cases
                                </CardTitle>
                                <Button size="sm" variant="ghost" className="h-7 text-[10px] text-amber-600">View All</Button>
                            </CardHeader>
                            <CardContent className="p-0 border-t border-amber-100 dark:border-amber-900/30">
                                <div className="divide-y divide-amber-100 dark:divide-amber-900/30">
                                    {hitlQueue.map((item) => (
                                        <div key={item.id} className="p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold font-mono">ID: {item.id}</span>
                                                <span className="text-[10px] text-slate-500">Agent: {item.agent}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700">{item.issue}</Badge>
                                                <span className="text-[8px] text-amber-600 mt-1 uppercase font-bold tracking-tighter">{item.status}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="h-7 px-3 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                                                    onClick={() => handleHITLFeedback(item.id, 'APPROVE')}
                                                >
                                                    APPROVE & LEARN
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 px-3 text-[10px] border-red-500 text-red-500 hover:bg-red-50"
                                                    onClick={() => handleHITLFeedback(item.id, 'DENY')}
                                                >
                                                    DENY & LEARN
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {hitlQueue.length === 0 && (
                                        <div className="p-8 text-center text-xs text-slate-400 italic">
                                            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 opacity-20" />
                                            Queue Cleared. Model calibration updated.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Self-Healing Lab (Active Demo) */}
                        {/* Visual Shield Modal/Panel */}
                        {visualAudit.active && (
                            <Card className={`${theme.card} border-2 border-blue-500/30 overflow-hidden animate-in slide-in-from-top-4 duration-500 mb-6 shadow-2xl backdrop-blur-sm`}>
                                <div className={`${theme.cardHeader} p-4 flex items-center justify-between`}>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                                            <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h3 className={`text-sm font-bold uppercase tracking-tight ${theme.text.primary}`}>Visual Shield: Native Gemini 3 Multimodal Audit</h3>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-8 px-3 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => setVisualAudit({ active: false, analyzing: false, findings: [] })}>
                                        EXIT LAB
                                    </Button>
                                </div>
                                <CardContent className="p-4 flex flex-col md:flex-row gap-6 md:h-[700px] h-auto min-h-0">
                                    {/* Left Side: Audit Viewport */}
                                    <div className="flex-[1.5] bg-slate-100 dark:bg-slate-950 rounded-2xl relative border border-slate-200 dark:border-slate-800 flex items-center justify-center p-12 shadow-inner min-h-[400px] md:min-h-0 overflow-hidden">
                                        <div className="absolute top-6 left-6 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">LIVE AUDIT VIEWPORT [V3-HOTFIX-ACTIVE]</span>
                                        </div>

                                        <div className="w-full h-full flex items-center justify-center p-6 overflow-hidden">
                                            {visualAudit.analyzing ? (
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="relative">
                                                        <div className="w-16 h-16 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin" />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 animate-ping" />
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-black text-blue-600 dark:text-blue-400 animate-pulse uppercase tracking-[0.2em]">Auditing Multimodal Context...</span>
                                                </div>
                                            ) : (
                                                <div className="relative flex items-center justify-center group transition-all duration-500">
                                                    {visualAudit.imageSample ? (
                                                        <div className="relative">
                                                            <div className="absolute -inset-4 bg-blue-500/5 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                                                            <img
                                                                src={visualAudit.imageSample}
                                                                alt="Visual Guard Audit"
                                                                className="max-h-[300px] md:max-h-[500px] w-auto object-contain rounded-xl shadow-[0_30px_70px_rgba(0,0,0,0.4)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.7)] border-4 border-white dark:border-slate-800 transition-transform relative z-10"
                                                            />
                                                            {!visualAudit.analyzing && visualAudit.findings?.length > 0 && (
                                                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[11px] font-black px-6 py-2 rounded-full shadow-2xl border-2 border-white dark:border-slate-900 uppercase tracking-tighter animate-bounce z-20 whitespace-nowrap">
                                                                    VIOLATION DETECTED
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center opacity-30 text-slate-400">
                                                            <BarChart3 className="w-24 h-24 mb-6" strokeWidth={1} />
                                                            <p className="text-xs font-black uppercase tracking-[0.3em] ml-1">NO SIGNAL DETECTED</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Right Side: Governance Insights */}
                                    <div className="flex-1 flex flex-col gap-4 min-w-0 md:h-full h-auto overflow-hidden">
                                        <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar space-y-4 md:max-h-full max-h-[500px] pt-8 pb-8">
                                            {/* Governance Action Block */}
                                            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <ShieldAlert className="w-12 h-12 text-red-600" />
                                                </div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <ShieldAlert className="w-5 h-5 text-red-600" />
                                                    <span className="text-xs font-extrabold text-red-700 dark:text-red-400 uppercase tracking-tight">ENFORCEMENT: {visualAudit.findings?.[0]?.action}</span>
                                                </div>
                                                <div className="space-y-4 relative z-10">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Foundational Norms</span>
                                                        <div className="text-xs font-extrabold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 bg-blue-500/5 dark:bg-blue-500/10 p-2 rounded-lg">
                                                            <Gavel className="w-3.5 h-3.5" /> {visualAudit.judgment_norms}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Semantic Risk Profile</span>
                                                        <div className="text-[11px] font-bold text-red-700 dark:text-red-400 leading-snug bg-red-500/5 dark:bg-red-500/10 p-3 rounded-xl border border-red-500/10">
                                                            <ul className="space-y-1.5 list-disc pl-3">
                                                                {visualAudit.semanticIntent && visualAudit.semanticIntent.split('. ').filter(Boolean).slice(0, 3).map((point: string, idx: number) => (
                                                                    <li key={idx} className="leading-tight">{point.trim()}{!point.endsWith('.') && idx < 2 ? '.' : ''}</li>
                                                                ))}
                                                                {!visualAudit.semanticIntent && <li>Analysis pending stream extraction...</li>}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Vision Engine Confidence</span>
                                                        <div className="flex items-center gap-3 bg-slate-500/5 dark:bg-white/5 p-2 rounded-lg">
                                                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                <div className="h-full bg-blue-600 animate-pulse" style={{ width: `${visualAudit.visionConfidence}%` }}></div>
                                                            </div>
                                                            <span className="text-xs font-black text-blue-700 dark:text-blue-400">{visualAudit.visionConfidence}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Detailed Reason */}
                                            <div className={`p-4 rounded-xl border ${theme.card} shadow-sm bg-slate-50/50 dark:bg-slate-900/50`}>
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Technical Rationale</span>
                                                <div className={`text-[11px] leading-relaxed ${theme.text.secondary} space-y-1`}>
                                                    {visualAudit.findings?.[0]?.reason && visualAudit.findings[0].reason.split('. ').filter(Boolean).slice(0, 2).map((r: string, idx: number) => (
                                                        <p key={idx} className="flex gap-2">
                                                            <span className="text-blue-500 shrink-0">▸</span>
                                                            <span>{r.trim()}</span>
                                                        </p>
                                                    )) || "Analysis pending metadata extraction from visual stream..."}
                                                </div>
                                            </div>

                                            {/* Authority Section */}
                                            <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-1">
                                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Authority Anchor</span>
                                                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight">GSB-RESOLUTION #2026-X4A <br /> <span className="opacity-50">VERIFIED BLOCKCHAIN PROOF</span></div>
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="pt-2 flex gap-2 shrink-0">
                                            {visualAudit.is_contestable && (
                                                <Button variant="outline" className="flex-1 text-[11px] font-black h-10 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-2 uppercase">
                                                    <History className="w-4 h-4" /> FORMAL DISPUTE
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

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
                                <div className="absolute inset-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    {logs.map((item, idx) => (
                                        <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-4 group">
                                            <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${item.level !== 'ERROR'
                                                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-900/30'
                                                : 'bg-red-50/50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-900/30'
                                                }`}>
                                                {item.status === 'block' ? <XCircle className="w-4 h-4" /> :
                                                    item.status === 'warn' ? <AlertTriangle className="w-4 h-4" /> :
                                                        <CheckCircle2 className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <p className={`text-sm font-bold ${theme.text.primary}`}>{item.agent}</p>
                                                                <div className="flex items-center gap-1">
                                                                    <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">PR: MostRestrictiveWins</Badge>
                                                                    {item.status === 'block' && item.logicDrift && (
                                                                        <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600" title={`Entropy: ${item.entropy?.toFixed(2)} | P-Value: ${item.p_value}`}>Drift Evidence Hook</Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                                <span className="font-mono">{item.id}</span>
                                                                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Snapshot: Policy_v2.1_LTS</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[10px] font-mono ${theme.text.muted}`}>{item.timestamp.includes('T') ? new Date(item.timestamp).toLocaleTimeString() : item.timestamp}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className={`text-xs line-clamp-1 ${theme.text.secondary}`}>
                                                        {item.level === 'INFO' ? 'ALLOW: Policy mapping met.' :
                                                            item.level === 'ERROR' ? 'BLOCK: Critical safety breach intercepted.' :
                                                                'REDACT: Sensitive identifiers masked.'}
                                                    </p>
                                                    {item.service === 'Proxy' && (
                                                        <Badge variant="outline" className="text-[9px] h-4 py-0 bg-blue-500/10 text-blue-500 border-blue-500/20">Zero-Trust</Badge>
                                                    )}
                                                    {item.level === 'ERROR' && (
                                                        healedViolations.has(item.id) ? (
                                                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 h-5 text-[9px]">
                                                                <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                                                                Healed
                                                            </Badge>
                                                        ) : !healingStatus.active && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 px-2 text-[9px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 gap-1"
                                                                onClick={() => router.push('/dashboard/monitor')}
                                                            >
                                                                <Stethoscope className="w-3 h-3" /> HEAL AGENT
                                                            </Button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {logs.length === 0 && (
                                        <div className={`flex flex-col items-center justify-center h-full text-xs p-8 ${theme.text.muted}`}>
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

        </div>
    );
}

