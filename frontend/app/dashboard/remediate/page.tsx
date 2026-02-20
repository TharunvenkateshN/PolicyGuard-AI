"use client"

import { useState } from 'react';
import {
    AlertOctagon, Shield, CheckCircle2, Lock, Users,
    RefreshCw, X, Eye, ArrowRight, TrendingUp, Cpu,
    FileText, Clock, Send
} from 'lucide-react';

const VIOLATION_QUEUE = [
    {
        id: 'V-8821', txn: 'TXN-8821', severity: 'CRITICAL', rule: 'AML-R01',
        amount: 14500, type: 'WIRE', jurisdiction: 'DE→US', timestamp: '2024-01-15 03:22',
        explanation: 'Transaction amount ($14,500) exceeds BSA §1010.310 CTR threshold. Wire transfer origin from Germany triggers secondary FATF review.',
        counterfactual: 'If amount were ≤$10,000 AND origin were domestic, no CTR required.',
        status: 'PENDING_REVIEW'
    },
    {
        id: 'V-6643', txn: 'TXN-6643', severity: 'CRITICAL', rule: 'AML-R03',
        amount: 22100, type: 'TRANSFER', jurisdiction: 'RU→US',
        timestamp: '2024-01-15 03:45',
        explanation: 'High-value transfer ($22,100) from Russia-based account to US entity. Cross-border pattern + amount triggers both AML-R01 and AML-R03.',
        counterfactual: 'Domestic origin would clear AML-R03. Amount still triggers AML-R01.',
        status: 'PENDING_REVIEW'
    },
    {
        id: 'V-SMURF', txn: 'TXN-7734/3320/9910', severity: 'HIGH', rule: 'AML-R02',
        amount: 5965, type: 'STRUCTURING', jurisdiction: 'RU→US',
        timestamp: '2024-01-15 04:10–04:35',
        explanation: 'Account ACC-6601 executed 3 transfers to ACC-9977 within 25 minutes, each ~$1,980–$1,995. Classic structuring/smurfing pattern.',
        counterfactual: 'Spacing transfers >24h apart at different amounts would avoid velocity detection.',
        status: 'ESCALATED'
    },
    {
        id: 'V-8833', txn: 'TXN-8833', severity: 'CRITICAL', rule: 'AML-R01',
        amount: 199500, type: 'WIRE', jurisdiction: 'KY→CH',
        timestamp: '2024-01-15 05:10',
        explanation: '$199,500 wire via Cayman Islands shell to Swiss entity. Tax haven routing + extreme amount = maximum risk score.',
        counterfactual: 'No single change makes this compliant. All 3 rules triggered simultaneously.',
        status: 'FROZEN'
    },
];

const ACTION_LOG = [
    { id: 1, time: '05:12', action: 'Account ACC-1103 frozen', actor: 'Lexinel Sentinel', type: 'auto' },
    { id: 2, time: '05:13', action: 'Dossier sent to FinCEN reporting queue', actor: 'Compliance Officer', type: 'human' },
    { id: 3, time: '04:37', action: 'ACC-6601 flagged for SAR filing', actor: 'Lexinel Sentinel', type: 'auto' },
    { id: 4, time: '03:48', action: 'TXN-6643 escalated to senior AML analyst', actor: 'Lexinel Sentinel', type: 'auto' },
];

