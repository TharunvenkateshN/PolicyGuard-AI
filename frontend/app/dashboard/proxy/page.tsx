"use client"

import { useState } from 'react';
import {
    Plug, CheckCircle2, AlertCircle, Copy, ExternalLink,
    Key, Globe, RefreshCw, Shield, Database, Cpu, Activity
} from 'lucide-react';

const INTEGRATIONS = [
    {
        id: 'gemini', name: 'Google Gemini 2.5 Pro', category: 'AI Engine',
        description: 'N2L synthesis engine — converts PDF policy text to enforcement logic',
        status: 'CONNECTED', icon: Cpu, docs: 'https://ai.google.dev',
        config: 'GOOGLE_API_KEY', configured: true,
    },
    {
        id: 'ibm-aml', name: 'IBM AML Dataset', category: 'Data Source',
        description: 'Anti-Money Laundering transaction dataset for compliance scanning',
        status: 'CONNECTED', icon: Database, docs: 'https://ibm.com',
        config: 'IBM_AML_PATH', configured: true,
    },
    {
        id: 'fincen', name: 'FinCEN SAR Reporting', category: 'Regulatory',
        description: 'Suspicious Activity Report filing endpoint for detected violations',
        status: 'PENDING', icon: Shield, docs: 'https://fincen.gov',
        config: 'FINCEN_API_KEY', configured: false,
    },
    {
        id: 'webhook', name: 'Webhook / SIEM', category: 'Alerting',
        description: 'Send violation events to your SIEM (Splunk, Datadog, etc.)',
        status: 'DISCONNECTED', icon: Globe, docs: '#',
        config: 'WEBHOOK_URL', configured: false,
    },
];

const ENV_VARS = [
    { key: 'NEXT_PUBLIC_API_URL', value: 'http://localhost:8000', masked: false },
    { key: 'GOOGLE_API_KEY', value: 'AIzaSy●●●●●●●●●●●●●●●●●●●●●●●●', masked: true },
    { key: 'IBM_AML_PATH', value: '/data/ibm_aml_dataset.csv', masked: false },
    { key: 'FINCEN_API_KEY', value: 'Not configured', masked: false },
];

const STATUS_STYLE: Record<string, { dot: string; badge: string }> = {
    CONNECTED: { dot: 'bg-[#1aff8c]', badge: 'text-[#1aff8c] bg-[rgba(26,255,140,0.08)] border-[rgba(26,255,140,0.25)]' },
    PENDING: { dot: 'bg-amber-400', badge: 'text-amber-400 bg-amber-950/30 border-amber-800/40' },
    DISCONNECTED: { dot: 'bg-[rgba(255,255,255,0.2)]', badge: 'text-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.1)]' },
};

const SCAN_SETTINGS = [
    { label: 'Scan Frequency', value: 'Every 5 minutes', editable: true },
    { label: 'AML Threshold Override', value: '$10,000 (BSA Default)', editable: true },
    { label: 'Auto-Freeze on Violation', value: 'Enabled', editable: true },
    { label: 'SAR Auto-Draft', value: 'Enabled (CRITICAL only)', editable: true },
    { label: 'Red Team Schedule', value: 'Weekly (Sundays 02:00 UTC)', editable: true },
    { label: 'Max Violations per Run', value: '500', editable: true },
];

