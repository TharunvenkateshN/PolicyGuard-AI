"use client"

import { useState, useRef } from 'react';
import {
    FileText, Upload, CheckCircle2, Cpu, Database,
    Shield, ArrowRight, Loader2, BookOpen, Code2,
    Layers, AlertTriangle, X, Download
} from 'lucide-react';

const POLICY_TEMPLATES = [
    { name: 'BSA / FinCEN AML Policy', type: 'PDF', size: '2.4 MB', clauses: 47, desc: 'Bank Secrecy Act compliance for US financial institutions' },
    { name: 'EU AMLD6 Framework', type: 'PDF', size: '1.8 MB', clauses: 63, desc: 'European Anti-Money Laundering Directive, 6th edition' },
    { name: 'FATF 40 Recommendations', type: 'PDF', size: '3.1 MB', clauses: 40, desc: 'Financial Action Task Force guidelines for AML/CFT' },
];

const SYNTHESIS_STEPS = [
    '📄 Extracting text from PDF...',
    '🔍 Identifying policy clauses and obligations...',
    '🧠 Gemini 2.5 Pro: Analyzing regulatory intent...',
    '⚙️  Converting clauses to enforcement logic...',
    '🗃️  Generating SQL assertion rules...',
    '🔗 Mapping rules to IBM AML database schema...',
    '✅ N2L Synthesis complete. Rules ready for deployment.',
];

const SYNTHESIZED_RULES_OUTPUT = [
    { id: 'AML-R01', clause: 'BSA §1010.310', logic: 'amount > 10000 AND type IN (TRANSFER, WIRE)', label: 'CTR Threshold', status: 'DEPLOYED' },
    { id: 'AML-R02', clause: 'FATF Rec. 10', logic: 'COUNT(same_beneficiary_24h) >= 3 AND amount < 2000', label: 'Structuring', status: 'DEPLOYED' },
    { id: 'AML-R03', clause: 'FinCEN 103.29', logic: 'cross_border = true AND amount > 5000', label: 'Cross-Border', status: 'DEPLOYED' },
    { id: 'AML-R04', clause: 'GDPR Art. 5', logic: 'pii_encrypted = false', label: 'PII Exposure', status: 'PENDING' },
];