export default function RemediatePage() {
    const [selectedViolation, setSelectedViolation] = useState<typeof VIOLATION_QUEUE[0] | null>(null);
    const [actionTaken, setActionTaken] = useState<Record<string, string>>({});

    const takeAction = (violationId: string, action: string) => {
        setActionTaken(prev => ({ ...prev, [violationId]: action }));
        setSelectedViolation(null);
    };

    const severityColor = (s: string) => ({
        'CRITICAL': 'text-red-400 bg-red-950/40 border-red-800/40',
        'HIGH': 'text-orange-400 bg-orange-950/40 border-orange-800/40',
        'MEDIUM': 'text-amber-400 bg-amber-950/40 border-amber-800/40',
    }[s] || '');

    const statusColor = (s: string) => ({
        'PENDING_REVIEW': 'text-amber-400', 'ESCALATED': 'text-orange-400', 'FROZEN': 'text-red-400',
    }[s] || '');

    return (
        <div className="space-y-6 pb-16">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-red-950/30 border border-red-800/30">
                        <AlertOctagon className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Violation Nexus</h1>
                        <p className="text-red-400/60 text-xs tracking-widest uppercase">Remediation Hub · Human-in-the-Loop Arbitration</p>
                    </div>
                    <span className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-950/40 border border-red-800/40 text-red-400">
                        <AlertOctagon className="w-3 h-3" />
                        {VIOLATION_QUEUE.filter(v => !actionTaken[v.id]).length} Active
                    </span>
                </div>
                <p className="text-[rgba(255,255,255,0.4)] text-sm">
                    Review AML violations flagged by the Database Sentinel. Each case includes a Gemini-generated forensic explanation and counterfactual analysis.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Violation Queue */}
                <div className="space-y-3">
                    <h2 className="text-xs font-bold text-red-400/80 uppercase tracking-widest">Violation Queue</h2>
                    {VIOLATION_QUEUE.map(v => (
                        <button
                            key={v.id}
                            onClick={() => setSelectedViolation(v)}
                            className={`w-full text-left glass-card rounded-xl p-4 border transition-all duration-200 ${selectedViolation?.id === v.id ? 'border-[rgba(26,255,140,0.3)]' : 'border-[rgba(26,255,140,0.08)]'} ${actionTaken[v.id] ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-mono font-bold text-white">{v.id}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${severityColor(v.severity)}`}>{v.severity}</span>
                            </div>
                            <p className="text-xs text-[rgba(255,255,255,0.5)] mb-1">{v.txn} · {v.rule}</p>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-[rgba(255,255,255,0.3)] font-mono">${v.amount.toLocaleString()}</span>
                                {actionTaken[v.id] ? (
                                    <span className="text-[#1aff8c] font-bold">{actionTaken[v.id]}</span>
                                ) : (
                                    <span className={`font-bold ${statusColor(v.status)}`}>{v.status.replace('_', ' ')}</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Detail Panel */}
                <div className="lg:col-span-2 space-y-4">
                    {selectedViolation ? (
                        <>
                            {/* Case Header */}
                            <div className="glass-card rounded-xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-base font-bold text-white">Evidence Dossier — {selectedViolation.id}</h3>
                                        <p className="text-xs text-[rgba(255,255,255,0.4)]">{selectedViolation.txn} · {selectedViolation.timestamp}</p>
                                    </div>
                                    <button onClick={() => setSelectedViolation(null)} className="text-[rgba(255,255,255,0.3)] hover:text-white">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                    {[
                                        { label: 'Risk', value: selectedViolation.severity },
                                        { label: 'Amount', value: `$${selectedViolation.amount.toLocaleString()}` },
                                        { label: 'Jurisdiction', value: selectedViolation.jurisdiction },
                                        { label: 'Rule', value: selectedViolation.rule },
                                    ].map((f, i) => (
                                        <div key={i} className="bg-[rgba(26,255,140,0.03)] border border-[rgba(26,255,140,0.08)] rounded-lg p-3">
                                            <p className="text-[10px] text-[rgba(255,255,255,0.3)] uppercase tracking-widest mb-1">{f.label}</p>
                                            <p className="text-sm font-bold font-mono text-white">{f.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Explanation */}
                                <div className="mb-3 border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                                    <p className="text-[10px] text-[rgba(255,255,255,0.4)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Cpu className="w-3 h-3" /> Gemini Forensic Analysis
                                    </p>
                                    <p className="text-sm text-[rgba(255,255,255,0.7)] leading-relaxed">{selectedViolation.explanation}</p>
                                </div>

                                {/* Counterfactual */}
                                <div className="border border-amber-800/30 rounded-xl p-4 bg-amber-950/10 mb-4">
                                    <p className="text-[10px] text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <TrendingUp className="w-3 h-3" /> Counterfactual — What Would Make It Compliant
                                    </p>
                                    <p className="text-sm text-[rgba(255,255,255,0.65)] leading-relaxed">{selectedViolation.counterfactual}</p>
                                </div>

                                {/* Action Buttons */}
                                {!actionTaken[selectedViolation.id] ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <button
                                            onClick={() => takeAction(selectedViolation.id, 'APPROVED')}
                                            className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-[#070c0a] bg-[#1aff8c] hover:bg-[#0de87a] transition-all"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Approve & Clear
                                        </button>
                                        <button
                                            onClick={() => takeAction(selectedViolation.id, 'FROZEN')}
                                            className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-red-400 border border-red-800/40 bg-red-950/20 hover:bg-red-950/40 transition-all"
                                        >
                                            <Lock className="w-4 h-4" /> Freeze Account
                                        </button>
                                        <button
                                            onClick={() => takeAction(selectedViolation.id, 'SAR_FILED')}
                                            className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-amber-400 border border-amber-800/40 bg-amber-950/20 hover:bg-amber-950/40 transition-all"
                                        >
                                            <FileText className="w-4 h-4" /> File SAR
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[rgba(26,255,140,0.3)] bg-[rgba(26,255,140,0.08)]">
                                        <CheckCircle2 className="w-5 h-5 text-[#1aff8c]" />
                                        <span className="text-[#1aff8c] font-bold">Action Taken: {actionTaken[selectedViolation.id]}</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Log */}
                            <div className="glass-card rounded-xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-[rgba(26,255,140,0.08)]">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-[rgba(26,255,140,0.5)]" /> Audit Trail
                                    </h3>
                                </div>
                                <div className="divide-y divide-[rgba(26,255,140,0.06)]">
                                    {ACTION_LOG.map(log => (
                                        <div key={log.id} className="flex items-center gap-3 px-4 py-2.5">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.type === 'auto' ? 'bg-[#1aff8c]' : 'bg-blue-400'}`} />
                                            <span className="text-xs text-[rgba(255,255,255,0.6)] flex-1">{log.action}</span>
                                            <span className="text-xs text-[rgba(255,255,255,0.3)]">{log.actor}</span>
                                            <span className="text-xs font-mono text-[rgba(255,255,255,0.25)]">{log.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="glass-card rounded-xl flex items-center justify-center h-64 border border-dashed border-[rgba(255,255,255,0.1)]">
                            <div className="text-center">
                                <Shield className="w-10 h-10 text-[rgba(26,255,140,0.2)] mx-auto mb-3" />
                                <p className="text-[rgba(255,255,255,0.3)]">Select a violation to review its Evidence Dossier</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
