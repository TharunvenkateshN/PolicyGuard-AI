"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useUser } from '@/context/UserContext';
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Shield,
    Bell,
    Lock,
    Activity,
    Globe,
    Scale,
    FileText,
    Bot,
    LayoutDashboard,
    Network,
    CheckCircle2,
    AlertTriangle,
    Zap,
    ChevronRight,
    Users,
    Briefcase,
    Building
} from 'lucide-react'
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../../components/ui/dialog"
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

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
    sensitivity: string;
    riskThreshold: string;
    minConfidence: number;
    strictness: number;
    guardrailAction: string;
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
    auditLevel: string;
    auditRetention: string;
    aiReasoning: boolean;
    aiConflict: boolean;
    deploymentMode: string;
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

const sections = [
    { id: 'profile', label: 'Profile', icon: Users },
    { id: 'general', label: 'General', icon: LayoutDashboard },
    { id: 'risk', label: 'Risk Engine', icon: Shield },
    { id: 'guardrails', label: 'Guardrails', icon: Lock },
    { id: 'integrations', label: 'Integrations', icon: Network },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'audit', label: 'Audit', icon: FileText },
    { id: 'ai', label: 'AI Model', icon: Bot },
    { id: 'gatekeeper', label: 'Gatekeeper', icon: Shield },
];

