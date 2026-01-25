import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, FileText, Download, Shield, Activity, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Interfaces matching Backend Models ---

interface AISystemSpec {
    summary: string;
    primary_purpose: string;
    decision_authority: string;
    automation_level: string;
    deployment_stage: string;
    geographic_exposure: string[];
}

interface DataInteractionMap {
    data_categories_detected: string[];
    data_flow_source: string;
    data_storage_retention: string;
    cross_border_transfer: string;
}

export interface PolicyAlignment {
    policy_area: string;
    status: 'Compliant' | 'Partial Compliance' | 'At Risk' | 'Non-Compliant' | 'Cannot Be Assessed';
    reason: string;
}

interface RiskScore {
    overall_score: number;
    overall_rating: 'High' | 'Medium' | 'Low';
    breakdown: { [key: string]: 'High' | 'Medium' | 'Low' };
    confidence_score: 'High' | 'Medium' | 'Low';
}

interface EvidenceTrace {
    source_doc: string;
    policy_section: string;
    workflow_component: string;
    issue_description: string;
    severity: string;
    snippet: string;
}

interface Recommendation {
    title: string;
    type: 'Blocking' | 'Advisory' | 'Informational';
    description: string;
    related_policy: string;
}

interface DeploymentVerdict {
    approved: boolean;
    status_label: string;
    approval_conditions: string[];
    catastrophic_consequence?: string;
}

interface RiskSimulation {
    scenario_title: string;
    failure_mode: string;
    description: string;
    plausibility_grounding: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    violated_clause: string;
    confidence_level: 'High' | 'Medium' | 'Low';
}

interface ForensicDigest {
    policy_hash: string;
    workflow_hash: string;
    model_version: string;
    prompt_hash: string;
    combined_digest: string;
}

export interface ComplianceReport {
    report_id: string;
    timestamp: string;
    forensic_digest: ForensicDigest;
    system_spec: AISystemSpec;
    data_map: DataInteractionMap;
    policy_matrix: PolicyAlignment[];
    risk_assessment: RiskScore;
    evidence: EvidenceTrace[];
    risk_simulations: RiskSimulation[];
    recommendations: Recommendation[];
    verdict: DeploymentVerdict;
}

interface ReadinessScorecardProps {
    report: ComplianceReport;
    onDownload?: () => void;
}

export function ReadinessScorecard({ report, onDownload }: ReadinessScorecardProps) {
    const reportRef = useRef<HTMLDivElement>(null);

<<<<<<< HEAD
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

=======
>>>>>>> main
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Compliant': return 'text-green-600 bg-green-50 border-green-200';
            case 'Partial Compliance': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'At Risk': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'Non-Compliant': return 'text-red-600 bg-red-50 border-red-200';
            case 'Cannot Be Assessed': return 'text-zinc-600 bg-zinc-100 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
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
            <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    <div className="flex gap-4">
                        <span>Report ID: {report.report_id}</span>
                        <span>Analyzed: {new Date(report.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span>Tamper-Evident Forensic State</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col">
                        <span className="text-[8px] text-zinc-400 uppercase font-bold">Policy Hash</span>
                        <span className="text-[9px] font-mono text-zinc-600 truncate">{report.forensic_digest.policy_hash}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] text-zinc-400 uppercase font-bold">Workflow Hash</span>
                        <span className="text-[9px] font-mono text-zinc-600 truncate">{report.forensic_digest.workflow_hash}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] text-zinc-400 uppercase font-bold">Model Version</span>
                        <span className="text-[9px] font-mono text-zinc-600 truncate">{report.forensic_digest.model_version}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] text-zinc-400 uppercase font-bold">Prompt Hash</span>
                        <span className="text-[9px] font-mono text-zinc-600 truncate">{report.forensic_digest.prompt_hash}</span>
                    </div>
                </div>
            </div>

            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-md flex items-start gap-3 text-xs text-blue-800">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                    <strong>Demonstrative Compliance Analysis:</strong> This report identifies plausible failure classes using analogical reasoning.
                    It is a risk modeling tool for <strong>Human-in-the-Loop Authorization</strong>, not a legal guarantee.
                </p>
            </div>

            <div className="flex justify-end">
<<<<<<< HEAD
                <Button onClick={handleDownloadPDF} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export Forensic Audit Log
                </Button>
=======
                {onDownload && (
                    <Button onClick={onDownload} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download Certificate (PDF)
                    </Button>
                )}
