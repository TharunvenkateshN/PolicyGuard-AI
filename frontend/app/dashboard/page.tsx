"use client"

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
    ShieldCheck, Activity, Zap, AlertTriangle, TrendingUp,
    Database, FileText, GitBranch, Flame, Download,
    Bell, BellOff, Sun, Moon, ArrowUp, ArrowDown,
    CheckCircle2, XCircle, Clock, Globe, Cpu
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import Link from 'next/link';

// ── Static AML metrics ────────────────────────────────────────
const AREA_DATA = [
    { t: '00h', flagged: 4, cleared: 4 },
    { t: '03h', flagged: 2, cleared: 2 },
    { t: '06h', flagged: 7, cleared: 6 },
    { t: '09h', flagged: 18, cleared: 14 },
    { t: '12h', flagged: 31, cleared: 24 },
    { t: '15h', flagged: 26, cleared: 21 },
    { t: '18h', flagged: 14, cleared: 12 },
    { t: '21h', flagged: 9, cleared: 8 },
];

const VIOLATION_DIST = [
    { name: 'CTR Threshold', value: 38, color: '#1aff8c' },
    { name: 'Structuring', value: 27, color: '#f59e0b' },
    { name: 'Cross-Border', value: 21, color: '#3b82f6' },
    { name: 'PII Exposure', value: 9, color: '#ef4444' },
    { name: 'Ghost Account', value: 5, color: '#8b5cf6' },
];

const SCAN_BARS = [
    { h: 'Mon', scans: 1240, violations: 31 },
    { h: 'Tue', scans: 980, violations: 19 },
    { h: 'Wed', scans: 1580, violations: 52 },
    { h: 'Thu', scans: 2100, violations: 67 },
    { h: 'Fri', scans: 1760, violations: 48 },
    { h: 'Sat', scans: 640, violations: 12 },
    { h: 'Sun', scans: 420, violations: 8 },
];

const LIVE_FEED: { time: string; msg: string; level: 'success' | 'warn' | 'error' | 'info'; id: string }[] = [
    { id: 'L1', time: '19:21:44', level: 'error', msg: '[BLOCK] AML-R02 · Structuring detected — ACC-8912 · $1,800×4 in 6h' },
    { id: 'L2', time: '19:21:02', level: 'warn', msg: '[WARN] AML-R05 · Tax-haven route detected — SWIFT: BOFIUS3N→KY' },
    { id: 'L3', time: '19:20:18', level: 'success', msg: '[PASS] 482 records scanned · 0 violations in last batch' },
    { id: 'L4', time: '19:19:55', level: 'error', msg: '[BLOCK] AML-R01 · CTR threshold exceeded — $14,200 wire · ACC-6671' },
    { id: 'L5', time: '19:19:11', level: 'info', msg: '[SYNC] N2L rules refreshed — 6 rules active' },
    { id: 'L6', time: '19:18:44', level: 'success', msg: '[PASS] Gemini synthesis complete — BSA §1010.310 → AML-R01 v3.2' },
    { id: 'L7', time: '19:17:30', level: 'warn', msg: '[WARN] AML-R04 · PII field unencrypted — ACC-3345' },
    { id: 'L8', time: '19:16:55', level: 'error', msg: '[BLOCK] AML-R03 · Cross-border flag — DE→US $6,700' },
    { id: 'L9', time: '19:16:00', level: 'info', msg: '[INFO] Database Sentinel heartbeat OK · IBM AML dataset online' },
];

const QUICK_LINKS = [
    { label: 'Database Sentinel', desc: 'Run AML scan', href: '/dashboard/sentinel', icon: Database, color: 'text-[#1aff8c]' },
    { label: 'Policy Vault', desc: 'Ingest regulation PDF', href: '/dashboard/policies', icon: FileText, color: 'text-blue-400' },
    { label: 'Rule Audit Log', desc: 'View N2L rules', href: '/dashboard/evaluate', icon: GitBranch, color: 'text-purple-400' },
    { label: 'Adversarial Hub', desc: 'Red team AML rules', href: '/dashboard/redteam', icon: Flame, color: 'text-orange-400' },
    { label: 'Violation Nexus', desc: 'Review & remediate', href: '/dashboard/remediate', icon: AlertTriangle, color: 'text-red-400' },
    { label: 'AML Analytics', desc: 'Trends & heatmaps', href: '/dashboard/sla', icon: TrendingUp, color: 'text-amber-400' },
];