export default function SettingsPage() {
    const { profile, updateProfile } = useUser();
    const { theme, setTheme } = useTheme();
    const [settings, setSettings] = useState<PolicySettings>(defaultSettings);
    const [gkSettings, setGkSettings] = useState({
        stream1_url: '',
        stream1_key: '',
        stream2_url: '',
        stream2_key: '',
        routing_mode: 'Failover'
    });
    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('profile');
    const [simResult, setSimResult] = useState<any>(null);
    const [showSimResult, setShowSimResult] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [initialSettings, setInitialSettings] = useState<PolicySettings>(defaultSettings);
    const [initialGkSettings, setInitialGkSettings] = useState(gkSettings);
    const [isDirty, setIsDirty] = useState(false);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/v1/settings`);
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                    setInitialSettings(data);
                }

                // Fetch Gatekeeper settings
                const gkRes = await fetch(`${apiUrl}/api/v1/settings/gatekeeper`);
                if (gkRes.ok) {
                    const gkData = await gkRes.json();
                    setGkSettings(gkData);
                    setInitialGkSettings(gkData);
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const settingsDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);
        const gkDirty = JSON.stringify(gkSettings) !== JSON.stringify(initialGkSettings);
        setIsDirty(settingsDirty || gkDirty);
    }, [settings, initialSettings, gkSettings, initialGkSettings]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`${apiUrl}/api/v1/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (!res.ok) throw new Error("Failed to save settings");

            const gkRes = await fetch(`${apiUrl}/api/v1/settings/gatekeeper`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gkSettings),
            });
            if (!gkRes.ok) throw new Error("Failed to save Gatekeeper settings");

            setInitialSettings(settings);
            // Simulate profile save (it's already local, just strict sync)
            setSaveMessage("Saved successfully!");
            setTimeout(() => setSaveMessage(""), 3000);
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const updateSetting = (section: keyof PolicySettings, key: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...(prev[section] as any),
                [key]: value
            }
        }));
    };

    const updateDirect = (key: keyof PolicySettings, value: any) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSimulation = async () => {
        const btn = document.getElementById('sim-btn') as HTMLButtonElement;
        if (btn) btn.disabled = true;
        if (btn) btn.textContent = "Running...";

        try {
            const res = await fetch(`${apiUrl}/api/v1/simulate`, { method: 'POST' });
            const data = await res.json();
            setSimResult(data);
            setShowSimResult(true);
        } catch (e) {
            console.error("Simulation failed", e);
        } finally {
            if (btn) btn.disabled = false;
            if (btn) btn.textContent = "Run Simulation";
        }
    };

    const GroupHeader = ({ title, description }: { title: string, description?: string }) => (
        <div className="mb-5 px-1">
            <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1.5">{description}</p>}
        </div>
    );

    const SettingsGroup = ({ children }: { children: React.ReactNode }) => (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm px-6">
            {children}
        </div>
    );

    const SettingsRow = ({ children, className, noDivider }: { children: React.ReactNode, className?: string, noDivider?: boolean }) => (
        <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between py-5 gap-4", !noDivider && "border-b border-border/40", className)}>
            {children}
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-6 px-1">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
                    <p className="text-muted-foreground mt-1 text-base">
                        Manage your agent governance and policies.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <Button
                        id="sim-btn"
                        variant="outline"
                        onClick={handleSimulation}
                        className="flex-1 md:flex-none bg-transparent hover:bg-cyan-500/10 border-cyan-500/30 text-cyan-500 font-semibold"
                    >
                        <Zap className="h-4 w-4 mr-2 text-cyan-400" />
                        Run Simulation
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !isDirty}
                        className={cn(
                            "flex-1 md:flex-none min-w-[120px] shadow-sm transition-all duration-200",
                            isDirty
                                ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                        )}
                    >
                        {isSaving ? "Saving..." : saveMessage || "Save Changes"}
                    </Button>
                </div>
            </div>

            {/* Navigation Pills */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex overflow-x-auto pb-1 gap-1 no-scrollbar md:justify-start">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={cn(
                                    "relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap",
                                    isActive
                                        ? "text-white shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-gray-100/80"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activePill"
                                        className="absolute inset-0 bg-gray-900 rounded-full"
                                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    <Icon className={cn("h-4 w-4", isActive ? "text-gray-200" : "text-gray-500")} />
                                    {section.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-8"
                >
                    {activeSection === 'profile' && (
                        <div className="max-w-2xl">
                            <GroupHeader title="User Profile" description="Manage your personal information and role." />
                            <SettingsGroup>
                                <SettingsRow>
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium">Full Name</Label>
                                    </div>
                                    <div className="w-[300px]">
                                        <input
                                            type="text"
                                            value={profile.name}
                                            onChange={(e) => updateProfile({ name: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                </SettingsRow>
                                <SettingsRow>
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium">Organization</Label>
                                    </div>
                                    <div className="w-[300px] relative">
                                        <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={profile.organization}
                                            onChange={(e) => updateProfile({ organization: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </div>
                                </SettingsRow>
                                <SettingsRow>
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium">Job Title</Label>
                                    </div>
                                    <div className="w-[300px] relative">
                                        <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={profile.jobTitle}
                                            onChange={(e) => updateProfile({ jobTitle: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </div>
                                </SettingsRow>
                                <SettingsRow noDivider>
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium">Team</Label>
                                    </div>
                                    <div className="w-[300px] relative">
                                        <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={profile.team}
                                            onChange={(e) => updateProfile({ team: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </div>
                                </SettingsRow>
                            </SettingsGroup>
                        </div>
                    )}

                    {activeSection === 'general' && (
                        <div className="max-w-2xl">
                            <GroupHeader title="Environment" description="Configure the deployment phase and region." />
                            <SettingsGroup>
                                <SettingsRow>
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium">Appearance</Label>
                                        <p className="text-sm text-muted-foreground">Select your preferred theme.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setTheme("light")}
                                            className={cn("gap-2", theme === 'light' && "border-blue-500 bg-blue-50 text-blue-700")}
                                        >
                                            <Sun className="h-4 w-4" /> Light
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setTheme("dark")}
                                            className={cn("gap-2", theme === 'dark' && "border-cyan-500 bg-cyan-950/30 text-cyan-400")}
                                        >
                                            <Moon className="h-4 w-4" /> Dark
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setTheme("system")}
                                            className={cn("gap-2", theme === 'system' && "border-purple-500 bg-purple-50 text-purple-700")}
                                        >
                                            <LayoutDashboard className="h-4 w-4" /> System
                                        </Button>
                                    </div>
                                </SettingsRow>
                                <SettingsRow>
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium">Deployment Mode</Label>
                                        <p className="text-sm text-muted-foreground">Determines enforcement level.</p>
                                    </div>
                                    <Select value={settings.deploymentMode} onValueChange={(v) => updateDirect('deploymentMode', v)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Sandbox">Sandbox</SelectItem>
                                            <SelectItem value="Staging">Staging</SelectItem>
                                            <SelectItem value="Production">Production</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </SettingsRow>
                                <SettingsRow noDivider>
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium">Region</Label>
                                        <p className="text-sm text-muted-foreground">Data sovereignty compliance.</p>
                                    </div>
                                    <Select value={settings.region} onValueChange={(v) => updateDirect('region', v)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Global">Global</SelectItem>
                                            <SelectItem value="EU">EU (GDPR)</SelectItem>
                                            <SelectItem value="US">US (NIST)</SelectItem>
                                            <SelectItem value="APAC">APAC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </SettingsRow>
                            </SettingsGroup>

                            <div className="mt-4 px-1">
                                <div className={cn(
                                    "text-sm px-3 py-2 rounded-lg flex items-center gap-2 inline-flex",
                                    settings.deploymentMode === 'Production' ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                                )}>
                                    {settings.deploymentMode === 'Production' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                    {settings.deploymentMode === 'Production' ? 'Strict Enforcement Active' : 'Observation Mode Active'}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'risk' && (
                        <div className="grid gap-8 md:grid-cols-2">
                            <div>
                                <GroupHeader title="Risk Scope" />
                                <SettingsGroup>
                                    {Object.entries(settings.domains).map(([key, val], idx, arr) => (
                                        <SettingsRow key={key} noDivider={idx === arr.length - 1}>
                                            <Label htmlFor={`domain-${key}`} className="text-base font-normal capitalize flex-1 cursor-pointer">{key}</Label>
                                            <Switch
                                                id={`domain-${key}`}
                                                checked={val}
                                                onCheckedChange={(c) => updateSetting('domains', key, c)}
                                            />
                                        </SettingsRow>
                                    ))}
                                </SettingsGroup>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <GroupHeader title="Sensitivity" />

                                    <SettingsGroup>
                                        <SettingsRow>
                                            <Label className="text-base">Level</Label>
                                            <Select value={settings.sensitivity} onValueChange={(v) => updateDirect('sensitivity', v)}>
                                                <SelectTrigger className="w-[160px] border-none shadow-none text-right font-medium text-blue-600 focus:ring-0 h-auto p-0">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent align="end">
                                                    <SelectItem value="Conservative">Conservative</SelectItem>
                                                    <SelectItem value="Balanced">Balanced</SelectItem>
                                                    <SelectItem value="Aggressive">Aggressive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </SettingsRow>
                                        <SettingsRow noDivider>
                                            <Label className="text-base">Action</Label>
                                            <Select value={settings.riskThreshold} onValueChange={(v) => updateDirect('riskThreshold', v)}>
                                                <SelectTrigger className="w-[160px] border-none shadow-none text-right font-medium text-blue-600 focus:ring-0 h-auto p-0">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent align="end">
                                                    <SelectItem value="Block Any">Block Any</SelectItem>
                                                    <SelectItem value="Warn Medium">Warn Medium</SelectItem>
                                                    <SelectItem value="Allow Low">Allow Low</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </SettingsRow>
                                    </SettingsGroup>
                                </div>

                                <div>
                                    <GroupHeader title="Calibration" />
                                    <Card className="border-none shadow-sm bg-white">
                                        <CardContent className="pt-6 space-y-6">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <Label>Strictness</Label>
                                                    <span className="text-sm font-medium text-gray-500">{settings.strictness}%</span>
                                                </div>
                                                <Slider
                                                    value={[settings.strictness]}
                                                    onValueChange={(v) => updateDirect('strictness', v[0])}
                                                    max={100}
                                                    step={5}
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <Label>Confidence</Label>
                                                    <span className="text-sm font-medium text-gray-500">{settings.minConfidence}%</span>
                                                </div>
                                                <Slider
                                                    value={[settings.minConfidence]}
                                                    onValueChange={(v) => updateDirect('minConfidence', v[0])}
                                                    max={100}
                                                    step={5}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'guardrails' && (
                        <div className="max-w-2xl">
                            <GroupHeader title="Enforcement" />

                            <SettingsGroup>
                                <SettingsRow noDivider>
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Violation Action</Label>
                                        <p className="text-xs text-muted-foreground">What happens when policies fail.</p>
                                    </div>
                                    <Select value={settings.guardrailAction} onValueChange={(v) => updateDirect('guardrailAction', v)}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Block">Block</SelectItem>
                                            <SelectItem value="Approve">Approve</SelectItem>
                                            <SelectItem value="Suggest">Suggest</SelectItem>
                                            <SelectItem value="Log">Log Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </SettingsRow>
                            </SettingsGroup>

                            <GroupHeader title="Explainability" />

                            <SettingsGroup>
                                <SettingsRow>
                                    <Label className="text-base font-normal flex-1">Explain Decisions</Label>
                                    <Switch
                                        checked={settings.guardrailExplain}
                                        onCheckedChange={(c) => updateDirect('guardrailExplain', c)}
                                    />
                                </SettingsRow>
                                <SettingsRow noDivider>
                                    <Label className="text-base font-normal flex-1">Include Citations</Label>
                                    <Switch
                                        checked={settings.guardrailCite}
                                        onCheckedChange={(c) => updateDirect('guardrailCite', c)}
                                    />
                                </SettingsRow>
                            </SettingsGroup>
                        </div>
                    )}

                    {activeSection === 'integrations' && (
                        <div className="max-w-3xl">
                            <div className="grid gap-4 md:grid-cols-2">
                                {Object.entries(settings.sources).map(([key, val]) => (
                                    <div
                                        key={key}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                                            val ? "bg-card border-blue-200 shadow-sm ring-1 ring-blue-100" : "bg-card/50 border-transparent opacity-80"
                                        )}
                                        onClick={() => updateSetting('sources', key, !val)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-full", val ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500")}>
                                                <Network className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium capitalize">{key}</p>
                                                <p className="text-xs text-muted-foreground opacity-90">Data & Context</p>
                                            </div>
                                        </div>
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Switch
                                                id={`source-${key}`}
                                                checked={val}
                                                onCheckedChange={(c) => updateSetting('sources', key, c)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === 'notifications' && (
                        <div className="max-w-2xl space-y-8">
                            <div>
                                <GroupHeader title="Channels" />

                                <SettingsGroup>
                                    <SettingsRow>
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-orange-100 rounded text-orange-600"><Bell className="h-3.5 w-3.5" /></div>
                                            <Label className="text-base font-normal">Email Digest</Label>
                                        </div>
                                        <Switch checked={settings.notifications.email} onCheckedChange={(c) => updateSetting('notifications', 'email', c)} />
                                    </SettingsRow>
                                    <SettingsRow noDivider>
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-purple-100 rounded text-purple-600"><Network className="h-3.5 w-3.5" /></div>
                                            <Label className="text-base font-normal">Slack / Discord</Label>
                                        </div>
                                        <Switch checked={settings.notifications.slack} onCheckedChange={(c) => updateSetting('notifications', 'slack', c)} />
                                    </SettingsRow>
                                </SettingsGroup>
                            </div>

                            <div>
                                <GroupHeader title="Triggers" />

                                <SettingsGroup>
                                    {Object.entries(settings.notifications.triggers).map(([key, val], idx, arr) => (
                                        <SettingsRow key={key} noDivider={idx === arr.length - 1}>
                                            <Label className="capitalize font-normal text-base">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                                            <Switch checked={val} onCheckedChange={(c) => updateSetting('notifications', 'triggers', { ...settings.notifications.triggers, [key]: c })} />
                                        </SettingsRow>
                                    ))}
                                </SettingsGroup>
                            </div>
                        </div>
                    )}

                    {activeSection === 'audit' && (
                        <div className="max-w-2xl">
                            <GroupHeader title="Compliance" />

                            <SettingsGroup>
                                <SettingsRow>
                                    <Label className="text-base font-medium">Log Level</Label>
                                    <Select value={settings.auditLevel} onValueChange={(v) => updateDirect('auditLevel', v)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Summary">Summary</SelectItem>
                                            <SelectItem value="Detailed">Detailed</SelectItem>
                                            <SelectItem value="Full">Full Trace</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </SettingsRow>
                                <SettingsRow noDivider>
                                    <Label className="text-base font-medium">Retention</Label>
                                    <Select value={settings.auditRetention} onValueChange={(v) => updateDirect('auditRetention', v)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="30">30 Days</SelectItem>
                                            <SelectItem value="90">90 Days</SelectItem>
                                            <SelectItem value="180">180 Days</SelectItem>
                                            <SelectItem value="365">1 Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </SettingsRow>
                            </SettingsGroup>
                        </div>
                    )}

                    {activeSection === 'ai' && (
                        <div className="max-w-2xl">
                            <GroupHeader title="Transparency" description="Control how much internal reasoning is revealed." />

                            <SettingsGroup>
                                <SettingsRow>
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Reasoning Steps</Label>
                                        <p className="text-xs text-muted-foreground">Show chain-of-thought.</p>
                                    </div>
                                    <Switch checked={settings.aiReasoning} onCheckedChange={(c) => updateDirect('aiReasoning', c)} />
                                </SettingsRow>
                                <SettingsRow noDivider>
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Conflict Alerts</Label>
                                        <p className="text-xs text-muted-foreground">Highlight policy contradictions.</p>
                                    </div>
                                    <Switch checked={settings.aiConflict} onCheckedChange={(c) => updateDirect('aiConflict', c)} />
                                </SettingsRow>
                            </SettingsGroup>
                        </div>
                    )}

                    {activeSection === 'gatekeeper' && (
                        <div className="max-w-2xl space-y-8">
                            <div>
                                <GroupHeader
                                    title="Connection Streams"
                                    description="Configure upstream LLM and downstream agent endpoints."
                                />
                                <SettingsGroup>
                                    <div className="py-5 space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-1.5 bg-blue-100 rounded text-blue-600">
                                                <Zap className="h-3.5 w-3.5" />
                                            </div>
                                            <Label className="text-base font-semibold">Stream 1: Upstream LLM</Label>
                                        </div>
                                        <div className="grid gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground ml-1">Endpoint URL</Label>
                                                <input
                                                    type="text"
                                                    value={gkSettings.stream1_url}
                                                    onChange={(e) => setGkSettings(prev => ({ ...prev, stream1_url: e.target.value }))}
                                                    placeholder="https://generativelanguage.googleapis.com"
                                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground ml-1">API Key (Masked)</Label>
                                                <input
                                                    type="password"
                                                    value={gkSettings.stream1_key}
                                                    onChange={(e) => setGkSettings(prev => ({ ...prev, stream1_key: e.target.value }))}
                                                    placeholder="Enter Upstream API Key"
                                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="py-5 space-y-4 border-t border-border/40">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-1.5 bg-cyan-100 rounded text-cyan-600">
                                                <Bot className="h-3.5 w-3.5" />
                                            </div>
                                            <Label className="text-base font-semibold">Stream 2: Downstream Agent</Label>
                                        </div>
                                        <div className="grid gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground ml-1">Endpoint URL</Label>
                                                <input
                                                    type="text"
                                                    value={gkSettings.stream2_url}
                                                    onChange={(e) => setGkSettings(prev => ({ ...prev, stream2_url: e.target.value }))}
                                                    placeholder="http://localhost:8001"
                                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground ml-1">Agent Auth Key</Label>
                                                <input
                                                    type="password"
                                                    value={gkSettings.stream2_key}
                                                    onChange={(e) => setGkSettings(prev => ({ ...prev, stream2_key: e.target.value }))}
                                                    placeholder="Optional Agent Key"
                                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </SettingsGroup>
                            </div>

                            <div>
                                <GroupHeader title="Routing Strategy" />
                                <SettingsGroup>
                                    <SettingsRow noDivider>
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Load Balance Mode</Label>
                                            <p className="text-sm text-muted-foreground">How requests travel between streams.</p>
                                        </div>
                                        <Select
                                            value={gkSettings.routing_mode}
                                            onValueChange={(v) => setGkSettings(prev => ({ ...prev, routing_mode: v }))}
                                        >
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Failover">Failover (1 -&gt; 2)</SelectItem>
                                                <SelectItem value="Parallel">Parallel Audit</SelectItem>
                                                <SelectItem value="Semantic">Semantic Filter</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </SettingsRow>
                                </SettingsGroup>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            <Dialog open={showSimResult} onOpenChange={setShowSimResult}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-amber-500" />
                            Simulation Complete
                        </DialogTitle>
                        <DialogDescription>
                            Found {simResult?.risks_found} potential risks in the current configuration.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-2 space-y-2">
                        {simResult?.details.map((detail: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 p-2 bg-red-50 text-red-700 rounded text-sm">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>{detail}</span>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
