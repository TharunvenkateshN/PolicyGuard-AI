"use client"

import { useState, useEffect, useRef } from 'react';
import {
    Database, Shield, AlertOctagon, CheckCircle2, Activity,
    Zap, Search, FileText, Clock, TrendingUp, ArrowRight,
    RefreshCw, ExternalLink, AlertTriangle, Layers, ScanLine,
    Lock, DollarSign, Users, BarChart3, X, Play, Pause,
    ChevronDown, ChevronUp, Eye, ShieldCheck, Cpu
} from 'lucide-react';

// ─── Simulated IBM AML Records ──────────────────────────────────
const AML_RECORDS = [
    { id: 'TXN-8821', from: 'ACC-4401', to: 'ACC-9977', amount: 14500, type: 'TRANSFER', time: '2024-01-15 03:22', country: 'DE→US', isFlagged: true, label: 'Laundering', risk: 'CRITICAL' },
    { id: 'TXN-4432', from: 'ACC-1102', to: 'ACC-6634', amount: 9800, type: 'CASH_OUT', time: '2024-01-15 03:25', country: 'US', isFlagged: false, label: 'Compliant', risk: 'LOW' },
    { id: 'TXN-2210', from: 'ACC-3301', to: 'ACC-7765', amount: 1990, type: 'TRANSFER', time: '2024-01-15 03:31', country: 'CN→UK', isFlagged: true, label: 'Laundering', risk: 'HIGH' },
    { id: 'TXN-5518', from: 'ACC-8812', to: 'ACC-3345', amount: 500, type: 'PAYMENT', time: '2024-01-15 03:40', country: 'US', isFlagged: false, label: 'Compliant', risk: 'LOW' },
    { id: 'TXN-6643', from: 'ACC-5501', to: 'ACC-9977', amount: 22100, type: 'TRANSFER', time: '2024-01-15 03:45', country: 'RU→US', isFlagged: true, label: 'Laundering', risk: 'CRITICAL' },
    { id: 'TXN-1197', from: 'ACC-2209', to: 'ACC-4478', amount: 3200, type: 'CASH_IN', time: '2024-01-15 04:01', country: 'UK', isFlagged: false, label: 'Compliant', risk: 'LOW' },
    { id: 'TXN-7734', from: 'ACC-6601', to: 'ACC-9977', amount: 1990, type: 'TRANSFER', time: '2024-01-15 04:10', country: 'RU→US', isFlagged: true, label: 'Smurfing', risk: 'HIGH' },
    { id: 'TXN-3320', from: 'ACC-6601', to: 'ACC-9977', amount: 1995, type: 'TRANSFER', time: '2024-01-15 04:22', country: 'RU→US', isFlagged: true, label: 'Smurfing', risk: 'HIGH' },
    { id: 'TXN-9910', from: 'ACC-6601', to: 'ACC-9977', amount: 1980, type: 'TRANSFER', time: '2024-01-15 04:35', country: 'RU→US', isFlagged: true, label: 'Smurfing', risk: 'HIGH' },
    { id: 'TXN-4421', from: 'ACC-7701', to: 'ACC-2234', amount: 8750, type: 'TRANSFER', time: '2024-01-15 04:55', country: 'US', isFlagged: false, label: 'Compliant', risk: 'MEDIUM' },
    { id: 'TXN-8833', from: 'ACC-1103', to: 'ACC-8812', amount: 199500, type: 'WIRE', time: '2024-01-15 05:10', country: 'KY→CH', isFlagged: true, label: 'Laundering', risk: 'CRITICAL' },
    { id: 'TXN-6612', from: 'ACC-9901', to: 'ACC-3310', amount: 1200, type: 'PAYMENT', time: '2024-01-15 05:30', country: 'US', isFlagged: false, label: 'Compliant', risk: 'LOW' },
];

