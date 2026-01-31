"use client";

import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle, XCircle, AlertTriangle, FileText, Download, Shield, Activity, Globe, Target as TargetIcon, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ComplianceReport } from '@/types/policy';

interface ReadinessScorecardProps {
    report: ComplianceReport;
    onDownload?: () => void;
}

export function ReadinessScorecard({ report, onDownload }: ReadinessScorecardProps) {
    const reportRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState("summary");

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        const canvas = await html2canvas(reportRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Compliance_Forensics_${report.report_id}.pdf`);
    };
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Compliant': return 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50';
            case 'Partial Compliance': return 'text-amber-400 bg-amber-950/30 border-amber-900/50';
            case 'At Risk': return 'text-orange-400 bg-orange-950/30 border-orange-900/50';
            case 'Non-Compliant': return 'text-red-400 bg-red-950/30 border-red-900/50';
            case 'Cannot Be Assessed': return 'text-slate-400 bg-slate-900 border-slate-700';
            default: return 'text-slate-400 bg-slate-900 border-slate-800';
        }
    };

    const getRiskColor = (severity: string) => {
        switch (severity) {
            case 'High': return 'bg-red-100 text-red-700 border-red-200';
            case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Low': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    // Map of failure modes to real-world impact cases for "Plausibility Grounding"
    const realWorldGrounding: { [key: string]: { company: string, impact: string } } = {
        "Prompt Injection": { company: "Chevrolet", impact: "Chatbot tricked into selling a vehicle for $1." },
        "Data Exfiltration": { company: "Samsung", impact: "Sensitive source code leaked via employee ChatGPT usage." },
        "Algorithmic Bias": { company: "Amazon", impact: "Scrapped hiring AI that discriminated against women." },
        "Unauthorized Commitment": { company: "Air Canada", impact: "Legally held to a refund policy hallucinated by a chatbot ($812 fine)." },
        "Deceptive Claims": { company: "DoNotPay", impact: "FTC settlement ($193k) for unsubstantiated legal service claims." }
    };

    return (
        <div className="space-y-4">
            {/* Disclaimer Banner */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-lg flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200 mb-6 shadow-sm">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <p>
                    <strong className="font-semibold text-blue-700 dark:text-blue-300">Demonstrative Compliance Analysis:</strong> This report identifies plausible failure classes using analogical reasoning.
                    It is a risk modeling tool for <strong className="font-semibold text-blue-700 dark:text-blue-300">Human-in-the-Loop Authorization</strong>, not a legal guarantee.
                </p>
            </div>

            <div ref={reportRef} className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl">

                {/* Header always visible */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-400 uppercase tracking-wider">Fiduciary Shield: Compliance Accountability Digest</span>
                    </div>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Compliance Readiness Report</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 italic text-sm">
                                Immutable forensic record of pre-deployment policy knowledge and risk discovery.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Badge className="bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] uppercase font-bold tracking-tight">Indispensable Gemini Reasoning</Badge>
                            <Badge className="bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] uppercase font-bold tracking-tight">Cross-Policy Contradiction Detection</Badge>
                        </div>
                    </div>
                </div>

                {/* TABS NAVIGATION */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto mb-6 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                        <TabsTrigger value="summary" className="text-xs">Verdict</TabsTrigger>
                        <TabsTrigger value="risk" className="text-xs">Scenarios</TabsTrigger>
                        <TabsTrigger value="spec" className="text-xs">Spec</TabsTrigger>
                        <TabsTrigger value="impact" className="text-xs">Impact</TabsTrigger>
                        <TabsTrigger value="data" className="text-xs">Data Map</TabsTrigger>
                        <TabsTrigger value="policy" className="text-xs">Alignment</TabsTrigger>
                        <TabsTrigger value="remediation" className="text-xs">Fixes</TabsTrigger>
                        <TabsTrigger value="evidence" className="text-xs">Forensics</TabsTrigger>
                    </TabsList>

                    {/* 1. EXECUTIVE VERDICT */}
                    <TabsContent value="summary" className="space-y-6 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className={cn(
                            "p-8 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm",
                            report.verdict.approved
                                ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50"
                                : "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50"
                        )}>
                            <div className="flex-1">
                                <h2 className={cn("text-3xl font-bold mb-3", report.verdict.approved ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400")}>
                                    {report.verdict.status_label}
                                </h2>

                                {report.verdict.catastrophic_consequence && (
                                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg flex items-start gap-3 shadow-sm max-w-2xl">
                                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 mb-1">Catastrophic Risk Discovered</div>
                                            <div className="font-medium leading-relaxed text-red-900 dark:text-red-200">{report.verdict.catastrophic_consequence}</div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-200">Approval Conditions:</h4>
                                    <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1 ml-1">
                                        {report.verdict.approval_conditions.map((cond, i) => (
                                            <li key={i}>{cond}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            {report.verdict.approved
                                ? <CheckCircle className="w-32 h-32 text-emerald-500 opacity-20" />
                                : <XCircle className="w-32 h-32 text-red-500 opacity-20" />
                            }
                        </div>
                    </TabsContent>

                    {/* 2. RISK SCENARIOS */}
                    <TabsContent value="risk" className="space-y-6 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6 text-amber-600" />
                                Relational Risk Modeling (Analogy-Based)
                            </h3>
                            <Badge variant="outline" className="h-7 text-sm">Confidence: {report.risk_assessment.confidence_score}</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {report.risk_simulations.map((sim, i) => (
                                <div key={i} className="p-5 rounded-lg border bg-zinc-50 dark:bg-zinc-900/30 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{sim.scenario_title}</h4>
                                        <Badge className={getRiskColor(sim.severity)}>{sim.severity}</Badge>
                                    </div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic mb-4 border-l-2 border-zinc-200 pl-3">
                                        "{sim.description}"
                                    </p>

                                    <div className="space-y-3 pt-3 border-t border-dashed">
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
                                                <Shield className="w-3 h-3" /> Plausible Failure Class
                                            </div>
                                            <p className="text-xs text-zinc-700 dark:text-zinc-300">{sim.plausibility_grounding}</p>
                                        </div>

                                        {Object.entries(realWorldGrounding).map(([key, value]) => (
                                            sim.failure_mode.includes(key) && (
                                                <div key={key} className="p-2.5 rounded bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                                                    <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Comparative Precedent</div>
                                                    <div className="text-xs text-zinc-800 dark:text-zinc-200">
                                                        <span className="font-bold">{value.company}:</span> {value.impact}
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider">
                                        <span>Violated: {sim.violated_clause}</span>
                                        <span>Conf: {sim.confidence_level}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* 3. SYSTEM SPEC */}
                    <TabsContent value="spec" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="w-6 h-6 text-blue-500" />
                                    Inferred System Specification
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border italic text-gray-600 dark:text-gray-300 text-lg text-center">
                                    "{report.system_spec.summary}"
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Agent Name</h4>
                                            <div className="font-mono text-sm border p-2 rounded">{report.system_spec.agent_name}</div>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Primary Purpose</h4>
                                            <div className="text-sm">{report.system_spec.primary_purpose}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Spec Metadata</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between border-b pb-1">
                                                    <span className="text-gray-500">Authority</span>
                                                    <span>{report.system_spec.decision_authority}</span>
                                                </div>
                                                <div className="flex justify-between border-b pb-1">
                                                    <span className="text-gray-500">Automation</span>
                                                    <span>{report.system_spec.automation_level}</span>
                                                </div>
                                                <div className="flex justify-between border-b pb-1">
                                                    <span className="text-gray-500">Region</span>
                                                    <div className="flex gap-1">
                                                        {report.system_spec.geographic_exposure.map(r => (
                                                            <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 4. BUSINESS IMPACT */}
                    <TabsContent value="impact" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {report.business_impact && (
                            <Card className="bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TargetIcon className="w-6 h-6 text-red-500" />
                                        Potential Business Impact Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Financial Exposure</h4>
                                                <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">High Severity</Badge>
                                            </div>
                                            <div className="text-2xl font-bold text-red-600 mb-2">{report.business_impact.financial_exposure}</div>
                                            <p className="text-sm text-gray-500">Estimated risk of direct financial loss due to liability or fraud.</p>
                                        </div>

                                        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Remediation Cost</h4>
                                                <Activity className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div className="text-2xl font-bold text-blue-600 mb-2">{report.business_impact.estimated_cost}</div>
                                            <p className="text-sm text-gray-500">Projected cost for legal, technical, and operational fixes.</p>
                                        </div>

                                        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm md:col-span-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Regulatory Penalty</h4>
                                                    <div className="font-medium text-lg leading-snug">{report.business_impact.regulatory_penalty}</div>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Brand Reputation</h4>
                                                    <div className="font-medium text-lg leading-snug">{report.business_impact.brand_reputation}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* 5. DATA MAP */}
                    <TabsContent value="data" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="w-6 h-6 text-indigo-500" />
                                    Data Interaction Map
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-8">
                                    <div>
                                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Detected Categories</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {report.data_map.data_categories_detected.map((cat, i) => (
                                                <Badge key={i} className="pl-2 pr-2 py-1 text-sm bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
                                                    {cat}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-6 border">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2 text-zinc-500">
                                                    <Network className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Source</span>
                                                </div>
                                                <div className="font-medium">{report.data_map.data_flow_source}</div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-2 text-zinc-500">
                                                    <Shield className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Retention</span>
                                                </div>
                                                <div className="font-medium">{report.data_map.data_storage_retention}</div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-2 text-zinc-500">
                                                    <Globe className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Sovereignty</span>
                                                </div>
                                                <div className="font-medium">{report.data_map.cross_border_transfer}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 6. POLICY ALIGNMENT */}
                    <TabsContent value="policy" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center text-slate-900 dark:text-slate-50">
                                    <span>Policy Alignment Matrix</span>
                                    <Badge variant="outline" className="font-normal text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900">
                                        Evaluated against {report.policy_matrix.length} Clauses
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {report.policy_matrix.map((pol, i) => (
                                    <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">
                                        <div className="flex-1 space-y-2 mb-2 md:mb-0 pr-4">
                                            <div className="font-bold text-base text-slate-900 dark:text-slate-100">{pol.policy_area}</div>
                                            <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{pol.reason}</div>
                                        </div>
                                        <Badge className={cn("self-start md:self-center whitespace-nowrap px-4 py-1.5 text-sm font-semibold border shadow-sm", getStatusColor(pol.status))}>
                                            {pol.status}
                                        </Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 7. REMEDIATION */}
                    <TabsContent value="remediation" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card className="border-l-4 border-l-blue-500">
                            <CardHeader className="bg-blue-50/30 dark:bg-blue-900/10 pb-4">
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="w-6 h-6 text-blue-600" />
                                    Guardrail Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {report.recommendations.map((rec, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all">
                                        <div className={cn("mt-1.5 w-3 h-3 rounded-full shrink-0 shadow-sm",
                                            rec.type === 'Blocking' ? 'bg-red-500' :
                                                rec.type === 'Advisory' ? 'bg-amber-500' : 'bg-blue-500')} />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="font-bold text-base">{rec.title}</div>
                                                <Badge variant="secondary" className="text-xs">{rec.type}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2">{rec.description}</p>
                                            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                                                <FileText className="w-3 h-3" />
                                                Reference: {rec.related_policy}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 8. FORENSICS */}
                    {/* 8. FORENSICS */}
                    <TabsContent value="evidence" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
                                    <FileText className="w-6 h-6 text-red-500" />
                                    Forensic Evidence Log
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {report.evidence.length === 0 ? (
                                    <div className="text-center p-8 text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-50" />
                                        No direct violation evidence found in this audit pass.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {report.evidence.map((ev, i) => (
                                            <div key={i} className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-3 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className={cn(
                                                            "border shadow-sm",
                                                            ev.severity === 'High' ? "border-red-500/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30" :
                                                                ev.severity === 'Medium' ? "border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30" :
                                                                    "border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
                                                        )}>
                                                            {ev.severity} Severity
                                                        </Badge>
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{ev.policy_section}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-400 font-mono tracking-tight">{ev.workflow_component}</span>
                                                </div>

                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-300 leading-relaxed">{ev.issue_description}</p>

                                                <div className="bg-white dark:bg-black/40 p-4 rounded-lg border border-red-100 dark:border-red-900/30 text-xs font-mono text-red-600 dark:text-red-400 break-all leading-relaxed">
                                                    "{ev.snippet}"
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 border-dashed">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Immutable Cryptographic Proof</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg font-mono text-[10px] border border-slate-200 dark:border-slate-800">
                                            <div className="text-slate-500 mb-1">Report ID</div>
                                            <div className="truncate text-slate-700 dark:text-slate-300">{report.report_id}</div>
                                        </div>
                                        <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg font-mono text-[10px] border border-slate-200 dark:border-slate-800">
                                            <div className="text-slate-500 mb-1">Policy Hash</div>
                                            <div className="truncate text-slate-700 dark:text-slate-300">{report.forensic_digest.policy_hash}</div>
                                        </div>
                                        <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg font-mono text-[10px] border border-slate-200 dark:border-slate-800">
                                            <div className="text-slate-500 mb-1">Workflow Hash</div>
                                            <div className="truncate text-slate-700 dark:text-slate-300">{report.forensic_digest.workflow_hash}</div>
                                        </div>
                                        <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg font-mono text-[10px] border border-slate-200 dark:border-slate-800">
                                            <div className="text-slate-500 mb-1">Model Version</div>
                                            <div className="truncate text-slate-700 dark:text-slate-300">{report.forensic_digest.model_version}</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div >
    )
}