const KPI = [
    {
        label: 'AML Trust Score', value: '94.2%', delta: '+2.5%', up: true,
        icon: ShieldCheck, color: 'text-[#1aff8c]', glow: 'rgba(26,255,140,0.15)'
    },
    {
        label: 'Records Scanned', value: '8,720', delta: '+12% today', up: true,
        icon: Database, color: 'text-blue-400', glow: 'rgba(59,130,246,0.12)'
    },
    {
        label: 'Violations Blocked', value: '237', delta: '2.7% block rate', up: false,
        icon: AlertTriangle, color: 'text-red-400', glow: 'rgba(239,68,68,0.12)'
    },
    {
        label: 'Avg Scan Latency', value: '84ms', delta: '99.9% uptime', up: true,
        icon: Zap, color: 'text-amber-400', glow: 'rgba(245,158,11,0.12)'
    },
];

const TOOLTIP_STYLE = {
    backgroundColor: '#0d1310',
    border: '1px solid rgba(26,255,140,0.15)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '12px',
};

const LEVEL_STYLE = {
    success: 'text-[#1aff8c]',
    error: 'text-red-400',
    warn: 'text-amber-400',
    info: 'text-[rgba(26,255,140,0.4)]',
};

const LEVEL_PREFIX = {
    success: '✓',
    error: '✕',
    warn: '⚠',
    info: '›',
};

const TABS = ['Overview', 'Analytics', 'Live Feed'];