const SYNTHESIZED_RULES = [
    { id: 'AML-R01', clause: 'BSA §1010.310', logic: 'amount > 10000 AND type IN (TRANSFER, WIRE)', label: 'High-Value Threshold', active: true },
    { id: 'AML-R02', clause: 'FATF Rec. 10', logic: 'COUNT(same beneficiary in 24h) >= 3 AND amount < 2000', label: 'Velocity Smurfing', active: true },
    { id: 'AML-R03', clause: 'FinCEN 103.29', logic: 'cross_border = true AND amount > 5000', label: 'Cross-Border Flag', active: true },
    { id: 'AML-R04', clause: 'GDPR Art. 5', logic: 'PII fields unencrypted = true', label: 'PII Exposure', active: false },
];

const SCAN_LOGS = [
    "🔍 Initializing Lexinel Enforcement Kernel v2.4...",
    "📄 Loading synthesized rules from Policy Vault...",
    "🗃️  Connecting to IBM AML Transaction Fabric (12,847 records)...",
    "⚙️  Deploying AML-R01: High-Value Threshold Rule...",
    "⚙️  Deploying AML-R02: Velocity Smurfing Detector...",
    "⚙️  Deploying AML-R03: Cross-Border Flag Rule...",
    "🚀 Active Sentinel deployed. Real-time scanning engaged...",
    "⚡ TXN-8821 → FLAGGED [CRITICAL] Amount: $14,500 violates AML-R01",
    "✅ TXN-4432 → COMPLIANT",
    "⚡ TXN-2210 → FLAGGED [HIGH] Cross-border pattern triggers AML-R03",
    "✅ TXN-5518 → COMPLIANT",
    "⚡ TXN-6643 → FLAGGED [CRITICAL] $22,100 wire transfer + foreign origin",
    "⚡ TXN-7734 → FLAGGED [HIGH] ACC-6601 smurfing pattern detected (3 hits)",
    "⚡ TXN-8833 → FLAGGED [CRITICAL] $199,500 wire via known tax haven",
    "📊 Scan complete: 12,847 records | 5 violations | 0.04% breach rate",
    "🛡️  Evidence Dossiers generated. Human review queue updated.",
];

interface ViolationDetail {
    record: typeof AML_RECORDS[0];
    rule: typeof SYNTHESIZED_RULES[0];
    explanation: string;
    counterfactual: string;
}

