"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useUser, UserProfileEnhanced } from '@/context/UserContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Shield, Search, Bell, Lock, Activity, Users, Globe, Scale, AlertTriangle, FileText, Bot } from 'lucide-react'

// --- Types for Local Settings ---
interface PolicySettings {
    domains: {
        privacy: boolean;
        safety: boolean;
        security: boolean;
        fairness: boolean;
        compliance: boolean;
    };
    region: string;
    sensitivity: string; // 'Conservative', 'Balanced', 'Aggressive'
    riskThreshold: string; // 'Block Any', 'Warn Medium', 'Allow Low'
    minConfidence: number; // 0-100
    strictness: number; // 0-100
    guardrailAction: string; // 'Block', 'Approve', 'Suggest', 'Log'
    guardrailExplain: boolean;
    guardrailCite: boolean;
    sources: {
        prds: boolean;
        architecture: boolean;
        jira: boolean;
        api: boolean;
        prompts: boolean;
    };
    notifications: {
        email: boolean;
        slack: boolean;
        dashboard: boolean;
        triggers: {
            highRisk: boolean;
            conflict: boolean;
            blocked: boolean;
        }
    };
    auditLevel: string; // 'Summary', 'Detailed', 'Full'
    auditRetention: string; // '30', '90', '180'
    aiReasoning: boolean;
    aiConflict: boolean;
    deploymentMode: string; // 'Sandbox', 'Staging', 'Production'
}

const defaultSettings: PolicySettings = {
    domains: {
        privacy: true,
        safety: true,
        security: true,
        fairness: false,
        compliance: true
    },
    region: 'Global',
    sensitivity: 'Balanced',
    riskThreshold: 'Warn Medium',
    minConfidence: 80,
    strictness: 50,
    guardrailAction: 'Suggest',
    guardrailExplain: true,
    guardrailCite: false,
    sources: {
        prds: true,
        architecture: false,
        jira: false,
        api: false,
        prompts: true
    },
    notifications: {
        email: true,
        slack: false,
        dashboard: true,
        triggers: {
            highRisk: true,
            conflict: false,
            blocked: true
        }
    },
    auditLevel: 'Detailed',
    auditRetention: '90',
    aiReasoning: true,
    aiConflict: false,
    deploymentMode: 'Staging'
};

