"use client"

import { useState } from 'react';
import {
    GitBranch, CheckCircle2, Clock, Code2,
    ChevronDown, ChevronRight, Download, Eye,
    Database, FileText, Layers, Cpu, Filter
} from 'lucide-react';

const RULE_HISTORY = [
    {
        id: 'AML-R01', clause: 'BSA §1010.310', policy: 'BSA / FinCEN AML Policy',
        synthesized: '2024-01-15 09:12', status: 'DEPLOYED', version: 'v3.2',
        logic: 'amount > 10000 AND type IN (TRANSFER, WIRE)',
        label: 'CTR Threshold', hits7d: 47, hitRate: '94%'
    },
    {
        id: 'AML-R02', clause: 'FATF Rec. 10', policy: 'FATF 40 Recommendations',
        synthesized: '2024-01-15 09:14', status: 'DEPLOYED', version: 'v2.1',
        logic: 'COUNT(same_beneficiary_24h) >= 3 AND amount < 2000',
        label: 'Structuring / Smurfing', hits7d: 23, hitRate: '87%'
    },
    {
        id: 'AML-R03', clause: 'FinCEN 103.29', policy: 'BSA / FinCEN AML Policy',
        synthesized: '2024-01-15 09:16', status: 'DEPLOYED', version: 'v1.8',
        logic: 'cross_border = true AND amount > 5000',
        label: 'Cross-Border Flag', hits7d: 31, hitRate: '91%'
    },
    {
        id: 'AML-R04', clause: 'GDPR Art. 5', policy: 'EU AMLD6 Framework',
        synthesized: '2024-01-15 09:18', status: 'PENDING', version: 'v1.0',
        logic: 'pii_encrypted = false',
        label: 'PII Exposure Guard', hits7d: 9, hitRate: '100%'
    },
    {
        id: 'AML-R05', clause: 'AMLD6 Art. 3(4)', policy: 'EU AMLD6 Framework',
        synthesized: '2024-01-14 14:32', status: 'DEPLOYED', version: 'v2.4',
        logic: 'jurisdiction IN (KY, CH, LU, BVI) AND amount > 3000',
        label: 'Tax Haven Routing', hits7d: 18, hitRate: '96%'
    },
    {
        id: 'AML-R06', clause: 'FATF Rec. 16', policy: 'FATF 40 Recommendations',
        synthesized: '2024-01-14 14:35', status: 'DEPRECATED', version: 'v1.1',
        logic: 'wire_transfer = true AND correspondent_bank_unknown = true',
        label: 'Correspondent Risk', hits7d: 0, hitRate: 'N/A'
    },
];

const SYNTHESIS_EVENTS = [
    { time: '09:18', event: 'AML-R04 synthesized from EU AMLD6 · pending review', type: 'warn' },
    { time: '09:16', event: 'AML-R03 v1.8 deployed to Database Sentinel', type: 'success' },
    { time: '09:14', event: 'AML-R02 v2.1 deployed — smurfing threshold tightened', type: 'success' },
    { time: '09:12', event: 'AML-R01 v3.2 deployed — CTR amount updated $10,000', type: 'success' },
    { time: '14:35 (Jan 14)', event: 'AML-R06 deprecated — superseded by AML-R03', type: 'info' },
    { time: '14:32 (Jan 14)', event: 'AML-R05 v2.4 deployed — tax haven jurisdiction list expanded', type: 'success' },
];

const STATUS_STYLE: Record<string, string> = {
    DEPLOYED: 'text-[#1aff8c] bg-[rgba(26,255,140,0.08)] border-[rgba(26,255,140,0.25)]',
    PENDING: 'text-amber-400 bg-amber-950/30 border-amber-800/40',
    DEPRECATED: 'text-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.1)]',
};

const LOG_STYLE: Record<string, string> = {
    success: 'text-[#1aff8c]',
    warn: 'text-amber-400',
    info: 'text-[rgba(26,255,140,0.5)]',
};

