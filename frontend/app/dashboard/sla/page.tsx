"use client"

import { useState } from 'react';
import {
    TrendingUp, BarChart3, Globe, AlertTriangle,
    ShieldCheck, Activity, ArrowUp, ArrowDown,
    Calendar, Filter
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// ── Static IBM AML dataset-derived analytics ──────────────────
const WEEKLY_VIOLATIONS = [
    { day: 'Mon', violations: 12, cleared: 8, amount: 142000 },
    { day: 'Tue', violations: 19, cleared: 14, amount: 380000 },
    { day: 'Wed', violations: 8, cleared: 8, amount: 95000 },
    { day: 'Thu', violations: 31, cleared: 22, amount: 821000 },
    { day: 'Fri', violations: 27, cleared: 18, amount: 612000 },
    { day: 'Sat', violations: 6, cleared: 5, amount: 88000 },
    { day: 'Sun', violations: 4, cleared: 4, amount: 44000 },
];

const VIOLATION_BY_TYPE = [
    { name: 'CTR Threshold', value: 38, color: '#1aff8c' },
    { name: 'Structuring', value: 27, color: '#f59e0b' },
    { name: 'Cross-Border', value: 21, color: '#3b82f6' },
    { name: 'PII Exposure', value: 9, color: '#ef4444' },
    { name: 'Ghost Account', value: 5, color: '#8b5cf6' },
];

const JURISDICTION_RISK = [
    { region: 'RU→US', risk: 94, txns: 47, amount: '$2.1M' },
    { region: 'KY→CH', risk: 89, txns: 23, amount: '$4.8M' },
    { region: 'DE→US', risk: 67, txns: 61, amount: '$890K' },
    { region: 'CN→US', risk: 72, txns: 38, amount: '$1.3M' },
    { region: 'MX→US', risk: 51, txns: 84, amount: '$670K' },
    { region: 'GB→US', risk: 28, txns: 112, amount: '$340K' },
];

const HOURLY_SCAN = [
    { hour: '00', scans: 142 }, { hour: '03', scans: 88 },
    { hour: '06', scans: 210 }, { hour: '09', scans: 481 },
    { hour: '12', scans: 623 }, { hour: '15', scans: 558 },
    { hour: '18', scans: 392 }, { hour: '21', scans: 247 },
];

const KPI = [
    { label: 'Total Flagged', value: '107', delta: '+12%', up: true, icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Auto-Cleared', value: '79', delta: '+8%', up: true, icon: ShieldCheck, color: 'text-[#1aff8c]' },
    { label: 'Avg Risk Score', value: '68.4', delta: '-3.1', up: false, icon: Activity, color: 'text-amber-400' },
    { label: 'Amount at Risk', value: '$2.18M', delta: '+$420K', up: true, icon: TrendingUp, color: 'text-blue-400' },
];

const CUSTOM_TOOLTIP_STYLE = {
    backgroundColor: '#0d1310',
    border: '1px solid rgba(26,255,140,0.15)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '12px',
};

const RANGES = ['7D', '30D', '90D'];

export default function AMLAnalyticsPage() {
    const [range, setRange] = useState('7D');

    const riskColor = (r: number) =>
        r >= 80 ? 'text-red-400' : r >= 60 ? 'text-amber-400' : 'text-[#1aff8c]';

    const riskBg = (r: number) =>
        r >= 80 ? 'bg-red-950/40 border-red-800/40' : r >= 60 ? 'bg-amber-950/40 border-amber-800/40' : 'bg-[rgba(26,255,140,0.06)] border-[rgba(26,255,140,0.2)]';

    return (
        <div className="space-y-6 pb-16">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-lg bg-[rgba(26,255,140,0.1)] border border-[rgba(26,255,140,0.2)]">
                            <BarChart3 className="w-5 h-5 text-[#1aff8c]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">AML Risk Analytics</h1>
                            <p className="text-[rgba(26,255,140,0.5)] text-xs tracking-widest uppercase">IBM AML Dataset · Live Violation Intelligence</p>
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-xl mt-1">
                        Real-time trends and risk intelligence derived from Lexinel's continuous scan of the IBM Anti-Money Laundering transaction dataset.
                    </p>
                </div>
                <div className="flex gap-1 glass-card rounded-lg p-1">
                    {RANGES.map(r => (
                        <button key={r} onClick={() => setRange(r)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${range === r ? 'bg-[#1aff8c] text-[#070c0a]' : 'text-muted-foreground hover:text-foreground'}`}>
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {KPI.map((k, i) => (
                    <div key={i} className="glass-card rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">{k.label}</p>
                            <k.icon className={`w-4 h-4 ${k.color}`} />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{k.value}</p>
                        <p className={`text-xs flex items-center gap-0.5 mt-1 ${k.up ? 'text-[#1aff8c]' : 'text-red-400'}`}>
                            {k.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {k.delta} this week
                        </p>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly violations area chart */}
                <div className="lg:col-span-2 glass-card rounded-xl p-5">
                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#1aff8c]" /> Weekly Violation Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={WEEKLY_VIOLATIONS}>
                            <defs>
                                <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1aff8c" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#1aff8c" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,255,140,0.06)" />
                            <XAxis dataKey="day" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                            <Area type="monotone" dataKey="violations" stroke="#1aff8c" fill="url(#vGrad)" strokeWidth={2} name="Flagged" />
                            <Area type="monotone" dataKey="cleared" stroke="#3b82f6" fill="url(#cGrad)" strokeWidth={2} name="Cleared" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Violation type pie */}
                <div className="glass-card rounded-xl p-5">
                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[#1aff8c]" /> By Violation Type
                    </h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie data={VIOLATION_BY_TYPE} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                                paddingAngle={3} dataKey="value">
                                {VIOLATION_BY_TYPE.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                        {VIOLATION_BY_TYPE.map((v, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ background: v.color }} />
                                    <span className="text-muted-foreground">{v.name}</span>
                                </span>
                                <span className="font-bold text-foreground">{v.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hourly scan volume */}
                <div className="glass-card rounded-xl p-5">
                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#1aff8c]" /> Hourly Scan Volume (24h)
                    </h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={HOURLY_SCAN}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,255,140,0.06)" />
                            <XAxis dataKey="hour" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}h`} />
                            <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                            <Bar dataKey="scans" fill="#1aff8c" opacity={0.85} radius={[3, 3, 0, 0]} name="Records Scanned" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Jurisdiction risk table */}
                <div className="glass-card rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[rgba(26,255,140,0.08)] flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#1aff8c]" />
                        <h3 className="text-sm font-bold text-foreground">Jurisdiction Risk Heatmap</h3>
                    </div>
                    <div className="divide-y divide-[rgba(26,255,140,0.06)]">
                        {JURISDICTION_RISK.map((j, i) => (
                            <div key={i} className="flex items-center gap-3 px-5 py-3">
                                <span className="text-xs font-mono font-bold text-foreground w-16">{j.region}</span>
                                <div className="flex-1 bg-[rgba(255,255,255,0.05)] rounded-full h-1.5 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${j.risk >= 80 ? 'bg-red-500' : j.risk >= 60 ? 'bg-amber-500' : 'bg-[#1aff8c]'}`}
                                        style={{ width: `${j.risk}%` }} />
                                </div>
                                <span className={`text-xs font-bold w-8 text-right ${riskColor(j.risk)}`}>{j.risk}</span>
                                <span className="text-xs text-muted-foreground w-14 text-right font-mono">{j.amount}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