export default function SettingsPage() {
    const { profile, updateProfile } = useUser();
    const [settings, setSettings] = useState<PolicySettings>(defaultSettings);
    const [isSaving, setIsSaving] = useState(false);

    // Load settings from localStorage
    // Load settings from API
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/v1/settings');
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
            }
        };
        fetchSettings();
    }, []);

    // Save handler
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('http://localhost:8000/api/v1/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (!res.ok) throw new Error("Failed to save");
            // Optional: Toast success
        } catch (error) {
            console.error("Save failed:", error);
            alert("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    // Helper for updating nested settings
    const updateSetting = (section: keyof PolicySettings, key: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...(prev[section] as any),
                [key]: value
            }
        }));
    };

    // Helper for direct property update
    const updateDirect = (key: keyof PolicySettings, value: any) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSimulation = async () => {
        const btn = document.getElementById('sim-btn') as HTMLButtonElement;
        if (btn) btn.disabled = true;
        if (btn) btn.textContent = "Running Simulation...";

        try {
            const res = await fetch('http://localhost:8000/api/v1/simulate', { method: 'POST' });
            const data = await res.json();
            alert(`Simulation Complete!\n\n${data.risks_found} Risks Found:\n` + data.details.join('\n- '));
        } catch (e) {
            alert("Simulation failed to run.");
        } finally {
            if (btn) btn.disabled = false;
            if (btn) btn.textContent = "Simulation Mode";
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Settings & Configuration</h3>
                    <p className="text-muted-foreground">
                        Manage your profile, policy scope, risk tolerance, and system guardrails.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button id="sim-btn" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={handleSimulation}>
                        <Activity className="mr-2 h-4 w-4" />
                        Simulation Mode
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="policy" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="policy">Policy & Risk</TabsTrigger>
                    <TabsTrigger value="system">System & Integrations</TabsTrigger>
                </TabsList>


                {/* --- POLICY TAB --- */}
                <TabsContent value="policy" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Scope */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center"><Globe className="mr-2 h-5 w-5" /> Policy Scope Preferences</CardTitle>
                                <CardDescription>Select applicable domains and sensitivity.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <Label>Applicable Domains</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(settings.domains).map(([key, val]) => (
                                            <div key={key} className="flex items-center space-x-2">
                                                <Switch
                                                    id={`domain-${key}`}
                                                    checked={val}
                                                    onCheckedChange={(c) => updateSetting('domains', key, c)}
                                                />
                                                <Label htmlFor={`domain-${key}`} className="capitalize">{key}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <Label>Sensitivity Level</Label>
                                    <Select value={settings.sensitivity} onValueChange={(v) => updateDirect('sensitivity', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Conservative">Conservative (Flag potential risks)</SelectItem>
                                            <SelectItem value="Balanced">Balanced (Standard enterprise)</SelectItem>
                                            <SelectItem value="Aggressive">Aggressive (Only flag blocking)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Risk Tolerance */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center"><Scale className="mr-2 h-5 w-5" /> Risk Tolerance & Thresholds</CardTitle>
                                <CardDescription>Configure when to block or warn.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Allowed Risk Threshold</Label>
                                    <Select value={settings.riskThreshold} onValueChange={(v) => updateDirect('riskThreshold', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Block Any">Block on any violation</SelectItem>
                                            <SelectItem value="Warn Medium">Warn on medium risk</SelectItem>
                                            <SelectItem value="Allow Low">Allow low-risk deviations</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <Label>Strictness Slider</Label>
                                        <span className="text-sm text-muted-foreground">{settings.strictness}%</span>
                                    </div>
                                    <Slider
                                        value={[settings.strictness]}
                                        onValueChange={(v) => updateDirect('strictness', v[0])}
                                        max={100}
                                        step={5}
                                    />
                                    <p className="text-xs text-muted-foreground">Higher = More likely to flag ambiguous inputs.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <Label>Min. Confidence Requirement</Label>
                                        <span className="text-sm text-muted-foreground">{settings.minConfidence}%</span>
                                    </div>
                                    <Slider
                                        value={[settings.minConfidence]}
                                        onValueChange={(v) => updateDirect('minConfidence', v[0])}
                                        max={100}
                                        step={5}
                                    />
                                    <p className="text-xs text-muted-foreground">Confidence required for automated approval.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Guardrails */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center"><Bot className="mr-2 h-5 w-5" /> Guardrail Behavior</CardTitle>
                                <CardDescription>How the system reacts to violations.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Enforcement Action</Label>
                                    <Select value={settings.guardrailAction} onValueChange={(v) => updateDirect('guardrailAction', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Block">Auto-block deployment</SelectItem>
                                            <SelectItem value="Approve">Require human approval</SelectItem>
                                            <SelectItem value="Suggest">Suggest remediation only</SelectItem>
                                            <SelectItem value="Log">Silent logging</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Explain decision in plain English</Label>
                                        <Switch
                                            checked={settings.guardrailExplain}
                                            onCheckedChange={(c) => updateDirect('guardrailExplain', c)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <Label>Attach policy citation to every decision</Label>
                                        <Switch
                                            checked={settings.guardrailCite}
                                            onCheckedChange={(c) => updateDirect('guardrailCite', c)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Deployment Mode */}
                        <Card className="border-l-4 border-l-blue-500">
                            <CardHeader>
                                <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5" /> Deployment Mode</CardTitle>
                                <CardDescription>Current lifecycle stage for this environment.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Select value={settings.deploymentMode} onValueChange={(v) => updateDirect('deploymentMode', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Sandbox">Sandbox (No blocking)</SelectItem>
                                        <SelectItem value="Staging">Staging (Warn + Log)</SelectItem>
                                        <SelectItem value="Production">Production (Enforce)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-blue-600 font-medium">
                                    Current Mode: {settings.deploymentMode} - {settings.deploymentMode === 'Production' ? 'Strict Enforcement Active' : 'Learning Mode'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- SYSTEM TAB --- */}
                <TabsContent value="system" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Input Sources */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5" /> Input Source Configuration</CardTitle>
                                <CardDescription>Where PolicyGuard looks for artifacts.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Label>Enabled Sources</Label>
                                {Object.entries(settings.sources).map(([key, val]) => (
                                    <div key={key} className="flex items-center justify-between">
                                        <Label htmlFor={`source-${key}`} className="capitalize text-sm font-normal">{key}</Label>
                                        <Switch
                                            id={`source-${key}`}
                                            checked={val}
                                            onCheckedChange={(c) => updateSetting('sources', key, c)}
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Notifications */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center"><Bell className="mr-2 h-5 w-5" /> Notification & Alerts</CardTitle>
                                <CardDescription>When and where to alert you.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase text-muted-foreground font-bold">Channels</Label>
                                    <div className="flex items-center justify-between">
                                        <Label>Email Alert</Label>
                                        <Switch checked={settings.notifications.email} onCheckedChange={(c) => updateSetting('notifications', 'email', c)} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Slack / Teams</Label>
                                        <Switch checked={settings.notifications.slack} onCheckedChange={(c) => updateSetting('notifications', 'slack', c)} />
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase text-muted-foreground font-bold">Triggers</Label>
                                    <div className="flex items-center justify-between">
                                        <Label>High-risk violation</Label>
                                        <Switch checked={settings.notifications.triggers.highRisk} onCheckedChange={(c) => updateSetting('notifications', 'triggers', { ...settings.notifications.triggers, highRisk: c })} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Policy conflict detected</Label>
                                        <Switch checked={settings.notifications.triggers.conflict} onCheckedChange={(c) => updateSetting('notifications', 'triggers', { ...settings.notifications.triggers, conflict: c })} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Audit */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center"><Search className="mr-2 h-5 w-5" /> Audit & Explainability</CardTitle>
                                <CardDescription>Compliance logs and transparency.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Log Detail Level</Label>
                                    <Select value={settings.auditLevel} onValueChange={(v) => updateDirect('auditLevel', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Summary">Summary</SelectItem>
                                            <SelectItem value="Detailed">Detailed reasoning</SelectItem>
                                            <SelectItem value="Full">Full policy trace</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Retention Period (Days)</Label>
                                    <Select value={settings.auditRetention} onValueChange={(v) => updateDirect('auditRetention', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="30">30 Days</SelectItem>
                                            <SelectItem value="90">90 Days</SelectItem>
                                            <SelectItem value="180">180 Days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* AI Reasoning */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center"><Bot className="mr-2 h-5 w-5" /> AI Reasoning Transparency</CardTitle>
                                <CardDescription>Gemini model decision process.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Show Gemini reasoning steps</Label>
                                    <Switch checked={settings.aiReasoning} onCheckedChange={(c) => updateDirect('aiReasoning', c)} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Highlight conflicting policies</Label>
                                    <Switch checked={settings.aiConflict} onCheckedChange={(c) => updateDirect('aiConflict', c)} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div >
    );
}

// Added missing helper for the triggers nested update manually since `updateSetting` logic for 'notifications' was shallow.
// Actually `updateSetting('notifications', 'triggers', ...)` works if I pass the whole trigger object.
// I did that in the JSX: { ...settings.notifications.triggers, highRisk: c }
