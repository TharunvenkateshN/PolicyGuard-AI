"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle2, Loader2, Zap, Stethoscope, ArrowRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { IntegrationCodeModal } from '@/components/settings/IntegrationCodeModal'

interface SetupWizardProps {
    open: boolean
    onClose: () => void
    onComplete: (data: {
        stream1_url: string
        stream1_key: string
        self_healing_enabled: boolean
    }) => void
}

export function Stream1SetupWizard({ open, onClose, onComplete }: SetupWizardProps) {
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [showIntegrationModal, setShowIntegrationModal] = useState(false)

    const [formData, setFormData] = useState({
        stream1_url: 'https://generativelanguage.googleapis.com',
        stream1_key: '',
        enable_self_healing: false
    })

    const totalSteps = 3

    const handleNext = () => {
        // Validation
        if (step === 1 && !formData.stream1_url) {
            toast.error('Please enter Stream 1 URL')
            return
        }
        if (step === 2 && !formData.stream1_key) {
            toast.error('Please enter API Key')
            return
        }

        if (step < totalSteps) {
            setStep(step + 1)
        }
    }

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1)
        }
    }

    const handleComplete = async () => {
        setIsLoading(true)

        try {
            // If self-healing is enabled, show integration modal
            if (formData.enable_self_healing) {
                setShowIntegrationModal(true)
            }

            // Complete the setup
            await onComplete({
                stream1_url: formData.stream1_url,
                stream1_key: formData.stream1_key,
                self_healing_enabled: formData.enable_self_healing
            })

            toast.success('Stream 1 setup completed successfully!')

            // Close wizard
            setTimeout(() => {
                onClose()
                resetWizard()
            }, 1000)

        } catch (error) {
            toast.error('Setup failed: ' + (error as Error).message)
        } finally {
            setIsLoading(false)
        }
    }

    const resetWizard = () => {
        setStep(1)
        setFormData({
            stream1_url: 'https://generativelanguage.googleapis.com',
            stream1_key: '',
            enable_self_healing: false
        })
    }

    const handleClose = () => {
        onClose()
        resetWizard()
    }

    return (
        <>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Zap className="h-6 w-6 text-blue-600" />
                            Stream 1 Setup Wizard
                        </DialogTitle>
                        <DialogDescription>
                            Step {step} of {totalSteps}: Configure your upstream LLM connection
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        {/* Progress Indicator */}
                        <div className="flex items-center justify-between mb-8">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center flex-1">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${s <= step ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-400'
                                        }`}>
                                        {s < step ? <CheckCircle2 className="h-5 w-5" /> : s}
                                    </div>
                                    {s < 3 && (
                                        <div className={`flex-1 h-1 mx-2 ${s < step ? 'bg-blue-600' : 'bg-gray-300'
                                            }`} />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Step 1: Endpoint URL */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Configure Endpoint URL</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Enter the base URL for your upstream LLM provider (e.g., Google Gemini, OpenAI)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="stream1_url">Endpoint URL</Label>
                                    <input
                                        id="stream1_url"
                                        type="text"
                                        value={formData.stream1_url}
                                        onChange={(e) => setFormData({ ...formData, stream1_url: e.target.value })}
                                        placeholder="https://generativelanguage.googleapis.com"
                                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        This is the API endpoint that Lexinel will proxy requests to
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 2: API Key */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Enter API Key</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Provide your API key for authentication with the upstream LLM
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="stream1_key">API Key</Label>
                                    <input
                                        id="stream1_key"
                                        type="password"
                                        value={formData.stream1_key}
                                        onChange={(e) => setFormData({ ...formData, stream1_key: e.target.value })}
                                        placeholder="Enter your API key"
                                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Your API key will be securely stored and used for upstream requests
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Self-Healing */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                        <Stethoscope className="h-5 w-5 text-purple-600" />
                                        Enable Self-Healing? (Optional)
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Self-healing allows Lexinel to automatically patch vulnerabilities in your downstream agents
                                    </p>
                                </div>

                                <div className="border rounded-lg p-4 bg-purple-50/50 dark:bg-purple-950/20">
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            id="enable_self_healing"
                                            checked={formData.enable_self_healing}
                                            onCheckedChange={(checked) =>
                                                setFormData({ ...formData, enable_self_healing: checked as boolean })
                                            }
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <Label htmlFor="enable_self_healing" className="text-base font-medium cursor-pointer">
                                                Yes, enable self-healing for my agents
                                            </Label>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                When enabled, Lexinel can automatically generate and deploy patches to fix detected vulnerabilities
                                            </p>
                                        </div>
                                    </div>

                                    {formData.enable_self_healing && (
                                        <div className="mt-4 p-3 bg-white dark:bg-zinc-900 rounded border">
                                            <p className="text-sm font-medium mb-2">What happens next:</p>
                                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                                <li>You'll see integration code snippets for your agents</li>
                                                <li>"Heal" buttons will appear on violations in Live Monitor</li>
                                                <li>You can review and approve patches before deployment</li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={step === 1 || isLoading}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>

                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>

                            {step < totalSteps ? (
                                <Button onClick={handleNext} disabled={isLoading}>
                                    Next
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            ) : (
                                <Button onClick={handleComplete} disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Completing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Complete Setup
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Integration Code Modal */}
            <IntegrationCodeModal
                open={showIntegrationModal}
                onClose={() => setShowIntegrationModal(false)}
            />
        </>
    )
}
