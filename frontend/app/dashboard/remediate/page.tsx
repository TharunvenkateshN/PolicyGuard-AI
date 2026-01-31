"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RemediationPanel } from '@/components/dashboard/RemediationPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Wrench, AlertTriangle, CheckCircle2, Activity, BookOpen, Code, FileText, Lightbulb, Sparkles, ArrowRight, Download } from 'lucide-react';
import { useToast } from '@/components/ui/toast-context';

interface Violation {
    policy_area: string;
    status: string;
    reason: string;
}

export default function RemediatePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { addToast } = useToast();

    const [violations, setViolations] = useState<Violation[]>([]);
    const [workflowName, setWorkflowName] = useState<string>('');
    const [workflowDescription, setWorkflowDescription] = useState<string>('');
    const [policySummary, setPolicySummary] = useState<string>('');
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Interactive demo state
    const [demoMode, setDemoMode] = useState(false);
    const [selectedDemoViolation, setSelectedDemoViolation] = useState<string | null>(null);

    useEffect(() => {
        // Try to get data from URL params
        const violationsParam = searchParams.get('violations');
        const workflowParam = searchParams.get('workflow');
        const descriptionParam = searchParams.get('description');
        const policyParam = searchParams.get('policy');
        const reportParam = searchParams.get('report');

        if (violationsParam) {
            try {
                const parsedViolations = JSON.parse(decodeURIComponent(violationsParam));
                setViolations(parsedViolations);
            } catch (e) {
                console.error('Failed to parse violations:', e);
            }
        }

        if (workflowParam) {
            setWorkflowName(decodeURIComponent(workflowParam));
        }

        if (descriptionParam) {
            setWorkflowDescription(decodeURIComponent(descriptionParam));
        }

        if (policyParam) {
            setPolicySummary(decodeURIComponent(policyParam));
        }

        if (reportParam) {
            try {
                const parsedReport = JSON.parse(decodeURIComponent(reportParam));
                setReport(parsedReport);
            } catch (e) {
                console.error('Failed to parse report:', e);
            }
        }

        // Fallback: Try to get from sessionStorage
        if (!violationsParam) {
            const storedContext = sessionStorage.getItem('remediation-context');
            if (storedContext) {
                try {
                    const context = JSON.parse(storedContext);
                    setViolations(context.violations || []);
                    setWorkflowName(context.workflowName || '');
                    setWorkflowDescription(context.workflowDescription || '');
                    setPolicySummary(context.policySummary || '');
                    setReport(context.report || null);
                } catch (e) {
                    console.error('Failed to parse stored context:', e);
                }
            }
        }

        setLoading(false);
    }, [searchParams]);

    const handleBack = () => {
        router.push('/dashboard/evaluate');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    const autoStart = searchParams.get('autoStart') === 'true';

    if (violations.length === 0 && !autoStart) {
        return (
            <div className="space-y-10 max-w-[1400px] mx-auto pb-20">
                {/* Simple Header */}
                <div className="border-l-4 border-purple-600 pl-6 py-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                        Automated Remediation
                    </h1>
                    <p className="text-muted-foreground mt-3 text-lg font-medium">
                        AI-powered fixes for compliance violations
                    </p>
                </div>

                {/* What This Does */}
                <Card className="border-none shadow-xl shadow-purple-500/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-2xl font-bold text-foreground">What is This?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-muted-foreground leading-relaxed">
                            When violations are detected, this feature generates two types of fixes:
                        </p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2 text-lg">Document Fixes</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                            Updated workflow documentation with proper compliance language
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-green-50/50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                                        <Code className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2 text-lg">Code Guardrails</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                            Production-ready Python code for policy enforcement
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* How to Use */}
                <Card className="border-none shadow-xl shadow-purple-500/5">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-2xl font-bold text-foreground">How to Use</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="space-y-8">
                            <li className="flex gap-6">
                                <span className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center font-black text-xl">1</span>
                                <div className="pt-1">
                                    <h4 className="font-bold text-foreground mb-2 text-lg">Run Evaluation</h4>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Analyze your workflow on the Evaluate page to identify specific risks.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-6">
                                <span className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-500/30 flex items-center justify-center font-black text-xl">2</span>
                                <div className="pt-1">
                                    <h4 className="font-bold text-foreground mb-2 text-lg">Review Violations</h4>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Review the detailed compliance report and forensic audit trail.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-6">
                                <span className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-2xl shadow-lg shadow-green-500/30 flex items-center justify-center font-black text-xl">3</span>
                                <div className="pt-1">
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2 text-lg">Generate AI Fixes</h4>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                        One-click generation of audit-ready documentation and policy guardrails.
                                    </p>
                                </div>
                            </li>
                        </ol>
                    </CardContent>
                </Card>

                {/* Real Examples */}
                <Card className="border-none shadow-xl shadow-purple-500/5">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-2xl font-bold text-foreground">Example Scenarios</CardTitle>
                        <CardDescription className="text-muted-foreground mt-2 text-base">
                            Common policy violations resolved by our AI engine.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-6">
                        <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <Badge className="bg-blue-600 text-white font-black px-2.5 py-1">GDPR</Badge>
                                <span className="font-bold text-slate-900 dark:text-slate-100">Missing Consent</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Generates consent validation code and audit documentation.
                            </p>
                        </div>

                        <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-green-100 dark:border-green-900/30">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <Badge className="bg-green-600 text-white font-black px-2.5 py-1">HIPAA</Badge>
                                <span className="font-bold text-slate-900 dark:text-slate-100">Unencrypted PHI</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Provides encryption utilities and safe transmission protocols.
                            </p>
                        </div>

                        <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <Badge className="bg-purple-600 text-white font-black px-2.5 py-1">SOC2</Badge>
                                <span className="font-bold text-slate-900 dark:text-slate-100">Access Control</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Creates RBAC implementation guides and policy templates.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* What You'll Get */}
                <Card className="border-none shadow-xl shadow-purple-500/5">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-2xl font-bold text-foreground">System Outputs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="flex items-start gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl">
                                <CheckCircle2 className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-slate-100 mb-1">Violation-Specific Fixes</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">High-precision solutions tailored to your exact policy failures.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl">
                                <CheckCircle2 className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-slate-100 mb-1">Production-Ready Code</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Optimized Python guardrails including comprehensive error handling.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl">
                                <CheckCircle2 className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-slate-100 mb-1">Audit-Ready Documentation</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Formal documentation ready for submission to compliance officers.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl">
                                <CheckCircle2 className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-slate-100 mb-1">Multi-Format Export</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Seamlessly export all fixes as Markdown, PDF, or Python assets.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sample Remediation Examples */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-slate-900 dark:text-slate-100">Sample Remediation Examples</CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                            Click any violation to see example fixes
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!selectedDemoViolation ? (
                            <div className="grid gap-3 md:grid-cols-2">
                                <button
                                    onClick={() => setSelectedDemoViolation('gdpr')}
                                    className="p-4 text-left bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-blue-600 text-white">GDPR</Badge>
                                        <span className="font-semibold text-slate-900 dark:text-slate-100">Missing Consent</span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        User data processing without explicit consent collection
                                    </p>
                                </button>

                                <button
                                    onClick={() => setSelectedDemoViolation('hipaa')}
                                    className="p-4 text-left bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-green-500 dark:hover:border-green-500 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-green-600 text-white">HIPAA</Badge>
                                        <span className="font-semibold text-slate-900 dark:text-slate-100">Unencrypted PHI</span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Protected Health Information sent without encryption
                                    </p>
                                </button>

                                <button
                                    onClick={() => setSelectedDemoViolation('soc2')}
                                    className="p-4 text-left bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-purple-600 text-white">SOC2</Badge>
                                        <span className="font-semibold text-slate-900 dark:text-slate-100">Weak Access Control</span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        No role-based access control for sensitive operations
                                    </p>
                                </button>

                                <button
                                    onClick={() => setSelectedDemoViolation('pci')}
                                    className="p-4 text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-red-600 text-white">PCI-DSS</Badge>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">Card Data Storage</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Storing sensitive payment card data in plain text
                                    </p>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Sample Remediation Output</h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedDemoViolation(null)}
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-1" />
                                        Back
                                    </Button>
                                </div>

                                {selectedDemoViolation === 'gdpr' && (
                                    <div className="space-y-3">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                                            <div className="flex items-center gap-2 mb-3">
                                                <FileText className="w-4 h-4 text-blue-600" />
                                                <h5 className="font-semibold text-gray-900 dark:text-gray-100">Document Fix</h5>
                                            </div>
                                            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2 font-mono bg-white dark:bg-slate-950 p-3 rounded">
                                                <p><strong>Section 3.2: User Consent</strong></p>
                                                <p>Before processing any personal data, the system MUST:</p>
                                                <p>1. Present clear consent form explaining data usage</p>
                                                <p>2. Obtain explicit user agreement (checkbox + timestamp)</p>
                                                <p>3. Store consent record with user ID and timestamp</p>
                                                <p>4. Allow users to withdraw consent at any time</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Code className="w-4 h-4 text-green-600" />
                                                <h5 className="font-semibold text-slate-900 dark:text-slate-100">Code Guardrail</h5>
                                            </div>
                                            <pre className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 p-3 rounded overflow-x-auto">
                                                {`def validate_user_consent(user_id: str) -> bool:
    """Validate user has given consent before processing data"""
    consent = db.get_consent_record(user_id)
    if not consent or not consent.is_active:
        raise ConsentRequiredError(
            f"User {user_id} has not provided consent"
        )
    logger.info(f"Consent validated for user {user_id}")
    return True`}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {selectedDemoViolation === 'hipaa' && (
                                    <div className="space-y-3">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="w-4 h-4 text-blue-600" />
                                                <h5 className="font-semibold text-gray-900 dark:text-gray-100">Document Fix</h5>
                                            </div>
                                            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2 font-mono bg-white dark:bg-gray-900 p-3 rounded">
                                                <p><strong>Section 4.1: PHI Transmission Security</strong></p>
                                                <p>All PHI transmissions MUST use:</p>
                                                <p>1. TLS 1.2 or higher for data in transit</p>
                                                <p>2. AES-256 encryption for data at rest</p>
                                                <p>3. Certificate-based authentication</p>
                                                <p>4. Audit logging for all PHI access</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Code className="w-4 h-4 text-green-600" />
                                                <h5 className="font-semibold text-gray-900 dark:text-gray-100">Code Guardrail</h5>
                                            </div>
                                            <pre className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 p-3 rounded overflow-x-auto">
                                                {`from cryptography.fernet import Fernet

def encrypt_phi(data: dict) -> bytes:
    """Encrypt PHI before transmission"""
    key = get_encryption_key()
    cipher = Fernet(key)
    encrypted = cipher.encrypt(json.dumps(data).encode())
    audit_log.record_phi_encryption(data['patient_id'])
    return encrypted`}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {selectedDemoViolation === 'soc2' && (
                                    <div className="space-y-3">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="w-4 h-4 text-blue-600" />
                                                <h5 className="font-semibold text-gray-900 dark:text-gray-100">Document Fix</h5>
                                            </div>
                                            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2 font-mono bg-white dark:bg-slate-950 p-3 rounded">
                                                <p><strong>Section 5.3: Access Control Policy</strong></p>
                                                <p>Implement role-based access control (RBAC):</p>
                                                <p>1. Define roles: admin, analyst, viewer</p>
                                                <p>2. Assign minimum necessary permissions</p>
                                                <p>3. Require authentication for all operations</p>
                                                <p>4. Log all access attempts and changes</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Code className="w-4 h-4 text-green-600" />
                                                <h5 className="font-semibold text-slate-900 dark:text-slate-100">Code Guardrail</h5>
                                            </div>
                                            <pre className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 p-3 rounded overflow-x-auto">
                                                {`def require_role(required_role: str):
                                    """Decorator to enforce role-based access"""
                                    def decorator(func):
                                        def wrapper(*args, **kwargs):
                                            user = get_current_user()
                                            if not user.has_role(required_role):
                                                raise PermissionDeniedError()
                                            return func(*args, **kwargs)
                                        return wrapper
                                    return decorator`}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {selectedDemoViolation === 'pci' && (
                                    <div className="space-y-3">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="w-4 h-4 text-blue-600" />
                                                <h5 className="font-semibold text-gray-900 dark:text-gray-100">Document Fix</h5>
                                            </div>
                                            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2 font-mono bg-white dark:bg-gray-900 p-3 rounded">
                                                <p><strong>Section 6.1: Payment Data Handling</strong></p>
                                                <p>Card data MUST be tokenized:</p>
                                                <p>1. Never store full PAN (Primary Account Number)</p>
                                                <p>2. Use payment gateway tokenization</p>
                                                <p>3. Store only last 4 digits for display</p>
                                                <p>4. Implement PCI DSS compliant logging</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Code className="w-4 h-4 text-green-600" />
                                                <h5 className="font-semibold text-gray-900 dark:text-gray-100">Code Guardrail</h5>
                                            </div>
                                            <pre className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 p-3 rounded overflow-x-auto">
                                                {`def tokenize_card(card_number: str) -> str:
                                    """Tokenize card number via payment gateway"""
                                    # Never log or store full card number
                                    token = payment_gateway.tokenize(card_number)
                                    last_four = card_number[-4:]
                                    db.store_payment_method(token, last_four)
                                    return token  # Return token, not card number`}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* CTA */}
                <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                    <CardContent className="py-8">
                        <div className="text-center space-y-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Ready to Get Started?</h3>
                            <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                                Run a compliance evaluation first to identify violations in your AI workflow. Then return here to generate automated fixes.
                            </p>
                            <Button
                                onClick={handleBack}
                                size="lg"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                <Activity className="w-5 h-5 mr-2" />
                                Go to Evaluate Page
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const failedViolations = violations.filter(v => v.status !== 'Compliant' && v.status !== 'Pass');
    const passedChecks = violations.filter(v => v.status === 'Compliant' || v.status === 'Pass');

    return (
        <div className="space-y-10 max-w-[1400px] mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Button variant="ghost" onClick={handleBack} className="hover:bg-purple-50 dark:hover:bg-purple-900/20">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div className="border-l-4 border-purple-600 pl-6">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <Wrench className="w-8 h-8 text-purple-600" />
                            Automated Remediation
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            {workflowName || 'AI Workflow'} — AI-generated fixes for detected violations
                        </p>
                    </div>
                </div>
            </div>

            {/* Violation Summary */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Violations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-500">{failedViolations.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Passed Checks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-500">{passedChecks.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Compliance Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-500">
                            {violations.length > 0 ? Math.round((passedChecks.length / violations.length) * 100) : 0}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Violations List */}
            <Card>
                <CardHeader>
                    <CardTitle>Policy Violations</CardTitle>
                    <CardDescription>Issues identified during compliance evaluation</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {failedViolations.map((violation, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="destructive" className="text-xs">
                                            {violation.policy_area}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{violation.reason}</p>
                                </div>
                            </div>
                        ))}
                        {failedViolations.length === 0 && (
                            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    No violations found. All compliance checks passed!
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Remediation Panel - Always Visible if violations exist OR autoStart/demo mode */}
            {/* {failedViolations.length > 0 && ( */}
            <RemediationPanel
                originalText={workflowDescription}
                violations={violations}
                policySummary={policySummary}
                report={report}
                autoStart={searchParams.get('autoStart') === 'true'}
            />
            {/* )} */}
        </div>
    );
}