export default function RuleAuditPage() {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'DEPLOYED' | 'PENDING' | 'DEPRECATED'>('ALL');

    const filtered = RULE_HISTORY.filter(r => filter === 'ALL' || r.status === filter);

    return (
        <div className="space-y-6 pb-16">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-lg bg-[rgba(26,255,140,0.1)] border border-[rgba(26,255,140,0.2)]">
                        <GitBranch className="w-5 h-5 text-[#1aff8c]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Rule Audit Log</h1>
                        <p className="text-[rgba(26,255,140,0.5)] text-xs tracking-widest uppercase">N2L Synthesized Rules · Deployment History</p>
                    </div>
                </div>
                <p className="text-muted-foreground text-sm max-w-xl mt-1">
                    Full history of every enforcement rule synthesized by Lexinel's N2L engine. Track deployments, version changes, hit rates, and clause provenance.
                </p>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Rules', value: RULE_HISTORY.length, icon: Layers },
                    { label: 'Deployed', value: RULE_HISTORY.filter(r => r.status === 'DEPLOYED').length, icon: CheckCircle2 },
                    { label: 'Pending Review', value: RULE_HISTORY.filter(r => r.status === 'PENDING').length, icon: Clock },
                    { label: 'Policies Ingested', value: 3, icon: FileText },
                ].map((s, i) => (
                    <div key={i} className="glass-card rounded-xl p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[rgba(26,255,140,0.08)]">
                            <s.icon className="w-4 h-4 text-[#1aff8c]" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-foreground">{s.value}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Rule Table */}
                <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(26,255,140,0.08)]">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Code2 className="w-4 h-4 text-[#1aff8c]" /> Enforcement Rules
                        </h3>
                        <div className="flex gap-1">
                            {(['ALL', 'DEPLOYED', 'PENDING', 'DEPRECATED'] as const).map(f => (
                                <button key={f} onClick={() => setFilter(f)}
                                    className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${filter === f ? 'bg-[#1aff8c] text-[#070c0a]' : 'text-muted-foreground hover:text-foreground'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="divide-y divide-[rgba(26,255,140,0.06)]">
                        {filtered.map(rule => (
                            <div key={rule.id}>
                                <button
                                    onClick={() => setExpanded(expanded === rule.id ? null : rule.id)}
                                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[rgba(26,255,140,0.03)] transition-all text-left"
                                >
                                    <div className="w-1.5 h-10 rounded-full flex-shrink-0"
                                        style={{ background: rule.status === 'DEPLOYED' ? '#1aff8c' : rule.status === 'PENDING' ? '#f59e0b' : 'rgba(255,255,255,0.15)' }} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-bold font-mono text-[#1aff8c]">{rule.id}</span>
                                            <span className="text-xs text-muted-foreground border border-[rgba(26,255,140,0.15)] rounded px-1.5 py-0.5">{rule.clause}</span>
                                        </div>
                                        <p className="text-xs text-foreground/70 truncate">{rule.label}</p>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-xs text-muted-foreground hidden sm:block font-mono">{rule.version}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_STYLE[rule.status]}`}>{rule.status}</span>
                                        <span className="text-xs text-muted-foreground hidden sm:block">{rule.hits7d} hits/7d</span>
                                        {expanded === rule.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                </button>

                                {expanded === rule.id && (
                                    <div className="px-5 pb-4 bg-[rgba(26,255,140,0.02)] border-t border-[rgba(26,255,140,0.06)]">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
                                            {[
                                                { l: 'Policy Source', v: rule.policy },
                                                { l: 'Synthesized', v: rule.synthesized },
                                                { l: 'Hit Rate', v: rule.hitRate },
                                                { l: 'Version', v: rule.version },
                                            ].map((f, i) => (
                                                <div key={i} className="bg-[rgba(26,255,140,0.04)] rounded-lg p-2.5 border border-[rgba(26,255,140,0.08)]">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{f.l}</p>
                                                    <p className="text-xs font-medium text-foreground">{f.v}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-[rgba(26,255,140,0.03)] border border-[rgba(26,255,140,0.1)] rounded-lg p-3">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Enforcement Logic</p>
                                            <code className="text-xs font-mono text-amber-300">{rule.logic}</code>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#1aff8c] transition-colors">
                                                <Eye className="w-3.5 h-3.5" /> View in Sentinel
                                            </button>
                                            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#1aff8c] transition-colors ml-3">
                                                <Download className="w-3.5 h-3.5" /> Export Rule
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Synthesis Event Log */}
                <div className="glass-card rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[rgba(26,255,140,0.08)]">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-[#1aff8c]" /> Synthesis Event Log
                        </h3>
                    </div>
                    {/* Terminal */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#030806] border-b border-[rgba(26,255,140,0.06)]">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#1aff8c]/60" />
                        </div>
                        <span className="text-[10px] font-mono text-[rgba(26,255,140,0.4)]">lexinel.n2l — audit-stream</span>
                    </div>
                    <div className="bg-[#030806] p-4 font-mono text-xs space-y-2 h-64 overflow-y-auto">
                        {SYNTHESIS_EVENTS.map((e, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="text-[rgba(26,255,140,0.3)] flex-shrink-0">{e.time}</span>
                                <span className={LOG_STYLE[e.type]}>{e.event}</span>
                            </div>
                        ))}
                    </div>
                    <div className="px-4 py-3 border-t border-[rgba(26,255,140,0.08)]">
                        <button className="w-full text-center text-xs text-[#1aff8c] font-bold hover:text-[#0de87a] transition-colors flex items-center justify-center gap-1.5">
                            <Database className="w-3.5 h-3.5" /> Deploy All Pending Rules
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
