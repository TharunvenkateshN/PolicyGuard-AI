"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface SelfHealingModalProps {
    open: boolean
    onClose: () => void
    violation: {
        type: string
        agent: string
        details: string
    }
    patchedPrompt: string
    onConfirm: () => Promise<void>
}

export function SelfHealingModal({
    open,
    onClose,
    violation,
    patchedPrompt,
    onConfirm
}: SelfHealingModalProps) {
    const [understood, setUnderstood] = useState(false)
    const [isHealing, setIsHealing] = useState(false)
    const [healingComplete, setHealingComplete] = useState(false)
    const [healingFailed, setHealingFailed] = useState(false)

    // --- Helper Functions for Clarity ---
    const getReadableType = (type: string) => {
        const t = type.toUpperCase();
        if (t.includes("404")) return "Configuration Drift (Model 404)";
        if (t.includes("429")) return "Resource Exhaustion (Rate Limit)";
        if (t.includes("500")) return "Upstream Instability (500)";
        if (t.includes("PII")) return "Data Privacy Violation (PII)";
        if (t.includes("TOXICITY")) return "Safety Violation (Toxicity)";
        return type;
    };

    const getReadableDetails = (details: string, type: string) => {
        const t = type.toUpperCase();
        if (t.includes("404")) return "The agent failed because it attempted to query a model version that has been deprecated or removed.";
        if (t.includes("429")) return "The agent's request volume exceeded the API quota, causing a service denial.";
        if (t.includes("PII")) return "The agent attempted to output sensitive user data (Phone/Email) in plain text.";
        return details || "The agent exhibited behavior that deviated from the defined governance baseline.";
    };

    const getFixStrategy = (type: string) => {
        const t = type.toUpperCase();
        if (t.includes("404")) return "Lexinel will inject a fallback routing instruction, forcing the agent to use the 'gemini-2.0-flash' model instead of the deprecated version.";
        if (t.includes("429")) return "Lexinel will implement a client-side backoff strategy and request grouping to stay within rate limits.";
        if (t.includes("PII")) return "Lexinel will apply a 'Privacy Masking' directive, instructing the agent to redact or hash all sensitive entities before responding.";
        return "Lexinel will harden the system prompt with explicit negative constraints to prevent this specific failure mode.";
    };

    const getFormattedPatch = (patch: string) => {
        if (!patch.includes("You are")) {
            return `... (Existing System Prompt) ...

### 🛡️ Lexinel REMEDIATION INSTRUCTION 🛡️
${patch}

... (End of Prompt) ...`;
        }
        return patch;
    };

    const handleConfirm = async () => {
        if (!understood) {
            toast.error('Please confirm you understand the changes')
            return
        }

        setIsHealing(true)
        try {
            await onConfirm()
            setHealingComplete(true)
            toast.success('Self-healing completed successfully!')

            // Auto-close after 2 seconds
            setTimeout(() => {
                onClose()
                resetState()
            }, 2000)
        } catch (error) {
            setHealingFailed(true)
            toast.error('Self-healing failed: ' + (error as Error).message)
        } finally {
            setIsHealing(false)
        }
    }

    const resetState = () => {
        setUnderstood(false)
        setIsHealing(false)
        setHealingComplete(false)
        setHealingFailed(false)
    }

    const handleClose = () => {
        if (!isHealing) {
            onClose()
            resetState()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {healingComplete ? (
                            <>
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                <span className="text-emerald-900 dark:text-emerald-400">Agent Successfully Patched</span>
                            </>
                        ) : healingFailed ? (
                            <>
                                <XCircle className="w-6 h-6 text-red-600" />
                                <span className="text-red-900 dark:text-red-400">Remediation Failed</span>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="w-6 h-6 text-amber-500" />
                                <span>Remediation Plan</span>
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-base text-zinc-500">
                        {healingComplete
                            ? 'The vulnerability has been neutralized. The agent is now immune to this failure pattern.'
                            : healingFailed
                                ? 'Could not apply the fix. Please check connectivity.'
                                : 'Lexinel has analyzed the failure and generated a targeted fix.'}
                    </DialogDescription>
                </DialogHeader>

                {!healingComplete && !healingFailed && (
                    <div className="space-y-6 mt-2">
                        {/* 1. What Happened? */}
                        <div className="bg-red-50/50 dark:bg-red-950/10 border-l-4 border-red-500 p-4 rounded-r-lg">
                            <h4 className="flex items-center gap-2 font-bold text-red-900 dark:text-red-200 text-sm uppercase tracking-wider mb-2">
                                <AlertTriangle className="w-4 h-4" />
                                Incident Report: {getReadableType(violation.type)}
                            </h4>
                            <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
                                {getReadableDetails(violation.details, violation.type)}
                            </p>
                        </div>

                        {/* 2. What will we do? */}
                        <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                            <h4 className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200 text-sm uppercase tracking-wider mb-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Action Plan
                            </h4>
                            <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed">
                                {getFixStrategy(violation.type)}
                            </p>
                        </div>

                        {/* 3. Code Evidence */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                    Generated Prompt Injector
                                </h4>
                                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-500 font-mono">
                                    system_prompt.patch
                                </span>
                            </div>
                            <div className="bg-zinc-950 text-emerald-400 p-4 rounded-lg shadow-inner max-h-48 overflow-y-auto border border-zinc-800">
                                <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed">
                                    <code>{getFormattedPatch(patchedPrompt)}</code>
                                </pre>
                            </div>
                        </div>

                        {/* Confirmation Checkbox */}
                        <div className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer" onClick={() => !isHealing && setUnderstood(!understood)}>
                            <Checkbox
                                id="understand"
                                checked={understood}
                                onCheckedChange={(checked) => setUnderstood(checked as boolean)}
                                disabled={isHealing}
                                className="mt-1"
                            />
                            <div className="flex flex-col gap-1">
                                <label
                                    htmlFor="understand"
                                    className="text-sm font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer"
                                >
                                    Authorize Autonomous Patching
                                </label>
                                <p className="text-xs text-zinc-500">
                                    I confirm that this prompt update is safe to deploy to the production agent.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {!healingComplete && !healingFailed && (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                disabled={isHealing}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={!understood || isHealing}
                                className="text-[#070c0a] font-bold"
                                style={{ background: '#1aff8c', boxShadow: '0 0 12px rgba(26,255,140,0.3)' }}
                            >
                                {isHealing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Deploying Patch...
                                    </>
                                ) : (
                                    'Confirm & Heal'
                                )}
                            </Button>
                        </>
                    )}
                    {(healingComplete || healingFailed) && (
                        <Button onClick={handleClose}>
                            Close
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