>>>>>>> main
            </div>

            <div ref={reportRef} className="space-y-6 bg-white dark:bg-zinc-950 p-6 rounded-xl border shadow-sm">

                <div className="border-b pb-6 mb-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-900 uppercase tracking-wider">Fiduciary Shield: Compliance Accountability Digest</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Compliance Readiness Report
                    </h1>
                    <p className="text-slate-500 mt-1 italic text-sm">
                        Immutable forensic record of pre-deployment policy knowledge and risk discovery.
                    </p>
                </div>

                {/* Verdict Banner */}
                <div className={cn(
                    "p-6 rounded-lg border-2 flex items-center justify-between",
                    report.verdict.approved
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                        : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                )}>
                    <div>
                        <h2 className={cn("text-2xl font-bold mb-2", report.verdict.approved ? "text-green-700" : "text-red-700")}>
                            {report.verdict.status_label}
                        </h2>

                        {report.verdict.catastrophic_consequence && (
                            <div className="mb-4 p-3 bg-red-600 text-white rounded-md flex items-center gap-3 shadow-lg animate-bounce">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <div className="text-sm font-bold leading-tight">
                                    CATASTROPHIC RISK DISCOVERED:<br />
                                    <span className="font-normal opacity-90">{report.verdict.catastrophic_consequence}</span>
                                </div>
                            </div>
                        )}

                        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                            {report.verdict.approval_conditions.map((cond, i) => (
                                <li key={i}>{cond}</li>
                            ))}
                        </ul>
                    </div>
                    {report.verdict.approved
                        ? <CheckCircle className="w-16 h-16 text-green-500" />
                        : <XCircle className="w-16 h-16 text-red-500" />
                    }
                </div>

                {/* New Section: Counterfactual Risk Simulations */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        Relational Risk Modeling (Analogy-Based)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report.risk_simulations.map((sim, i) => (
                            <div key={i} className="p-4 rounded-lg border bg-zinc-50 dark:bg-zinc-900/50 space-y-3">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{sim.scenario_title}</h4>
                                    {/* @ts-ignore */}
                                    <Badge variant="outline" className={getRiskColor(sim.severity)}>{sim.severity} Risk</Badge>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                                    "{sim.description}"
                                </p>
                                <div className="pt-2 border-t space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                        <Shield className="w-3 h-3 text-blue-500" />
                                        <span className="font-semibold uppercase tracking-tighter text-blue-600">Plausible Failure Class:</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
                                        {sim.plausibility_grounding}
                                    </p>

                                    {/* Real-World Mapping */}
                                    {Object.entries(realWorldGrounding).map(([key, value]) => (
                                        sim.failure_mode.includes(key) && (
                                            <div key={key} className="mt-2 p-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 flex flex-col gap-1">
                                                <div className="text-[9px] font-bold text-red-600 uppercase tracking-tighter italic">Comparative Precedent (Analogy)</div>
                                                <div className="text-[10px] text-zinc-800 dark:text-zinc-200">
                                                    <strong>{value.company}:</strong> {value.impact}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <div className="text-[10px] text-zinc-400">Policy Trace: {sim.violated_clause}</div>
                                    <div className="text-[10px] font-medium text-zinc-500 border rounded px-1.5 py-0.5">Analogy Confidence: {sim.confidence_level}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 1. System Spec */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-500" />
                                Inferred System Spec
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <p className="italic text-gray-500">"{report.system_spec.summary}"</p>
                            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                                <div className="font-medium text-gray-500">Purpose</div>
                                <div>{report.system_spec.primary_purpose}</div>

                                <div className="font-medium text-gray-500">Decision Authority</div>
                                <div>{report.system_spec.decision_authority}</div>

                                <div className="font-medium text-gray-500">Automation</div>
                                <div>{report.system_spec.automation_level}</div>

                                <div className="font-medium text-gray-500">Geography</div>
                                <div className="flex gap-1 flex-wrap">
                                    {report.system_spec.geographic_exposure.map(r => (
                                        <Badge key={r} variant="outline">{r}</Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. Risk Assessment */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="w-5 h-5 text-purple-500" />
                                Risk Assessment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <div className="text-3xl font-bold">{report.risk_assessment.overall_score}/100</div>
                                    <div className={cn("font-semibold", getRiskColor(report.risk_assessment.overall_rating))}>
                                        {report.risk_assessment.overall_rating} Risk
                                    </div>
                                </div>
                                <div className="text-right text-xs text-gray-500">
                                    Confidence: <span className="font-medium">{report.risk_assessment.confidence_score}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {Object.entries(report.risk_assessment.breakdown).map(([key, val]) => (
                                    <div key={key} className="flex justify-between items-center text-sm border-b pb-1 last:border-0">
                                        <span>{key} Risk</span>
                                        <Badge variant="secondary" className={getRiskColor(val)}>{val}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Data Map */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Globe className="w-5 h-5 text-indigo-500" />
                            Data Interaction Map
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <h4 className="font-semibold mb-2">Detected Categories</h4>
                            <div className="flex flex-wrap gap-2">
                                {report.data_map.data_categories_detected.map((cat, i) => (
                                    <Badge key={i}>{cat}</Badge>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between border-b pb-1">
                                <span className="text-gray-500">Source</span>
                                <span>{report.data_map.data_flow_source}</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                                <span className="text-gray-500">Retention</span>
                                <span>{report.data_map.data_storage_retention}</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                                <span className="text-gray-500">Cross-Border</span>
                                <span>{report.data_map.cross_border_transfer}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Policy Matrix */}
                <Card>
                    <CardHeader className="pb-3 text-sm">
                        <CardTitle className="text-lg flex justify-between items-center">
                            <span>Policy Alignment Matrix</span>
                            <div className="flex gap-1.5 items-center px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-[10px] text-blue-700 dark:text-blue-300 font-bold uppercase tracking-tighter">
                                <Activity className="w-3 h-3" />
                                <span>Reasoning Node Required</span>
                                <div className="group relative">
                                    <div className="cursor-help underline decoration-dotted">?</div>
                                    <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-48 p-2 bg-zinc-900 text-white text-[9px] lowercase font-normal rounded shadow-xl z-50">
                                        This system degrades sharp without long-context reasoning models (Gemini) capable of semantic conflict discovery.
                                    </div>
                                </div>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {report.policy_matrix.map((pol, i) => (
                            <div key={i} className="flex items-start justify-between p-3 rounded-lg border bg-gray-50 dark:bg-zinc-900/50">
                                <div className="space-y-1">
                                    <div className="font-medium">{pol.policy_area}</div>
                                    <div className="text-xs text-gray-500">{pol.reason}</div>
                                </div>
                                <div className={cn("px-2 py-1 rounded text-xs font-medium border whitespace-nowrap", getStatusColor(pol.status))}>
                                    {pol.status}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* 6. Recommendations */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Guardrail Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {report.recommendations.map((rec, i) => (
                            <div key={i} className="flex gap-4">
                                <div className={cn("mt-1 w-2 h-2 rounded-full shrink-0",
                                    rec.type === 'Blocking' ? 'bg-red-500' :
                                        rec.type === 'Advisory' ? 'bg-amber-500' : 'bg-blue-500')} />
                                <div>
                                    <div className="font-medium text-sm flex items-center gap-2">
                                        {rec.title}
                                        <Badge variant="outline" className="text-[10px] h-5">{rec.type}</Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{rec.description}</p>
                                    <p className="text-xs text-gray-400 mt-1">Ref: {rec.related_policy}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* 5. Evidence */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5 text-red-500" />
                            Forensic Evidence & Traceability
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {report.evidence.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No direct violation evidence found.</p>
                        ) : (
                            <div className="relative overflow-x-auto rounded-md border">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-zinc-900 border-b">
                                        <tr>
                                            <th className="px-4 py-3">Severity</th>
                                            <th className="px-4 py-3">Policy Clause</th>
                                            <th className="px-4 py-3">Workflow Component</th>
                                            <th className="px-4 py-3">Forensic Finding</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.evidence.map((ev, i) => (
                                            <tr key={i} className="bg-white dark:bg-zinc-950 border-b last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-900/50">
                                                <td className="px-4 py-4 font-medium">
                                                    <Badge variant="outline" className={cn(
                                                        ev.severity === 'High' ? "border-red-500 text-red-600 bg-red-50" :
                                                            ev.severity === 'Medium' ? "border-amber-500 text-amber-600 bg-amber-50" :
                                                                "border-blue-500 text-blue-600 bg-blue-50"
                                                    )}>
                                                        {ev.severity}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4 max-w-xs">
                                                    <div className="font-semibold text-gray-900 dark:text-gray-100">{ev.policy_section}</div>
                                                </td>
                                                <td className="px-4 py-4 text-gray-500">
                                                    {ev.workflow_component}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="text-gray-900 dark:text-gray-200 mb-1">{ev.issue_description}</div>
                                                    <div className="text-xs text-gray-500 italic bg-gray-100 dark:bg-zinc-900 p-2 rounded border-l-2 border-red-300">
                                                        "{ev.snippet}"
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