export default function IntegrationHubPage() {
    const [copied, setCopied] = useState<string | null>(null);
    const [theme] = useState('dark');

    const copy = (val: string, key: string) => {
        navigator.clipboard.writeText(val).catch(() => { });
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const connected = INTEGRATIONS.filter(i => i.status === 'CONNECTED').length;

    return (
        <div className="space-y-6 pb-16">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-lg bg-[rgba(26,255,140,0.1)] border border-[rgba(26,255,140,0.2)]">
                        <Plug className="w-5 h-5 text-[#1aff8c]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Integration Hub</h1>
                        <p className="text-[rgba(26,255,140,0.5)] text-xs tracking-widest uppercase">Lexinel Connectors · Environment Config</p>
                    </div>
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                    Configure Lexinel's connections to AI engines, data sources, and regulatory reporting endpoints.
                </p>
            </div>

            {/* Status Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Connected', value: connected, color: 'text-[#1aff8c]' },
                    { label: 'Pending', value: INTEGRATIONS.filter(i => i.status === 'PENDING').length, color: 'text-amber-400' },
                    { label: 'Disconnected', value: INTEGRATIONS.filter(i => i.status === 'DISCONNECTED').length, color: 'text-[rgba(255,255,255,0.35)]' },
                    { label: 'Env Vars', value: ENV_VARS.length, color: 'text-blue-400' },
                ].map((s, i) => (
                    <div key={i} className="glass-card rounded-xl p-4">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Integrations */}
                <div className="glass-card rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-[rgba(26,255,140,0.08)]">
                        <h3 className="text-sm font-bold text-foreground">Active Connectors</h3>
                    </div>
                    <div className="divide-y divide-[rgba(26,255,140,0.06)]">
                        {INTEGRATIONS.map(intg => {
                            const s = STATUS_STYLE[intg.status];
                            return (
                                <div key={intg.id} className="flex items-start gap-4 px-5 py-4">
                                    <div className="p-2.5 rounded-xl bg-[rgba(26,255,140,0.06)] border border-[rgba(26,255,140,0.1)] flex-shrink-0">
                                        <intg.icon className="w-5 h-5 text-[#1aff8c]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-sm font-bold text-foreground">{intg.name}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${s.badge}`}>
                                                {intg.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-1">{intg.description}</p>
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className="text-[rgba(26,255,140,0.5)] font-mono">{intg.config}</span>
                                            <span className={`flex items-center gap-1 ${intg.configured ? 'text-[#1aff8c]' : 'text-[rgba(255,255,255,0.3)]'}`}>
                                                {intg.configured ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                {intg.configured ? 'Configured' : 'Missing key'}
                                            </span>
                                        </div>
                                    </div>
                                    <a href={intg.docs} target="_blank" rel="noreferrer"
                                        className="text-muted-foreground hover:text-[#1aff8c] transition-colors flex-shrink-0">
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                    {/* Env vars */}
                    <div className="glass-card rounded-xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-[rgba(26,255,140,0.08)] flex items-center gap-2">
                            <Key className="w-4 h-4 text-[#1aff8c]" />
                            <h3 className="text-sm font-bold text-foreground">Environment Variables</h3>
                        </div>
                        <div className="bg-[#030806] p-4 font-mono text-xs space-y-2">
                            {ENV_VARS.map(e => (
                                <div key={e.key} className="flex items-center gap-2">
                                    <span className="text-[rgba(26,255,140,0.6)] flex-shrink-0">{e.key}=</span>
                                    <span className={`flex-1 truncate ${e.masked ? 'text-[rgba(255,255,255,0.35)]' : 'text-amber-300'}`}>{e.value}</span>
                                    {!e.masked && (
                                        <button onClick={() => copy(e.value, e.key)}
                                            className="text-muted-foreground hover:text-[#1aff8c] transition-colors flex-shrink-0">
                                            {copied === e.key ? <CheckCircle2 className="w-3 h-3 text-[#1aff8c]" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Scan settings */}
                    <div className="glass-card rounded-xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-[rgba(26,255,140,0.08)] flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#1aff8c]" />
                            <h3 className="text-sm font-bold text-foreground">Sentinel Configuration</h3>
                        </div>
                        <div className="divide-y divide-[rgba(26,255,140,0.06)]">
                            {SCAN_SETTINGS.map((s, i) => (
                                <div key={i} className="flex items-center justify-between px-5 py-2.5">
                                    <span className="text-xs text-muted-foreground">{s.label}</span>
                                    <span className="text-xs font-medium text-foreground font-mono">{s.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="px-5 py-3 border-t border-[rgba(26,255,140,0.08)]">
                            <button className="text-xs text-[#1aff8c] font-bold hover:text-[#0de87a] transition-colors flex items-center gap-1.5">
                                <RefreshCw className="w-3.5 h-3.5" /> Save & Restart Sentinel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