export default function OverviewPage() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('Overview');
    const [notif, setNotif] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    return (
        <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="sentinel-badge">Active Sentinel</span>
                        <span className="text-xs text-muted-foreground font-mono">IBM AML · 6 rules live</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Real-time AML compliance oversight — powered by Lexinel's N2L enforcement engine.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Tabs */}
                    <div className="flex bg-[rgba(26,255,140,0.04)] border border-[rgba(26,255,140,0.1)] p-0.5 rounded-lg">
                        {TABS.map(t => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === t
                                    ? 'bg-[#1aff8c] text-[#070c0a]'
                                    : 'text-muted-foreground hover:text-foreground'}`}>
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* Notification toggle */}
                    <button
                        onClick={async () => {
                            if (!notif) {
                                const p = await Notification.requestPermission();
                                if (p === 'granted') setNotif(true);
                            } else {
                                setNotif(false);
                            }
                        }}
                        className={`p-2 rounded-lg border transition-all ${notif
                            ? 'border-[rgba(26,255,140,0.3)] text-[#1aff8c] bg-[rgba(26,255,140,0.08)]'
                            : 'border-border text-muted-foreground hover:border-[rgba(26,255,140,0.2)]'}`}
                        title={notif ? 'Notifications active' : 'Enable notifications'}
                    >
                        {notif ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    </button>

                    {/* Theme toggle */}
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-lg border border-border text-muted-foreground hover:border-[rgba(26,255,140,0.2)] transition-all"
                        >
                            {theme === 'dark'
                                ? <Sun className="w-4 h-4" />
                                : <Moon className="w-4 h-4" />}
                        </button>
                    )}

                    {/* Export */}
                    <button
                        onClick={() => alert('Export coming soon — connect backend to enable PDF dossier.')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-[#070c0a] transition-all"
                        style={{ background: '#1aff8c', boxShadow: '0 0 16px rgba(26,255,140,0.3)' }}
                    >
                        <Download className="w-3.5 h-3.5" /> Export Dossier
                    </button>
                </div>
            </div>

            {/* ── KPI Cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {KPI.map((k, i) => (
                    <div key={i} className="glass-card rounded-xl p-4"
                        style={{ boxShadow: `0 0 20px ${k.glow}, inset 0 0 20px ${k.glow}` }}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">{k.label}</p>
                            <k.icon className={`w-4 h-4 ${k.color}`} />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{k.value}</p>
                        <p className={`text-xs flex items-center gap-1 mt-1 ${k.up ? 'text-[#1aff8c]' : 'text-muted-foreground'}`}>
                            {k.up ? <ArrowUp className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                            {k.delta}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── OVERVIEW TAB ───────────────────────────────────── */}
            {activeTab === 'Overview' && (
                <>
                    {/* Quick links */}
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Quick Navigation</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {QUICK_LINKS.map((q, i) => (
                                <Link key={i} href={q.href}
                                    className="glass-card rounded-xl p-3.5 flex flex-col gap-2 hover:border-[rgba(26,255,140,0.25)] transition-all group">
                                    <q.icon className={`w-5 h-5 ${q.color} group-hover:scale-110 transition-transform`} />
                                    <div>
                                        <p className="text-sm font-bold text-foreground leading-tight">{q.label}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{q.desc}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* System status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'N2L Engine', status: 'ONLINE', icon: Cpu },
                            { label: 'IBM AML Dataset', status: 'ONLINE', icon: Database },
                            { label: 'Gemini 2.5 Pro', status: 'ONLINE', icon: GitBranch },
                            { label: 'FinCEN SAR API', status: 'PENDING', icon: Globe },
                        ].map((s, i) => (
                            <div key={i} className="glass-card rounded-xl p-4 flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === 'ONLINE' ? 'bg-[#1aff8c] shadow-[0_0_6px_#1aff8c]' : 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]'}`} />
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{s.label}</p>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${s.status === 'ONLINE' ? 'text-[#1aff8c]' : 'text-amber-400'}`}>{s.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ── ANALYTICS TAB ──────────────────────────────────── */}
            {activeTab === 'Analytics' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Hourly flag/clear area chart */}
                    <div className="lg:col-span-2 glass-card rounded-xl p-5">
                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#1aff8c]" /> 24h Violation Trend
                        </h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={AREA_DATA}>
                                <defs>
                                    <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1aff8c" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#1aff8c" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,255,140,0.06)" />
                                <XAxis dataKey="t" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Area type="monotone" dataKey="flagged" stroke="#1aff8c" fill="url(#fg)" strokeWidth={2} name="Flagged" />
                                <Area type="monotone" dataKey="cleared" stroke="#3b82f6" fill="url(#cg)" strokeWidth={2} name="Cleared" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Violation type pie */}
                    <div className="glass-card rounded-xl p-5">
                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#1aff8c]" /> By Violation Type
                        </h3>
                        <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                                <Pie data={VIOLATION_DIST} cx="50%" cy="50%" innerRadius={42} outerRadius={68}
                                    paddingAngle={3} dataKey="value">
                                    {VIOLATION_DIST.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5 mt-2">
                            {VIOLATION_DIST.map((v, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: v.color }} />
                                        <span className="text-muted-foreground">{v.name}</span>
                                    </span>
                                    <span className="font-bold text-foreground">{v.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weekly scan bar */}
                    <div className="lg:col-span-3 glass-card rounded-xl p-5">
                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                            <Database className="w-4 h-4 text-[#1aff8c]" /> Weekly Scan Volume vs Violations
                        </h3>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={SCAN_BARS}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,255,140,0.06)" />
                                <XAxis dataKey="h" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Bar dataKey="scans" fill="rgba(26,255,140,0.25)" radius={[3, 3, 0, 0]} name="Records Scanned" />
                                <Bar dataKey="violations" fill="#1aff8c" radius={[3, 3, 0, 0]} name="Violations" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ── LIVE FEED TAB ───────────────────────────────────── */}
            {activeTab === 'Live Feed' && (
                <div className="glass-card rounded-xl overflow-hidden">
                    {/* Terminal header */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-[#030806] border-b border-[rgba(26,255,140,0.08)]">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#1aff8c]/60" />
                        </div>
                        <span className="text-[10px] font-mono text-[rgba(26,255,140,0.4)] ml-2">lexinel.sentinel — live-enforcement-stream</span>
                        <div className="ml-auto flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#1aff8c] animate-pulse" />
                            <span className="text-[10px] text-[#1aff8c] font-mono">LIVE</span>
                        </div>
                    </div>

                    {/* Feed entries */}
                    <div className="bg-[#030806] font-mono text-xs divide-y divide-[rgba(26,255,140,0.04)]">
                        {LIVE_FEED.map(e => (
                            <div key={e.id} className="flex items-start gap-3 px-5 py-2.5 hover:bg-[rgba(26,255,140,0.02)] transition-colors">
                                <span className="text-[rgba(26,255,140,0.3)] flex-shrink-0 w-16">{e.time}</span>
                                <span className={`flex-shrink-0 ${LEVEL_STYLE[e.level]}`}>{LEVEL_PREFIX[e.level]}</span>
                                <span className={LEVEL_STYLE[e.level]}>{e.msg}</span>
                            </div>
                        ))}
                    </div>

                    <div className="px-5 py-3 bg-[#030806] border-t border-[rgba(26,255,140,0.08)] text-center">
                        <Link href="/dashboard/monitor"
                            className="text-xs text-[#1aff8c] font-bold hover:text-[#0de87a] transition-colors">
                            → Open Full Live Scan Feed
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
