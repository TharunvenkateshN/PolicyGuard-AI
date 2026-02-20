"use client"

import { useState, useEffect, useRef } from 'react';
import { Activity, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Clock, Database, Filter } from 'lucide-react';

// ── Static initial feed (no backend needed) ────────────────────
const INITIAL_FEED = [
    { id: 'T001', ts: '19:21:44', agent: 'IBM-AML-Scanner', rule: 'AML-R02', action: 'Structuring Detected', status: 'block', details: 'ACC-8912 · $1,800×4 txns in 6h window' },
    { id: 'T002', ts: '19:21:02', agent: 'IBM-AML-Scanner', rule: 'AML-R05', action: 'Tax-Haven Route', status: 'warn', details: 'SWIFT: BOFIUS3N → KY · $3,400' },
    { id: 'T003', ts: '19:20:18', agent: 'IBM-AML-Scanner', rule: 'ALL', action: 'Batch Scan', status: 'pass', details: '482 records clean · 0 violations' },
    { id: 'T004', ts: '19:19:55', agent: 'IBM-AML-Scanner', rule: 'AML-R01', action: 'CTR Threshold', status: 'block', details: 'ACC-6671 · $14,200 wire transfer' },
    { id: 'T005', ts: '19:19:11', agent: 'N2L-Engine', rule: 'SYNC', action: 'Rule Refresh', status: 'pass', details: '6 rules active · Gemini synthesis OK' },
    { id: 'T006', ts: '19:18:44', agent: 'IBM-AML-Scanner', rule: 'AML-R04', action: 'PII Exposure', status: 'warn', details: 'ACC-3345 · SSN field unencrypted in audit log' },
    { id: 'T007', ts: '19:17:30', agent: 'IBM-AML-Scanner', rule: 'AML-R03', action: 'Cross-Border Flag', status: 'block', details: 'DE→US · $6,700 · no correspondent bank' },
    { id: 'T008', ts: '19:16:00', agent: 'N2L-Engine', rule: 'HEARTBEAT', action: 'Sentinel Heartbeat', status: 'pass', details: 'IBM AML dataset online · 8,720 records indexed' },
    { id: 'T009', ts: '19:15:12', agent: 'IBM-AML-Scanner', rule: 'AML-R05', action: 'Tax-Haven Route', status: 'block', details: 'ACC-1120 · CH bank · $8,000 layering pattern' },
    { id: 'T010', ts: '19:14:44', agent: 'IBM-AML-Scanner', rule: 'AML-R01', action: 'CTR Threshold', status: 'block', details: 'ACC-7789 · $22,000 cash deposit' },
    { id: 'T011', ts: '19:14:01', agent: 'IBM-AML-Scanner', rule: 'ALL', action: 'Batch Scan', status: 'pass', details: '511 records clean · 0 violations' },
    { id: 'T012', ts: '19:13:20', agent: 'IBM-AML-Scanner', rule: 'AML-R02', action: 'Structuring Detected', status: 'warn', details: 'ACC-2290 · $1,900×3 txns over 4h' },
];

// Simulated new entries injected every few seconds
const SIMULATED_NEW = [
    { rule: 'AML-R01', action: 'CTR Threshold', status: 'block' as const, details: 'ACC-XXXX · $15,000+ wire detected' },
    { rule: 'AML-R03', action: 'Cross-Border Flag', status: 'warn' as const, details: 'RU→US · $4,800 · high-risk jurisdiction' },
    { rule: 'ALL', action: 'Batch Scan', status: 'pass' as const, details: '398 records clean · 0 violations' },
    { rule: 'AML-R04', action: 'PII Exposure', status: 'block' as const, details: 'ACC-XXXX · unencrypted PII in payload' },
    { rule: 'AML-R02', action: 'Structuring', status: 'warn' as const, details: 'ACC-XXXX · $1,950×3 txns in 8h' },
];

const STATUS = {
    pass: { label: 'PASS', cls: 'text-[#1aff8c] bg-[rgba(26,255,140,0.08)] border-[rgba(26,255,140,0.25)]' },
    warn: { label: 'WARN', cls: 'text-amber-400 bg-amber-950/30 border-amber-700/40' },
    block: { label: 'BLOCK', cls: 'text-red-400 bg-red-950/30 border-red-700/40' },
};

const FILTERS = ['ALL', 'BLOCK', 'WARN', 'PASS'];

let idCounter = 100;
function makeId() { return `T${String(++idCounter).padStart(3, '0')}`; }
function nowTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

