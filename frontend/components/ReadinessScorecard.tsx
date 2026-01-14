import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, FileText, Download, Shield, Activity, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

interface PolicyAlignment {
    policy_area: string;
    status: 'Compliant' | 'Partial Compliance' | 'At Risk' | 'Non-Compliant';
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
}

export interface ComplianceReport {
    system_spec: AISystemSpec;
    data_map: DataInteractionMap;
    policy_matrix: PolicyAlignment[];
    risk_assessment: RiskScore;
    evidence: EvidenceTrace[];
    recommendations: Recommendation[];
    verdict: DeploymentVerdict;
}

interface ReadinessScorecardProps {
    report: ComplianceReport;
}

export function ReadinessScorecard({ report }: ReadinessScorecardProps) {
    const reportRef = useRef<HTMLDivElement>(null);

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;

        try {
            const canvas = await html2canvas(reportRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('PolicyGuard_Compliance_Report.pdf');
        } catch (error) {
            console.error("PDF Export failed:", error);
            alert("Failed to export PDF.");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Compliant': return 'text-green-600 bg-green-50 border-green-200';
            case 'Partial Compliance': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'At Risk': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'Non-Compliant': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'High': return 'text-red-600';
            case 'Medium': return 'text-amber-600';
            case 'Low': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleDownloadPDF} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report PDF
                </Button>
            </div>

            <div ref={reportRef} className="space-y-6 bg-white dark:bg-zinc-950 p-6 rounded-xl border shadow-sm">

                {/* 7. Verdict Banner (Top for Impact) */}
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
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Policy Alignment Matrix</CardTitle>
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
                <div className="p-4 bg-gray-100 dark:bg-zinc-900 rounded-lg text-sm">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Evidence Traceability
                    </h4>
                    <div className="space-y-3">
                        {report.evidence.map((ev, i) => (
                            <div key={i} className="pl-3 border-l-2 border-gray-300">
                                <p className="italic text-gray-600">"{ev.snippet}"</p>
                                <p className="text-xs text-blue-600 font-medium mt-1">Source: {ev.source_doc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