export default function PoliciesPage() {
    const [uploadedFiles, setUploadedFiles] = useState<string[]>(['AML_Policy_Lexinel.pdf']);
    const [synthesizing, setSynthesizing] = useState(false);
    const [synthLog, setSynthLog] = useState<string[]>([]);
    const [synthComplete, setSynthComplete] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    const runSynthesis = async (filename: string) => {
        setSynthesizing(true);
        setSynthLog([]);
        setSynthComplete(false);
        setSelectedTemplate(filename);

        for (const step of SYNTHESIS_STEPS) {
            await new Promise(r => setTimeout(r, 500 + Math.random() * 400));
            setSynthLog(prev => [...prev, step]);
        }
        setSynthesizing(false);
        setSynthComplete(true);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files).map(f => f.name);
        setUploadedFiles(prev => [...new Set([...prev, ...files])]);
    };

    return (
        <div className="space-y-6 pb-16">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-[rgba(26,255,140,0.1)] border border-[rgba(26,255,140,0.2)]">
                        <FileText className="w-5 h-5 text-[#1aff8c]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Policy Vault</h1>
                        <p className="text-[rgba(26,255,140,0.5)] text-xs tracking-widest uppercase">N2L Neural-to-Logic Recompiler · PDF → Enforcement</p>
                    </div>
                </div>
                <p className="text-[rgba(255,255,255,0.4)] text-sm max-w-2xl">
                    Upload regulatory PDF documents. Lexinel's Gemini-powered N2L engine converts unstructured policy text into executable database enforcement rules.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload + Templates */}
                <div className="space-y-4">
                    {/* Upload Zone */}
                    <div
                        className={`relative glass-card rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${dragOver ? 'border-[#1aff8c] bg-[rgba(26,255,140,0.08)]' : 'border-[rgba(26,255,140,0.2)] hover:border-[rgba(26,255,140,0.4)]'}`}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input ref={fileInputRef} type="file" accept=".pdf,.docx" multiple className="hidden"
                            onChange={e => {
                                const files = Array.from(e.target.files || []).map(f => f.name);
                                setUploadedFiles(prev => [...new Set([...prev, ...files])]);
                            }}
                        />
                        <Upload className="w-8 h-8 text-[#1aff8c] mx-auto mb-3 opacity-60" />
                        <p className="text-sm font-medium text-[rgba(255,255,255,0.6)]">Drop PDF/DOCX here</p>
                        <p className="text-xs text-[rgba(255,255,255,0.3)] mt-1">or click to browse</p>
                    </div>

                    {/* Uploaded Files */}
                    {uploadedFiles.length > 0 && (
                        <div className="glass-card rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-[rgba(26,255,140,0.08)]">
                                <p className="text-xs font-bold text-[rgba(26,255,140,0.7)] uppercase tracking-widest">Loaded Documents</p>
                            </div>
                            <div className="divide-y divide-[rgba(26,255,140,0.06)]">
                                {uploadedFiles.map((f, i) => (
                                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                                        <FileText className="w-4 h-4 text-[rgba(26,255,140,0.5)] flex-shrink-0" />
                                        <span className="text-sm text-[rgba(255,255,255,0.7)] flex-1 truncate font-mono">{f}</span>
                                        <button
                                            onClick={() => runSynthesis(f)}
                                            disabled={synthesizing}
                                            className="text-[10px] font-bold text-[#070c0a] bg-[#1aff8c] px-2.5 py-1 rounded-md hover:bg-[#0de87a] disabled:opacity-50 transition-all"
                                        >
                                            Synthesize
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Templates */}
                    <div>
                        <p className="text-xs text-[rgba(255,255,255,0.3)] uppercase tracking-widest mb-2 px-1">Pre-loaded Templates</p>
                        {POLICY_TEMPLATES.map((t, i) => (
                            <button
                                key={i}
                                onClick={() => runSynthesis(t.name)}
                                disabled={synthesizing}
                                className="w-full text-left glass-card rounded-xl p-4 mb-2 hover:border-[rgba(26,255,140,0.25)] transition-all border border-[rgba(26,255,140,0.08)] disabled:opacity-70"
                            >
                                <div className="flex items-start gap-3">
                                    <BookOpen className="w-4 h-4 text-[rgba(26,255,140,0.5)] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-white">{t.name}</p>
                                        <p className="text-xs text-[rgba(255,255,255,0.35)] mt-0.5">{t.desc}</p>
                                        <p className="text-[10px] text-[rgba(26,255,140,0.5)] mt-1">{t.clauses} clauses · {t.size}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* N2L Synthesis Console */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="glass-card rounded-xl overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(26,255,140,0.08)]">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                                <div className="w-3 h-3 rounded-full bg-[#1aff8c]/70" />
                            </div>
                            <span className="text-xs font-mono text-[rgba(26,255,140,0.6)]">lexinel.n2l — gemini-synthesis-engine</span>
                            {synthesizing && (
                                <div className="ml-auto text-[10px] text-[#1aff8c] animate-pulse flex items-center gap-1">
                                    <Cpu className="w-3 h-3" /> synthesizing
                                </div>
                            )}
                            {synthComplete && (
                                <div className="ml-auto text-[10px] text-[#1aff8c] flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> complete
                                </div>
                            )}
                        </div>
                        <div className="h-48 overflow-y-auto bg-[#030806] p-4 font-mono text-xs space-y-1">
                            {synthLog.length === 0 ? (
                                <p className="text-[rgba(26,255,140,0.3)]">{'>'} Select a policy document to begin N2L synthesis...</p>
                            ) : synthLog.map((line, i) => (
                                <p key={i} className={
                                    line.includes('✅') ? 'text-[#1aff8c] font-bold' :
                                        line.includes('🧠') ? 'text-blue-400' :
                                            'text-[rgba(26,255,140,0.6)]'
                                }>{line}</p>
                            ))}
                            {synthesizing && <p className="text-[#1aff8c] animate-pulse">▋</p>}
                        </div>
                    </div>

                    {/* Synthesized Rules */}
                    {synthComplete && (
                        <div className="glass-card rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(26,255,140,0.08)]">
                                <div className="flex items-center gap-2">
                                    <Code2 className="w-4 h-4 text-[#1aff8c]" />
                                    <h3 className="text-sm font-bold text-white">N2L Output — Enforcement Rules</h3>
                                </div>
                                <span className="text-[10px] font-bold text-[#1aff8c] border border-[rgba(26,255,140,0.2)] rounded px-2 py-0.5">
                                    {selectedTemplate}
                                </span>
                            </div>
                            <div className="divide-y divide-[rgba(26,255,140,0.06)]">
                                {SYNTHESIZED_RULES_OUTPUT.map(rule => (
                                    <div key={rule.id} className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-[#1aff8c] font-mono">{rule.id}</span>
                                                <span className="text-xs text-[rgba(255,255,255,0.4)] border border-[rgba(26,255,140,0.15)] rounded px-2 py-0.5">{rule.clause}</span>
                                                <span className="text-xs text-[rgba(255,255,255,0.5)]">{rule.label}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${rule.status === 'DEPLOYED' ? 'text-[#1aff8c] border-[rgba(26,255,140,0.3)] bg-[rgba(26,255,140,0.08)]' : 'text-amber-400 border-amber-800/40 bg-amber-950/20'}`}>
                                                {rule.status}
                                            </span>
                                        </div>
                                        <code className="block text-xs font-mono text-amber-300 bg-[rgba(26,255,140,0.03)] rounded p-2 border border-[rgba(26,255,140,0.06)]">
                                            {rule.logic}
                                        </code>
                                    </div>
                                ))}
                            </div>
                            <div className="px-4 py-3 border-t border-[rgba(26,255,140,0.08)] flex gap-3">
                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-[#070c0a] bg-[#1aff8c] hover:bg-[#0de87a] transition-all"
                                    style={{ boxShadow: '0 0 12px rgba(26,255,140,0.3)' }}>
                                    <Database className="w-4 h-4" /> Deploy to Sentinel
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-[rgba(255,255,255,0.6)] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(26,255,140,0.3)] transition-all">
                                    <Download className="w-4 h-4" /> Export Rules
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