export default function SentinelPage() {
    const [scanState, setScanState] = useState<'idle' | 'scanning' | 'complete'>('idle');
    const [logLines, setLogLines] = useState<string[]>([]);
    const [scannedCount, setScannedCount] = useState(0);
    const [flaggedRecords, setFlaggedRecords] = useState<typeof AML_RECORDS>([]);
    const [selectedViolation, setSelectedViolation] = useState<ViolationDetail | null>(null);
    const [progress, setProgress] = useState(0);
    const [expandedRule, setExpandedRule] = useState<string | null>('AML-R01');
    const logRef = useRef<HTMLDivElement>(null);

    const startScan = async () => {
        setScanState('scanning');
        setLogLines([]);
        setScannedCount(0);
        setFlaggedRecords([]);
        setProgress(0);

        for (let i = 0; i < SCAN_LOGS.length; i++) {
            await new Promise(r => setTimeout(r, 350 + Math.random() * 200));
            setLogLines(prev => [...prev, SCAN_LOGS[i]]);
            setProgress(Math.round(((i + 1) / SCAN_LOGS.length) * 100));
            setScannedCount(Math.round(((i + 1) / SCAN_LOGS.length) * 12847));

            if (logRef.current) {
                logRef.current.scrollTop = logRef.current.scrollHeight;
            }
        }

        setFlaggedRecords(AML_RECORDS.filter(r => r.isFlagged));
        setScanState('complete');
    };

    const openDossier = (record: typeof AML_RECORDS[0]) => {
        const rule = SYNTHESIZED_RULES.find(r => {
            if (record.label === 'Smurfing') return r.id === 'AML-R02';
            if (record.amount > 10000) return r.id === 'AML-R01';
            return r.id === 'AML-R03';
        }) || SYNTHESIZED_RULES[0];

        const explanations: Record<string, string> = {
            'CRITICAL': `This transaction was flagged because the amount of $${record.amount.toLocaleString()} exceeds the threshold defined in ${rule.clause}. The rule requires mandatory CTR (Currency Transaction Report) filing for any single transaction exceeding $10,000. Additionally, the cross-border origin (${record.country}) triggers secondary scrutiny under FATF Recommendation 10.`,
            'HIGH': record.label === 'Smurfing'
                ? `Account ${record.from} has executed 3+ transfers to the same beneficiary (${record.to}) within a 24-hour window, each just below the $2,000 threshold. This matches the "structuring" pattern defined in FATF Rec. 10 — a classic Smurfing evasion technique.`
                : `Cross-border transfer of $${record.amount.toLocaleString()} from high-risk jurisdiction (${record.country}) triggers AML-R03. Transfer amount exceeds the $5,000 cross-border threshold.`,
            'MEDIUM': `Transaction shows moderate risk indicators. Amount is near the reporting threshold.`,
        };

        const counterfactuals: Record<string, string> = {
            'CRITICAL': `If the amount were reduced by $${(record.amount - 9999).toLocaleString()}, this record would not trigger AML-R01. However, AML-R03 would still apply due to cross-border origin.`,
            'HIGH': record.label === 'Smurfing'
                ? `If the transfer count from ACC-${record.from.split('-')[1]} to ACC-${record.to.split('-')[1]} were below 3 in 24h, this pattern would not trigger AML-R02.`
                : `If the origin country were domestic (US), cross-border flag AML-R03 would not apply.`,
            'MEDIUM': `Reducing transfer frequency or amount would lower the risk score below the reporting threshold.`,
        };

        setSelectedViolation({
            record,
            rule,
            explanation: explanations[record.risk] || explanations['MEDIUM'],
            counterfactual: counterfactuals[record.risk] || counterfactuals['MEDIUM'],
        });
    };

    const riskColor = (risk: string) => ({
        'CRITICAL': 'text-red-400 bg-red-950/40 border-red-800/40',
        'HIGH': 'text-orange-400 bg-orange-950/40 border-orange-800/40',
        'MEDIUM': 'text-amber-400 bg-amber-950/40 border-amber-800/40',
        'LOW': 'text-[#1aff8c] bg-[rgba(26,255,140,0.06)] border-[rgba(26,255,140,0.2)]',
    }[risk] || '');

    const riskDot = (risk: string) =>
        ({ 'CRITICAL': 'bg-red-500', 'HIGH': 'bg-orange-500', 'MEDIUM': 'bg-amber-500', 'LOW': 'bg-[#1aff8c]' }[risk] || '');

    return (
        <div className="space-y-6 pb-16">
            {/* ── HEADER ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-[rgba(26,255,140,0.1)] border border-[rgba(26,255,140,0.2)]">
                            <Database className="w-5 h-5 text-[#1aff8c]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Database Sentinel</h1>
                            <p className="text-[rgba(26,255,140,0.6)] text-xs tracking-widest uppercase">IBM AML Transaction Fabric · Live Enforcement</p>
                        </div>
                        {scanState === 'scanning' && (
                            <span className="sentinel-badge ml-2">Scanning</span>
                        )}
                        {scanState === 'complete' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-950/40 border border-red-800/40 text-red-400">
                                <AlertOctagon className="w-3 h-3" /> {flaggedRecords.length} Critical Flags
                            </span>
                        )}
                    </div>
                    <p className="text-[rgba(255,255,255,0.45)] text-sm max-w-2xl">
                        Lexinel's Active Sentinel scans the IBM AML Transaction Fabric in real-time using synthesized enforcement rules extracted from your PDF policies.
                    </p>
                </div>
                <button
                    onClick={startScan}
                    disabled={scanState === 'scanning'}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm text-[#070c0a] bg-[#1aff8c] hover:bg-[#0de87a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{ boxShadow: scanState !== 'scanning' ? '0 0 20px rgba(26,255,140,0.4)' : 'none' }}
                >
                    {scanState === 'scanning' ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Scanning...</>
                    ) : (
                        <><Play className="w-4 h-4" /> {scanState === 'complete' ? 'Re-Run Sentinel' : 'Launch Sentinel'}</>
                    )}
                </button>
            </div>

            {/* ── KPI STATS ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Records Scanned', value: scannedCount.toLocaleString(), suffix: '/ 12,847', icon: Database, color: 'text-[#1aff8c]' },
                    { label: 'Violations Found', value: scanState === 'complete' ? flaggedRecords.length.toString() : '—', suffix: 'flagged', icon: AlertOctagon, color: 'text-red-400' },
                    { label: 'Rules Active', value: SYNTHESIZED_RULES.filter(r => r.active).length.toString(), suffix: 'deployed', icon: Shield, color: 'text-amber-400' },
                    { label: 'Scan Progress', value: `${progress}%`, suffix: 'complete', icon: Activity, color: 'text-blue-400' },
                ].map((stat, i) => (
                    <div key={i} className="glass-card rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-[rgba(255,255,255,0.4)] uppercase tracking-wider">{stat.label}</p>
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <p className="text-xs text-[rgba(255,255,255,0.3)] mt-1">{stat.suffix}</p>
                        {stat.label === 'Scan Progress' && (
                            <div className="mt-2 h-1 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                                <div className="h-full bg-[#1aff8c] transition-all duration-300 rounded-full"
                                    style={{ width: `${progress}%`, boxShadow: '0 0 8px rgba(26,255,140,0.5)' }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* ── MAIN LAYOUT ───────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── LEFT: Synthesized Rules ──────────────────── */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-[rgba(26,255,140,0.8)] uppercase tracking-widest flex items-center gap-2">
                        <Layers className="w-4 h-4" /> N2L Synthesized Rules
                    </h2>
                    {SYNTHESIZED_RULES.map(rule => (
                        <div key={rule.id}
                            className={`glass-card rounded-xl overflow-hidden transition-all duration-200 ${!rule.active ? 'opacity-50' : ''}`}>
                            <button
                                className="w-full flex items-center justify-between p-4 text-left"
                                onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rule.active ? 'bg-[#1aff8c]' : 'bg-gray-600'}`}
                                        style={rule.active ? { boxShadow: '0 0 6px #1aff8c' } : {}} />
                                    <div>
                                        <p className="text-sm font-bold text-white">{rule.id}</p>
                                        <p className="text-xs text-[rgba(255,255,255,0.4)]">{rule.label}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-[rgba(26,255,140,0.6)] border border-[rgba(26,255,140,0.2)] rounded px-1.5 py-0.5">
                                        {rule.clause}
                                    </span>
                                    {expandedRule === rule.id ? <ChevronUp className="w-3.5 h-3.5 text-[rgba(255,255,255,0.3)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[rgba(255,255,255,0.3)]" />}
                                </div>
                            </button>
                            {expandedRule === rule.id && (
                                <div className="px-4 pb-4 border-t border-[rgba(26,255,140,0.08)]">
                                    <p className="text-[10px] text-[rgba(255,255,255,0.3)] mt-3 mb-1 uppercase tracking-widest">Enforcement Logic</p>
                                    <code className="block text-xs font-mono text-[#1aff8c] bg-[rgba(26,255,140,0.05)] rounded-lg p-3 border border-[rgba(26,255,140,0.1)]">
                                        {rule.logic}
                                    </code>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Legend */}
                    <div className="glass-card rounded-xl p-4">
                        <p className="text-xs text-[rgba(255,255,255,0.4)] uppercase tracking-widest mb-3">Risk Legend</p>
                        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(r => (
                            <div key={r} className="flex items-center gap-2 mb-1.5">
                                <div className={`w-2 h-2 rounded-full ${riskDot(r)}`} />
                                <span className="text-xs text-[rgba(255,255,255,0.5)]">{r}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── RIGHT: Scan Terminal + Results ──────────── */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Scan Terminal */}
                    <div className="glass-card rounded-xl overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(26,255,140,0.08)]">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                                <div className="w-3 h-3 rounded-full bg-[#1aff8c]/70" />
                            </div>
                            <span className="text-xs font-mono text-[rgba(26,255,140,0.6)] tracking-wider ml-1">lexinel.sentinel — process</span>
                            {scanState === 'scanning' && (
                                <div className="ml-auto flex items-center gap-1.5 text-[10px] text-[#1aff8c] animate-pulse">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1aff8c]" />
                                    live
                                </div>
                            )}
                        </div>
                        <div
                            ref={logRef}
                            className="h-48 overflow-y-auto bg-[#030806] p-4 font-mono text-xs space-y-1"
                        >
                            {logLines.length === 0 ? (
                                <p className="text-[rgba(26,255,140,0.3)]">{'>'} Awaiting scan command...</p>
                            ) : (
                                logLines.map((line, i) => (
                                    <p key={i} className={
                                        line.includes('FLAGGED') ? 'text-red-400' :
                                            line.includes('COMPLIANT') ? 'text-[#1aff8c]' :
                                                line.includes('complete') ? 'text-amber-400 font-bold' :
                                                    'text-[rgba(26,255,140,0.5)]'
                                    }>
                                        {line}
                                    </p>
                                ))
                            )}
                            {scanState === 'scanning' && (
                                <p className="text-[#1aff8c] animate-pulse">▋</p>
                            )}
                        </div>
                    </div>

                    {/* Violation Records */}
                    {(scanState === 'complete' || flaggedRecords.length > 0) && (
                        <div className="glass-card rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(26,255,140,0.08)]">
                                <div className="flex items-center gap-2">
                                    <AlertOctagon className="w-4 h-4 text-red-400" />
                                    <h3 className="text-sm font-bold text-white">Flagged Records</h3>
                                    <span className="text-xs text-red-400 font-mono">{flaggedRecords.length} violations</span>
                                </div>
                                <span className="text-[10px] text-[rgba(255,255,255,0.3)] border border-[rgba(255,255,255,0.08)] rounded px-2 py-0.5">
                                    Click to view Evidence Dossier
                                </span>
                            </div>
                            <div className="divide-y divide-[rgba(26,255,140,0.06)]">
                                {flaggedRecords.map((rec) => (
                                    <button
                                        key={rec.id}
                                        onClick={() => openDossier(rec)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[rgba(26,255,140,0.03)] transition-colors text-left group"
                                    >
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${riskDot(rec.risk)}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-sm font-mono font-bold text-white">{rec.id}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${riskColor(rec.risk)}`}>{rec.risk}</span>
                                                <span className="text-[10px] text-[rgba(255,255,255,0.3)]">{rec.label}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-[rgba(255,255,255,0.35)]">
                                                <span>{rec.from} → {rec.to}</span>
                                                <span className="text-[#1aff8c] font-mono">${rec.amount.toLocaleString()}</span>
                                                <span>{rec.type}</span>
                                                <span>{rec.country}</span>
                                                <span>{rec.time}</span>
                                            </div>
                                        </div>
                                        <Eye className="w-4 h-4 text-[rgba(26,255,140,0.3)] group-hover:text-[#1aff8c] transition-colors flex-shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Show All Records (idle state) */}
                    {scanState === 'idle' && (
                        <div className="glass-card rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-[rgba(26,255,140,0.08)]">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Database className="w-4 h-4 text-[rgba(26,255,140,0.5)]" />
                                    IBM AML Transaction Fabric Preview
                                </h3>
                            </div>
                            <div className="divide-y divide-[rgba(26,255,140,0.04)]">
                                {AML_RECORDS.slice(0, 5).map(rec => (
                                    <div key={rec.id} className="flex items-center gap-3 px-4 py-2.5 opacity-60">
                                        <div className="w-2 h-2 rounded-full bg-gray-600 flex-shrink-0" />
                                        <span className="text-xs font-mono text-[rgba(255,255,255,0.5)]">{rec.id}</span>
                                        <span className="text-xs text-[rgba(255,255,255,0.3)]">{rec.from} → {rec.to}</span>
                                        <span className="text-xs font-mono text-[rgba(255,255,255,0.4)]">${rec.amount.toLocaleString()}</span>
                                        <span className="text-[10px] text-[rgba(255,255,255,0.2)] ml-auto">{rec.type}</span>
                                    </div>
                                ))}
                                <div className="px-4 py-2 text-center text-xs text-[rgba(255,255,255,0.25)]">
                                    +12,842 more records • Launch Sentinel to scan all
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── EVIDENCE DOSSIER MODAL ───────────────────────── */}
            {selectedViolation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={() => setSelectedViolation(null)}>
                    <div className="w-full max-w-2xl glass-card rounded-2xl overflow-hidden shadow-neon"
                        onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(26,255,140,0.1)]"
                            style={{ background: 'linear-gradient(135deg, #070c0a, #0d1810)' }}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/40">
                                    <AlertOctagon className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">Evidence Dossier</h2>
                                    <p className="text-xs text-[rgba(26,255,140,0.5)]">Lexinel Forensic Audit Trail</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedViolation(null)}
                                className="text-[rgba(255,255,255,0.3)] hover:text-white transition-colors p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Record Summary */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Transaction ID', value: selectedViolation.record.id },
                                    { label: 'Risk Level', value: selectedViolation.record.risk, highlight: true },
                                    { label: 'Amount', value: `$${selectedViolation.record.amount.toLocaleString()}` },
                                    { label: 'Type', value: selectedViolation.record.type },
                                    { label: 'Origin', value: selectedViolation.record.from },
                                    { label: 'Beneficiary', value: selectedViolation.record.to },
                                    { label: 'Jurisdiction', value: selectedViolation.record.country },
                                    { label: 'Timestamp', value: selectedViolation.record.time },
                                ].map((field, i) => (
                                    <div key={i} className="bg-[rgba(26,255,140,0.03)] border border-[rgba(26,255,140,0.08)] rounded-lg p-3">
                                        <p className="text-[10px] text-[rgba(255,255,255,0.3)] uppercase tracking-widest mb-1">{field.label}</p>
                                        <p className={`text-sm font-mono font-bold ${field.highlight ? riskColor(selectedViolation.record.risk).split(' ')[0] : 'text-white'}`}>
                                            {field.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Violated Rule */}
                            <div className="border border-[rgba(26,255,140,0.2)] rounded-xl p-4 bg-[rgba(26,255,140,0.03)]">
                                <p className="text-[10px] text-[rgba(26,255,140,0.5)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Shield className="w-3 h-3" /> Violated Policy Clause
                                </p>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm font-bold text-[#1aff8c]">{selectedViolation.rule.id}</span>
                                    <span className="text-xs border border-[rgba(26,255,140,0.2)] rounded px-2 py-0.5 text-[rgba(26,255,140,0.6)]">{selectedViolation.rule.clause}</span>
                                </div>
                                <code className="block text-xs font-mono text-[rgba(26,255,140,0.7)] bg-[rgba(26,255,140,0.05)] rounded-lg p-3">
                                    {selectedViolation.rule.logic}
                                </code>
                            </div>

                            {/* AI Explanation */}
                            <div className="border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                                <p className="text-[10px] text-[rgba(255,255,255,0.4)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Cpu className="w-3 h-3" /> Gemini Forensic Explanation
                                </p>
                                <p className="text-sm text-[rgba(255,255,255,0.7)] leading-relaxed">{selectedViolation.explanation}</p>
                            </div>

                            {/* Counterfactual */}
                            <div className="border border-amber-800/30 rounded-xl p-4 bg-amber-950/10">
                                <p className="text-[10px] text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <TrendingUp className="w-3 h-3" /> Counterfactual (What Would Make It Compliant)
                                </p>
                                <p className="text-sm text-[rgba(255,255,255,0.65)] leading-relaxed">{selectedViolation.counterfactual}</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-[#070c0a] bg-[#1aff8c] hover:bg-[#0de87a] transition-all"
                                    style={{ boxShadow: '0 0 16px rgba(26,255,140,0.3)' }}>
                                    <ShieldCheck className="w-4 h-4" /> Send to Human Review
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-red-400 border border-red-800/40 bg-red-950/20 hover:bg-red-950/40 transition-all">
                                    <Lock className="w-4 h-4" /> Freeze Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