export default function MonitorPage() {
    const [feed, setFeed] = useState(INITIAL_FEED);
    const [filter, setFilter] = useState<'ALL' | 'BLOCK' | 'WARN' | 'PASS'>('ALL');
    const [paused, setPaused] = useState(false);
    const pausedRef = useRef(paused);
    pausedRef.current = paused;

    // Simulate new entries every 4–7 seconds
    useEffect(() => {
        const tick = () => {
            if (pausedRef.current) return;
            const template = SIMULATED_NEW[Math.floor(Math.random() * SIMULATED_NEW.length)];
            const id = makeId();
            const acc = `ACC-${Math.floor(1000 + Math.random() * 8999)}`;
            const entry = {
                id,
                ts: nowTime(),
                agent: template.rule === 'ALL' || template.rule === 'SYNC' || template.rule === 'HEARTBEAT' ? 'N2L-Engine' : 'IBM-AML-Scanner',
                rule: template.rule,
                action: template.action,
                status: template.status,
                details: template.details.replace('XXXX', acc.split('-')[1]),
            };
            setFeed(prev => [entry, ...prev].slice(0, 60)); // keep max 60
        };
        const interval = setInterval(tick, 4000 + Math.random() * 3000);
        return () => clearInterval(interval);
    }, []);

    const filtered = filter === 'ALL' ? feed : feed.filter(e => e.status === filter.toLowerCase());
    const blocked = feed.filter(e => e.status === 'block').length;
    const warned = feed.filter(e => e.status === 'warn').length;
    const passed = feed.filter(e => e.status === 'pass').length;

    return (
        <div className="space-y-6 pb-16">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-lg bg-[rgba(26,255,140,0.1)] border border-[rgba(26,255,140,0.2)]">
                            <Activity className="w-5 h-5 text-[#1aff8c]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Live Scan Feed</h1>
                            <p className="text-[rgba(26,255,140,0.5)] text-xs tracking-widest uppercase">IBM AML Dataset · Real-time Enforcement Stream</p>
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1 max-w-xl">
                        Every record scanned by Lexinel's enforcement engine appears here in real-time. Violations are automatically flagged against N2L-synthesized AML rules.
                    </p>
                </div>

                {/* Live indicator + pause */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[rgba(26,255,140,0.25)] bg-[rgba(26,255,140,0.06)]">
                        <div className={`w-1.5 h-1.5 rounded-full ${paused ? 'bg-amber-400' : 'bg-[#1aff8c] animate-pulse'}`} />
                        <span className="text-xs font-bold text-[#1aff8c] font-mono uppercase">{paused ? 'PAUSED' : 'LIVE'}</span>
                    </div>
                    <button onClick={() => setPaused(p => !p)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${paused
                            ? 'border-[rgba(26,255,140,0.3)] text-[#1aff8c] bg-[rgba(26,255,140,0.08)]'
                            : 'border-border text-muted-foreground hover:border-[rgba(26,255,140,0.2)]'}`}>
                        {paused ? '▶ Resume' : '⏸ Pause'}
                    </button>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Blocked', value: blocked, icon: XCircle, color: 'text-red-400', glow: 'rgba(239,68,68,0.1)' },
                    { label: 'Warnings', value: warned, icon: AlertTriangle, color: 'text-amber-400', glow: 'rgba(245,158,11,0.1)' },
                    { label: 'Passed', value: passed, icon: CheckCircle2, color: 'text-[#1aff8c]', glow: 'rgba(26,255,140,0.1)' },
                    { label: 'Total Entries', value: feed.length, icon: Database, color: 'text-blue-400', glow: 'rgba(59,130,246,0.1)' },
                ].map((k, i) => (
                    <div key={i} className="glass-card rounded-xl p-4" style={{ boxShadow: `0 0 16px ${k.glow}` }}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{k.label}</p>
                            <k.icon className={`w-4 h-4 ${k.color}`} />
                        </div>
                        <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                    </div>
                ))}
            </div>

            {/* Feed table */}
            <div className="glass-card rounded-xl overflow-hidden">
                {/* Terminal bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#030806] border-b border-[rgba(26,255,140,0.08)]">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#1aff8c]/60" />
                        </div>
                        <span className="text-[10px] font-mono text-[rgba(26,255,140,0.4)]">lexinel.sentinel — enforcement-stream</span>
                    </div>
                    {/* Filter pills */}
                    <div className="flex gap-1">
                        {FILTERS.map(f => (
                            <button key={f} onClick={() => setFilter(f as typeof filter)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${filter === f ? 'bg-[#1aff8c] text-[#070c0a]' : 'text-muted-foreground hover:text-foreground'}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-[rgba(26,255,140,0.08)] bg-[rgba(26,255,140,0.02)]">
                                {['Time', 'ID', 'Agent', 'Rule', 'Action', 'Status', 'Details'].map(h => (
                                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(26,255,140,0.04)] font-mono">
                            {filtered.map((e, i) => {
                                const s = STATUS[e.status];
                                return (
                                    <tr key={e.id}
                                        className={`hover:bg-[rgba(26,255,140,0.02)] transition-colors ${i === 0 && !paused ? 'animate-pulse-row' : ''}`}>
                                        <td className="px-4 py-2.5 text-[rgba(26,255,140,0.4)]">{e.ts}</td>
                                        <td className="px-4 py-2.5 text-[rgba(26,255,140,0.6)]">{e.id}</td>
                                        <td className="px-4 py-2.5 text-foreground">{e.agent}</td>
                                        <td className="px-4 py-2.5 text-blue-400">{e.rule}</td>
                                        <td className="px-4 py-2.5 text-foreground/70">{e.action}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${s.cls}`}>{s.label}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-muted-foreground max-w-xs truncate">{e.details}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="px-4 py-3 bg-[#030806] border-t border-[rgba(26,255,140,0.08)] text-center">
                    <span className="text-[10px] text-[rgba(26,255,140,0.3)] font-mono">
                        {filtered.length} entries · {paused ? 'Stream paused' : 'Auto-refreshing every ~4s'}
                    </span>
                </div>
            </div>
        </div>
    );
}
