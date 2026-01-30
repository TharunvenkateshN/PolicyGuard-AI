"use client"

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Shield, AlertTriangle, Terminal, Copy, Activity, Server, Zap, ArrowRight, Eye, Clock, Code2, Cpu, Trash2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function ProxyPage() {
    const [selectedLang, setSelectedLang] = useState('python');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const proxyUrl = `${apiUrl}/api/proxy`;
    const router = useRouter();

    // View State
    const [activeStream, setActiveStream] = useState<'stream1' | 'stream2'>('stream1');
    const [wizardStep, setWizardStep] = useState(1);

    // SLA Connection State (Stream 2)
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSlaConnected, setIsSlaConnected] = useState(false);
    const [serviceName, setServiceName] = useState("trading-bot-v1");

    // Gatekeeper Connection State (Stream 1)
    const [isGatekeeperConnected, setIsGatekeeperConnected] = useState(false);
    const [gatekeeperStep, setGatekeeperStep] = useState(1);
    const [gatewayId, setGatewayId] = useState("main-gateway");

    const [isLoaded, setIsLoaded] = useState(false);

    // Live Telemetry State
    const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);
    const [serviceRisk, setServiceRisk] = useState<{ score: number, label: string, factors: string[] }>({
        score: 0,
        label: 'Healthy',
        factors: []
    });
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [gatekeeperStats, setGatekeeperStats] = useState<any>(null);

    // Persistence & Firebase Toggle
    const USE_FIREBASE_SYNC = true; // Set to true to enable Firebase sync (local-first approach)

    // Load state from localStorage & Firebase on mount
    useEffect(() => {
        const loadInitialState = async () => {
            // 1. Try LocalStorage
            const savedConfig = localStorage.getItem('pg_stability_config');
            let initialConfig = savedConfig ? JSON.parse(savedConfig) : null;

            // 2. Try Firebase (Only if explicitly enabled and auth is ready)
            // Note: We check it inside the effect to handle async auth state
            if (USE_FIREBASE_SYNC && auth.currentUser) {
                try {
                    const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid, "integrations", "stability"));
                    if (docSnap.exists()) {
                        initialConfig = { ...initialConfig, ...docSnap.data() };
                    }
                } catch (e) {
                    console.error("Firebase load failed", e);
                }
            }

            if (initialConfig) {
                if (initialConfig.activeStream) setActiveStream(initialConfig.activeStream);
                if (initialConfig.wizardStep) setWizardStep(initialConfig.wizardStep);
                if (initialConfig.isSlaConnected !== undefined) setIsSlaConnected(initialConfig.isSlaConnected);
                if (initialConfig.serviceName) setServiceName(initialConfig.serviceName);
                if (initialConfig.selectedLang) setSelectedLang(initialConfig.selectedLang);
                if (initialConfig.isGatekeeperConnected !== undefined) setIsGatekeeperConnected(initialConfig.isGatekeeperConnected);
                if (initialConfig.gatekeeperStep) setGatekeeperStep(initialConfig.gatekeeperStep);
                if (initialConfig.gatewayId) setGatewayId(initialConfig.gatewayId);
            }
            setIsLoaded(true);
        };

        loadInitialState();
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        if (!isLoaded) return; // CRITICAL: Don't overwrite saved data with defaults on first render

        const config = {
            activeStream,
            wizardStep,
            isSlaConnected,
            serviceName,
            selectedLang,
            isGatekeeperConnected,
            gatekeeperStep,
            gatewayId
        };
        localStorage.setItem('pg_stability_config', JSON.stringify(config));

        // Firebase Sync (Optional/local-first)
        if (USE_FIREBASE_SYNC && auth.currentUser) {
            const syncToFirebase = async () => {
                try {
                    await setDoc(doc(db, "users", auth.currentUser!.uid, "integrations", "stability"), config, { merge: true });
                } catch (e) {
                    console.error("Firebase sync failed", e);
                }
            };
            syncToFirebase();
        }
    }, [activeStream, wizardStep, isSlaConnected, serviceName, selectedLang, isGatekeeperConnected, gatekeeperStep, gatewayId, isLoaded]);

    // Live Telemetry Polling
    useEffect(() => {
        if (!isSlaConnected || !isLoaded) return;

        const fetchTelemetry = async () => {
            try {
                // 1. Fetch History
                const historyRes = await fetch(`${apiUrl}/api/v1/telemetry/history/${serviceName}`);
                if (historyRes.ok) {
                    const history = await historyRes.json();
                    setTelemetryHistory(history);
                }

                // 2. Fetch Risk
                const riskRes = await fetch(`${apiUrl}/api/v1/telemetry/risk/${serviceName}`);
                if (riskRes.ok) {
                    const risk = await riskRes.json();
                    setServiceRisk({
                        score: risk.risk_score,
                        label: risk.risk_label,
                        factors: risk.factors || []
                    });
                }

                setLastUpdated(new Date());
            } catch (e) {
                console.error("Telemetry fetch failed", e);
            }
        };

        fetchTelemetry(); // Initial fetch
        const interval = setInterval(fetchTelemetry, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [isSlaConnected, serviceName, isLoaded, apiUrl]);

    // Gatekeeper Telemetry Polling (Stream 1)
    useEffect(() => {
        if (!isGatekeeperConnected || !isLoaded) return;

        const fetchGatekeeperStats = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/v1/sla/metrics`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (res.ok) {
                    const stats = await res.json();
                    setGatekeeperStats(stats);
                }
            } catch (e) {
                console.error("Gatekeeper stats fetch failed", e);
            }
        };

        fetchGatekeeperStats();
        const interval = setInterval(fetchGatekeeperStats, 3000);
        return () => clearInterval(interval);
    }, [isGatekeeperConnected, isLoaded, apiUrl]);

    const handleSlaConnect = () => {
        setIsConnecting(true);
        // Simulate handshake & redirect
        setTimeout(() => {
            setIsConnecting(false);
            setIsSlaConnected(true);
            router.push('/dashboard/sla');
        }, 2000);
    };

    const stabilitySnippets = {
        python: `
# 1. Configuration
import os
import requests
from threading import Thread

PG_URL = os.getenv("POLICY_GUARD_API", "${apiUrl}")

def send_telemetry(error_rate, latency_ms):
    """Fire-and-forget worker (Zero Latency Impact)"""
    try:
        requests.post(
            f"{PG_URL}/api/v1/telemetry/ingest",
            json={
                "service_id": "${serviceName}",
                "error_rate": error_rate,
                "latency_ms": latency_ms,
                "request_count": 1
            },
            timeout=1.0
        )
    except: pass

# 2. Integration Hook
# Call this after your AI request is finished
def on_ai_complete(latency):
    # Non-blocking push
    Thread(target=send_telemetry, args=(0.0, latency)).start()`,
        node: `
// 1. Configuration
const axios = require('axios');
const PG_URL = process.env.POLICY_GUARD_API || '${apiUrl}';

// 2. Integration Hook
function logStability(latency) {
    // Non-blocking async push (Fire-and-forget)
    axios.post(\`\${PG_URL}/api/v1/telemetry/ingest\`, {
        service_id: '${serviceName}',
        error_rate: 0,
        latency_ms: latency,
        request_count: 1
    }).catch(() => {}); // Silent fail to protect main thread
}

// Example: logStability(250);`,
        curl: `
# -----------------------------------------------------------------------------
# PURPOSE: Manual / CI Pipeline Verification
# WHY: Verify your SLA connection or simulate traffic spikes from a script.
# -----------------------------------------------------------------------------
curl -X POST ${apiUrl}/api/v1/telemetry/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "service_id": "${serviceName}",
    "error_rate": 0.00,
    "latency_ms": 230,
    "request_count": 50
  }'`
    };

    const snippets = {
        python: `
# -----------------------------------------------------------------------------
# PURPOSE: Synchronous Consumer Safety Proxy
# WHY:     Blocks & Audits every request in real-time before it hits Google.
#          Ensures NO policy violations ever leave your perimeter.
# -----------------------------------------------------------------------------
import google.generativeai as genai
import os

# Configure PolicyGuard as the Gateway
genai.configure(
    api_key=os.environ["GOOGLE_API_KEY"],
    transport='rest',
    client_options={"api_endpoint": "${proxyUrl}"} 
)

# PolicyGuard intercepts & audits this call before it hits Google
model = genai.GenerativeModel('gemini-1.5-pro')
response = model.generate_content("How do I hack the mainframe?")

print(response.text)`,
        node: `
// -----------------------------------------------------------------------------
// PURPOSE: Synchronous Consumer Safety Proxy
// WHY:     Blocks & Audits every request in real-time before it hits Google.
//          Ensures NO policy violations ever leave your perimeter.
// -----------------------------------------------------------------------------
const { GoogleGenerativeAI } = require("@google/generative-ai");

// PolicyGuard Interceptor Configuration
const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_API_KEY,
  { baseUrl: '${proxyUrl}' } 
);

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  // Prompt is audited in real-time
  const result = await model.generateContent("Analyze this policy doc.");
  console.log(result.response.text());
}

run();`,
        javascript: `
// -----------------------------------------------------------------------------
// PURPOSE: Direct Browser/Client Safety Proxy
// WHY:     Securely route client-side AI calls through your governance layer.
//          Prevents direct API key exposure and enforces content filters.
// -----------------------------------------------------------------------------
const response = await fetch('${proxyUrl}/v1beta/models/gemini-pro:generateContent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': 'YOUR_GEMINI_KEY'
  },
  body: JSON.stringify({
    contents: [{ parts: [{ text: "Explain quantum computing" }] }]
  })
});

const data = await response.json();
console.log(data);`,
        curl: `
# -----------------------------------------------------------------------------
# PURPOSE: Manual Security Verification
# WHY:     Test your firewalls by intentionally sending unsafe content via CLI.
# -----------------------------------------------------------------------------
curl ${proxyUrl}/v1beta/models/gemini-pro:generateContent \\
  -H "Content-Type: application/json" \\
  -H "x-goog-api-key: $GOOGLE_API_KEY" \\
  -d '{
    "contents": [{\n      "parts": [{\n        "text": "Write a secure deployment script"\n      }]\n    }]
  }'`
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-2">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <Shield className="h-8 w-8 text-indigo-500" />
                    AI Integration Hub
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-3xl">
                    Centralize your AI governance. Click a stream below to configure:
                </p>
            </div>

            {/* Visual Architecture Diagram (Now Acts as Controller) */}
            <div className="relative bg-gradient-to-r from-gray-50 to-white dark:from-zinc-900 dark:to-black rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                <div className="absolute inset-0 opacity-5 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

                {/* User's AI */}
                <div className="flex flex-col items-center z-10">
                    <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-gray-200 dark:border-zinc-700 flex items-center justify-center mb-3">
                        <Terminal className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                    </div>
                    <span className="font-bold text-sm">Your AI Agent</span>
                </div>

                {/* Connection Line */}
                <div className="flex-1 h-[2px] bg-gray-300 dark:bg-zinc-700 relative hidden md:block">
                    <div className="absolute inset-0 bg-indigo-500 w-1/2 animate-[shimmer_2s_infinite]"></div>
                </div>

                {/* PolicyGuard Hub */}
                <div className="flex flex-col items-center z-10 w-full max-w-md">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border-2 border-indigo-500 p-4 w-full transition-transform hover:scale-[1.01]">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Shield className="w-5 h-5 text-indigo-500" />
                            <span className="font-bold">PolicyGuard Gatekeeper</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Stream 1 Selector */}
                            <div
                                onClick={() => setActiveStream('stream1')}
                                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 group
                                    ${activeStream === 'stream1'
                                        ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-500 ring-2 ring-indigo-500/20'
                                        : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2 group-hover:translate-x-1 transition-transform">
                                    <Shield className={`w-4 h-4 ${activeStream === 'stream1' ? 'text-indigo-700' : 'text-indigo-600'}`} />
                                    <span className={`font-bold text-xs ${activeStream === 'stream1' ? 'text-indigo-800 dark:text-indigo-200' : 'text-indigo-700 dark:text-indigo-300'}`}>
                                        STREAM 1: SAFETY
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    {isGatekeeperConnected ? (
                                        <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Active
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-yellow-600 font-medium flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> Setup
                                        </span>
                                    )}
                                    {activeStream === 'stream1' && <Eye className="w-3 h-3 text-indigo-500" />}
                                </div>
                            </div>

                            {/* Stream 2 Selector */}
                            <div
                                onClick={() => setActiveStream('stream2')}
                                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 group
                                    ${activeStream === 'stream2'
                                        ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-500 ring-2 ring-purple-500/20'
                                        : `bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/50 hover:bg-purple-100 dark:hover:bg-purple-900/40 ${isSlaConnected ? '' : 'opacity-70'}`
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2 group-hover:translate-x-1 transition-transform">
                                    <Activity className={`w-4 h-4 ${activeStream === 'stream2' ? 'text-purple-700' : 'text-purple-600'}`} />
                                    <span className={`font-bold text-xs ${activeStream === 'stream2' ? 'text-purple-800 dark:text-purple-200' : 'text-purple-700 dark:text-purple-300'}`}>
                                        STREAM 2: STABILITY
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    {isSlaConnected ? (
                                        <span className="text-green-600 flex items-center gap-1 text-[10px] font-medium"><CheckCircle2 className="w-3 h-3" /> Active</span>
                                    ) : (
                                        <span className="text-yellow-600 flex items-center gap-1 text-[10px] font-medium"><AlertTriangle className="w-3 h-3" /> Pending</span>
                                    )}
                                    {activeStream === 'stream2' && <Eye className="w-3 h-3 text-purple-500" />}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Consumers & Metrics */}
                <div className="flex flex-col gap-8 md:block hidden relative z-10 w-32">
                    <div
                        onClick={() => router.push('/dashboard/monitor')}
                        className={`flex items-center gap-3 mb-8 cursor-pointer group transition-all duration-300 ${activeStream === 'stream1' ? 'opacity-100 translate-x-0' : 'opacity-40 translate-x-2'}`}
                        title="Go to Safety Console"
                    >
                        <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                        <span className="text-xs font-semibold text-indigo-500 underline decoration-dotted underline-offset-4">Consumers</span>
                    </div>
                    <div
                        onClick={() => router.push('/dashboard/sla')}
                        className={`flex items-center gap-3 cursor-pointer group transition-all duration-300 ${activeStream === 'stream2' ? 'opacity-100 translate-x-0' : 'opacity-40 translate-x-2'}`}
                        title="Go to Stability Console"
                    >
                        <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                        <span className="text-xs font-semibold text-purple-500 underline decoration-dotted underline-offset-4">SLA Dashboard</span>
                    </div>
                </div>
            </div>

            {/* DYNAMIC CONTENT AREA */}
            <div className="min-h-[400px]">
                {activeStream === 'stream1' ? (
                    /* STREAM 1 CONTENT - WIZARD OR DASHBOARD */
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 max-w-5xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 font-bold">1</div>
                                <h2 className="text-xl font-bold">Stream 1: AI Gatekeeper</h2>
                            </div>
                            {isGatekeeperConnected && (
                                <Badge variant="outline" className="border-indigo-500 text-indigo-500 bg-indigo-500/10 gap-1.5 py-1 px-3">
                                    <Shield className="w-3.5 h-3.5" /> Gatekeeper Active
                                </Badge>
                            )}
                        </div>

                        {!isGatekeeperConnected ? (
                            <div className="space-y-6">
                                {/* Wizard Steps Indicator */}
                                <div className="flex items-center justify-center mb-8">
                                    {[1, 2, 3].map((step) => (
                                        <React.Fragment key={step}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${gatekeeperStep >= step ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 dark:bg-zinc-800 text-gray-400'
                                                }`}>
                                                {step}
                                            </div>
                                            {step < 3 && (
                                                <div className={`w-16 h-1 transition-all duration-300 ${gatekeeperStep > step ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-zinc-800'
                                                    }`} />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>

                                {gatekeeperStep === 1 && (
                                    <Card className="border-indigo-100 dark:border-indigo-900/30 max-w-2xl mx-auto overflow-hidden shadow-xl">
                                        <div className="h-2 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
                                        <CardHeader className="text-center pt-8">
                                            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Shield className="w-8 h-8 text-indigo-600" />
                                            </div>
                                            <CardTitle className="text-2xl">Configure AI Gatekeeper</CardTitle>
                                            <CardDescription>
                                                Audit and block policy violations in real-time by routing traffic through the PolicyGuard Gateway.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pb-8">
                                            <div className="space-y-2">
                                                <Label htmlFor="gateway-id">Gateway Identifier</Label>
                                                <Input
                                                    id="gateway-id"
                                                    placeholder="e.g., core-audit-gateway"
                                                    value={gatewayId}
                                                    onChange={(e) => setGatewayId(e.target.value)}
                                                    className="focus-visible:ring-indigo-500"
                                                />
                                                <p className="text-[10px] text-gray-500 italic">This will identify this specific gateway in your audit logs.</p>
                                            </div>
                                            <div className="flex gap-4">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 h-11"
                                                    onClick={() => router.push('/dashboard')}
                                                >
                                                    Back to Dashboard
                                                </Button>
                                                <Button
                                                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white shadow-md group h-11"
                                                    onClick={() => setGatekeeperStep(2)}
                                                    disabled={!gatewayId.trim()}
                                                >
                                                    Next: Select Integration Pattern <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {gatekeeperStep === 2 && (
                                    <div className="space-y-6 max-w-4xl mx-auto">
                                        <div className="text-center mb-4">
                                            <h3 className="text-lg font-bold">Select Integration Pattern</h3>
                                            <p className="text-sm text-gray-500">Choose the language your AI agent uses.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {[
                                                { id: 'python', name: 'Python', desc: 'GenAI SDK / requests', icon: <Terminal className="w-8 h-8 text-blue-500" /> },
                                                { id: 'node', name: 'Node.js', desc: '@google/generative-ai', icon: <Code2 className="w-8 h-8 text-green-500" /> },
                                                { id: 'curl', name: 'Raw API', desc: 'Direct HTTP Calls', icon: <Server className="w-8 h-8 text-gray-500" /> }
                                            ].map((stack) => (
                                                <Card
                                                    key={stack.id}
                                                    className={`cursor-pointer transition-all border-2 group hover:shadow-lg ${selectedLang === stack.id ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-zinc-800 hover:border-indigo-200'
                                                        }`}
                                                    onClick={() => setSelectedLang(stack.id)}
                                                >
                                                    <CardContent className="p-6 text-center">
                                                        <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform">{stack.icon}</div>
                                                        <h4 className="font-bold">{stack.name}</h4>
                                                        <p className="text-xs text-gray-500 mt-1">{stack.desc}</p>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center mt-8">
                                            <Button variant="ghost" onClick={() => setGatekeeperStep(1)}>Back</Button>
                                            <Button
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                                onClick={() => setGatekeeperStep(3)}
                                            >
                                                Generate Gateway Snippet <Zap className="ml-2 w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {gatekeeperStep === 3 && (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start max-w-6xl mx-auto">
                                        <div className="lg:col-span-2 space-y-4">
                                            <Card className="border-indigo-100 dark:border-indigo-800 shadow-xl overflow-hidden">
                                                <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-800">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <CardTitle className="text-lg">AI Gatekeeper Setup</CardTitle>
                                                            <CardDescription>Change the `api_endpoint` or `baseUrl` in your config.</CardDescription>
                                                        </div>
                                                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                                            {selectedLang.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-0">
                                                    <div className="relative group">
                                                        <div className="absolute right-3 top-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white border-white/10 backdrop-blur-sm shadow-lg"
                                                                onClick={() => {
                                                                    // @ts-ignore
                                                                    navigator.clipboard.writeText(snippets[selectedLang]);
                                                                }}
                                                            >
                                                                <Copy className="h-3 w-3 mr-1.5" /> Copy Code
                                                            </Button>
                                                        </div>
                                                        <SyntaxHighlighter
                                                            language={selectedLang === 'curl' ? 'bash' : selectedLang === 'node' ? 'javascript' : selectedLang}
                                                            style={vscDarkPlus}
                                                            customStyle={{ margin: 0, borderRadius: 0, height: '350px', fontSize: '13px', padding: '1.25rem' }}
                                                            showLineNumbers={true}
                                                        >
                                                            {/* @ts-ignore */}
                                                            {snippets[selectedLang]}
                                                        </SyntaxHighlighter>
                                                    </div>
                                                </CardContent>
                                                <div className="p-4 bg-indigo-50/30 dark:bg-indigo-900/10 border-t border-indigo-100 dark:border-indigo-800 flex justify-between items-center">
                                                    <div className="flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300">
                                                        <Activity className="w-3 h-3 animate-pulse" />
                                                        <span>Gateway listening at {proxyUrl}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => setGatekeeperStep(2)}>Back</Button>
                                                        <Button size="sm" onClick={() => setIsGatekeeperConnected(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                                            Finalize Integration <CheckCircle2 className="ml-2 w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>

                                        <div className="space-y-4">
                                            <Card className="border-indigo-100 dark:border-indigo-800/30 shadow-none bg-transparent">
                                                <CardHeader className="pb-2 px-4 pt-4">
                                                    <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-indigo-500">
                                                        <Eye className="w-4 h-4" /> Verification
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="px-4 pb-4 space-y-4">
                                                    {[
                                                        { step: "Send Test Request", desc: "Run your application with the new gateway endpoint.", status: "waiting" },
                                                        { step: "MitM Interception", desc: "PolicyGuard intercepts the call and audits content.", status: "pending" },
                                                        { step: "Sovereignty Verification", desc: "Gemini confirms the request meets your internal policies.", status: "pending" }
                                                    ].map((v, i) => (
                                                        <div key={i} className="relative pl-10">
                                                            <div className="absolute left-0 top-0 w-8 h-8 rounded-full border-2 border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center">
                                                                {v.status === 'waiting' ? (
                                                                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                                                                ) : (
                                                                    <Clock className="w-4 h-4 text-gray-300" />
                                                                )}
                                                            </div>
                                                            <div className="text-sm font-bold">{v.step}</div>
                                                            <div className="text-xs text-gray-500">{v.desc}</div>
                                                        </div>
                                                    ))}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* GATEKEEPER ACTIVE DASHBOARD */
                            <div className="space-y-6 animate-in zoom-in-95 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Card className="p-4 border-indigo-100 dark:border-indigo-900/30 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600">
                                            <Server className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Proxy Health</div>
                                            <div className="text-lg font-black text-green-500 flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                                                DELEGATED
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="p-4 border-indigo-100 dark:border-indigo-900/30 flex items-center gap-4 relative group">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600">
                                            <Cpu className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Active Gatekeeper</div>
                                            <div className="text-lg font-black text-blue-600 truncate max-w-[120px]">
                                                {gatewayId}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => setIsGatekeeperConnected(false)}
                                            title="Reconfigure Gatekeeper"
                                        >
                                            <Settings className="w-4 h-4 text-gray-400" />
                                        </Button>
                                    </Card>

                                    <Card className="p-4 border-indigo-100 dark:border-indigo-900/30 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Audits Scanned</div>
                                            <div className="text-2xl font-black text-purple-700">
                                                {gatekeeperStats?.total_requests || 0}
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="p-4 border-indigo-100 dark:border-indigo-900/30 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600">
                                            <AlertTriangle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Blocked Prompts</div>
                                            <div className="text-2xl font-black text-red-600">
                                                {gatekeeperStats?.pii_blocks || 0}
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <Card className="lg:col-span-2 border-indigo-100 dark:border-indigo-900/30 overflow-hidden">
                                        <CardHeader className="bg-indigo-50/30 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-800/50 pb-3">
                                            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-indigo-600">
                                                <Activity className="w-4 h-4" /> Live Audit Log
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="bg-slate-950 p-6 h-[250px] font-mono text-[11px] overflow-y-hidden relative group">
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950 z-10 pointer-events-none" />
                                                <div className="space-y-1">
                                                    <div className="text-green-400 opacity-80">[{new Date().toLocaleTimeString()}] INTERCEPTION SYSTEM ACTIVE</div>
                                                    <div className="text-gray-500">[{new Date().toLocaleTimeString()}] Connected to Gateway: {gatewayId}</div>
                                                    <div className="text-indigo-400">[{new Date().toLocaleTimeString()}] Policy Baseline Synced: SOC2 + Finance Rules</div>
                                                    <div className="text-gray-400">----------------------------------------------------</div>

                                                    {gatekeeperStats?.total_requests > 0 ? (
                                                        <>
                                                            <div className="text-blue-400">[{new Date().toLocaleTimeString()}] Request Intercepted: User prompt analyzed...</div>
                                                            <div className="text-green-500">[{new Date().toLocaleTimeString()}] [PASS] Semantic Sovereign Audit met.</div>
                                                            <div className="text-blue-400">[{new Date().toLocaleTimeString()}] Response Intercepted: Sanitizing PII...</div>
                                                            <div className="text-green-500">[{new Date().toLocaleTimeString()}] [PASS] No policy violations detected in output.</div>
                                                        </>
                                                    ) : (
                                                        <div className="text-gray-500 animate-pulse italic mt-4 px-4 text-center">Waiting for proxied traffic...</div>
                                                    )}

                                                    {gatekeeperStats?.pii_blocks > 0 && (
                                                        <div className="text-red-500 font-bold">[{new Date().toLocaleTimeString()}] [BLOCK] Unauthorized PII Data Flow detected!</div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-indigo-100 dark:border-indigo-900/30 shadow-xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-indigo-600 font-black text-[80px] opacity-[0.03] italic pointer-events-none select-none -rotate-12 translate-x-12 translate-y-12">
                                            AUDIT
                                        </div>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-xs text-indigo-500 uppercase tracking-widest font-bold">Real-time Performance</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs text-gray-500">Gateway Latency</span>
                                                    <span className="text-sm font-bold text-indigo-600">+{gatekeeperStats?.avg_response_time_ms ? Math.round(gatekeeperStats.avg_response_time_ms / 10) : 12}ms</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '45%' }} />
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-1 italic">Micro-overhead added by semantic auditing.</p>
                                            </div>

                                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Shield className="w-4 h-4 text-indigo-600" />
                                                    <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">RUNTIME GOVERNANCE</span>
                                                </div>
                                                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 leading-tight">
                                                    Gemini 3 is intercepting and verifying every token against your policy base.
                                                </div>
                                            </div>

                                            <Button variant="outline" className="w-full text-xs h-8 border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/10" onClick={() => setIsGatekeeperConnected(false)}>
                                                Disconnect Gateway <Trash2 className="ml-2 w-3 h-3" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* STREAM 2 CONTENT - WIZARD FLOW */
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-5xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 font-bold">2</div>
                                <h2 className="text-xl font-bold">Stream 2: System Stability</h2>
                            </div>
                            {isSlaConnected && (
                                <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10 gap-1.5 py-1 px-3">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Stability Active
                                </Badge>
                            )}
                        </div>

                        {!isSlaConnected ? (
                            <div className="space-y-6">
                                {/* Wizard Steps Indicator */}
                                <div className="flex items-center justify-center mb-8">
                                    {[1, 2, 3].map((step) => (
                                        <React.Fragment key={step}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${wizardStep >= step ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 dark:bg-zinc-800 text-gray-400'
                                                }`}>
                                                {step}
                                            </div>
                                            {step < 3 && (
                                                <div className={`w-16 h-1 transition-all duration-300 ${wizardStep > step ? 'bg-purple-600' : 'bg-gray-200 dark:bg-zinc-800'
                                                    }`} />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>

                                {wizardStep === 1 && (
                                    <Card className="border-purple-100 dark:border-purple-900/30 max-w-2xl mx-auto overflow-hidden shadow-xl">
                                        <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                                        <CardHeader className="text-center pt-8">
                                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Activity className="w-8 h-8 text-purple-600" />
                                            </div>
                                            <CardTitle className="text-2xl">Bootstrap System Stability</CardTitle>
                                            <CardDescription>
                                                Start monitoring your AI system's health, latency, and reliability with Gemini-powered AIOps.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pb-8">
                                            <div className="space-y-2">
                                                <Label htmlFor="service-name">Application/Service Name</Label>
                                                <Input
                                                    id="service-name"
                                                    placeholder="e.g., payment-bot-v1"
                                                    value={serviceName}
                                                    onChange={(e) => setServiceName(e.target.value)}
                                                    className="focus-visible:ring-purple-500"
                                                />
                                                <p className="text-[10px] text-gray-500 italic">This ID will be used to identify your metrics in the dashboard.</p>
                                            </div>
                                            <div className="flex gap-4">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 h-11"
                                                    onClick={() => router.push('/dashboard')}
                                                >
                                                    Back to Dashboard
                                                </Button>
                                                <Button
                                                    className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white shadow-md group h-11"
                                                    onClick={() => setWizardStep(2)}
                                                    disabled={!serviceName.trim()}
                                                >
                                                    Next: Select Tech Stack <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {wizardStep === 2 && (
                                    <div className="space-y-6 max-w-4xl mx-auto">
                                        <div className="text-center mb-4">
                                            <h3 className="text-lg font-bold">Select your AI Backend Language</h3>
                                            <p className="text-sm text-gray-500">We'll generate tailored code for your specific stack.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {[
                                                { id: 'python', name: 'Python', desc: 'FastAPI, Flask, Django', icon: <Terminal className="w-8 h-8 text-blue-500" /> },
                                                { id: 'node', name: 'Node.js', desc: 'Express, NestJS, Next.js', icon: <Code2 className="w-8 h-8 text-green-500" /> },
                                                { id: 'curl', name: 'Shell / CI', desc: 'cURL, Bash Scripts', icon: <Server className="w-8 h-8 text-gray-500" /> }
                                            ].map((stack) => (
                                                <Card
                                                    key={stack.id}
                                                    className={`cursor-pointer transition-all border-2 group hover:shadow-lg ${selectedLang === stack.id ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20' : 'border-gray-100 dark:border-zinc-800 hover:border-purple-200'
                                                        }`}
                                                    onClick={() => setSelectedLang(stack.id)}
                                                >
                                                    <CardContent className="p-6 text-center">
                                                        <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform">{stack.icon}</div>
                                                        <h4 className="font-bold">{stack.name}</h4>
                                                        <p className="text-xs text-gray-500 mt-1">{stack.desc}</p>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center mt-8">
                                            <Button variant="ghost" onClick={() => setWizardStep(1)}>Back</Button>
                                            <Button
                                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                                onClick={() => setWizardStep(3)}
                                            >
                                                Generate Integration Code <Zap className="ml-2 w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {wizardStep === 3 && (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start max-w-6xl mx-auto">
                                        <div className="lg:col-span-2 space-y-4">
                                            <Card className="border-purple-100 dark:border-purple-800 shadow-xl overflow-hidden">
                                                <CardHeader className="bg-purple-50/50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-800">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <CardTitle className="text-lg">Integration Guide</CardTitle>
                                                            <CardDescription>Add this non-blocking telemetry sidecar to your app.</CardDescription>
                                                        </div>
                                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                                            {selectedLang.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-0">
                                                    <div className="relative group">
                                                        <div className="absolute right-3 top-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/10 backdrop-blur-sm shadow-sm"
                                                                onClick={() => navigator.clipboard.writeText(stabilitySnippets[selectedLang as keyof typeof stabilitySnippets])}
                                                            >
                                                                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Code
                                                            </Button>
                                                        </div>
                                                        <SyntaxHighlighter
                                                            language={selectedLang === 'curl' ? 'bash' : selectedLang}
                                                            style={vscDarkPlus}
                                                            customStyle={{ margin: 0, height: '420px', fontSize: '12px', lineHeight: '1.6', padding: '1.25rem' }}
                                                            showLineNumbers={true}
                                                            wrapLines={true}
                                                        >
                                                            {stabilitySnippets[selectedLang as keyof typeof stabilitySnippets]}
                                                        </SyntaxHighlighter>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Listening for telemetry from <code className="text-purple-600 font-bold">{serviceName}</code>...</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => setWizardStep(2)}>Back</Button>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 text-white font-bold px-6"
                                                        onClick={handleSlaConnect}
                                                        disabled={isConnecting}
                                                    >
                                                        {isConnecting ? (
                                                            <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span> Testing...</>
                                                        ) : (
                                                            <>Finalize Integration <ArrowRight className="ml-2 w-4 h-4" /></>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Card className="border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/5">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm flex items-center gap-2">
                                                        <Zap className="w-4 h-4 text-blue-500" /> What happens next?
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    <div className="text-xs text-gray-600 dark:text-gray-400 flex gap-2">
                                                        <div className="font-bold text-blue-500">1.</div>
                                                        <p>Once you run the code, PolicyGuard starts receiving <strong>Sub-millisecond heartbeats</strong>.</p>
                                                    </div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400 flex gap-2">
                                                        <div className="font-bold text-blue-500">2.</div>
                                                        <p>The <strong>SLA Dashboard</strong> will automatically detect the new service stream.</p>
                                                    </div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400 flex gap-2">
                                                        <div className="font-bold text-blue-500">3.</div>
                                                        <p>Gemini begins building a <strong>Performance Baseline</strong> to detect anomalies.</p>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800 text-center">
                                                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Ingestion Endpoint</div>
                                                <code className="text-xs font-mono text-purple-500 bg-purple-50 dark:bg-purple-900/10 px-2 py-1 rounded select-all">
                                                    {apiUrl}/api/v1/telemetry/ingest
                                                </code>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* CONNECTED STATE - ACTIVE DASHBOARD SUMMARY */
                            <div className="max-w-4xl mx-auto space-y-6">
                                <Card className="border-purple-500/30 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-black overflow-hidden shadow-2xl">
                                    <div className="h-1 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Activity className={`w-5 h-5 ${serviceRisk.score > 70 ? 'text-red-500' : serviceRisk.score > 30 ? 'text-yellow-500' : 'text-purple-600'}`} />
                                                Active Monitoring: <span className="text-indigo-600 font-mono">{serviceName}</span>
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                <div className={`w-2 h-2 rounded-full animate-pulse ${serviceRisk.score > 70 ? 'bg-red-500' : serviceRisk.score > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                                Real-time stability stream connected via <strong>{selectedLang === 'node' ? 'Node.js Express' : selectedLang}</strong>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-2 text-[10px] ml-2 text-gray-400 hover:text-purple-500"
                                                    onClick={() => setIsSlaConnected(false)}
                                                >
                                                    <Settings className="w-3 h-3 mr-1" /> Reconfigure
                                                </Button>
                                            </CardDescription>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                            onClick={() => router.push('/dashboard/sla')}
                                        >
                                            Open SLA Monitor <ArrowRight className="ml-2 w-4 h-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-4">
                                                <div className={`p-4 bg-white dark:bg-zinc-900 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center transition-all duration-500 ${serviceRisk.score > 70 ? 'border-red-200 dark:border-red-900/40 bg-red-50/10' :
                                                    serviceRisk.score > 30 ? 'border-yellow-200 dark:border-yellow-900/40 bg-yellow-50/10' :
                                                        'border-gray-100 dark:border-zinc-800'
                                                    }`}>
                                                    <Activity className={"w-5 h-5 mb-2 " + (serviceRisk.score > 70 ? "text-red-500" : serviceRisk.score > 30 ? "text-yellow-500" : "text-purple-400")} />
                                                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tight mb-1">Deployment Verdict</div>
                                                    <div className={"text-3xl font-black tracking-tighter transition-all duration-300 " + (serviceRisk.score > 70 ? "text-red-600 scale-110" : serviceRisk.score > 30 ? "text-yellow-600" : "text-green-600")}>
                                                        {serviceRisk.score > 70 ? 'BLOCKED' : serviceRisk.score > 30 ? 'CAUTION' : 'PASSED'}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 mt-2 font-medium italic">
                                                        {serviceRisk.score > 70 ? 'Policy violation detected' : serviceRisk.score > 30 ? 'Risk threshold reached' : 'Compliance threshold met'}
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                                    <div className="flex justify-between items-center text-xs mb-1">
                                                        <span className="text-indigo-700 dark:text-indigo-300 font-medium">Auto-Remediation</span>
                                                        <Badge className={`${serviceRisk.score > 0 ? 'bg-green-500/20 text-green-600' : 'bg-gray-500/10 text-gray-400'} border-none px-1.5 py-0 h-4 text-[9px]`}>
                                                            {serviceRisk.score > 0 ? 'READY' : 'STANDBY'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[10px] text-indigo-900/60 dark:text-indigo-300/60 leading-tight">
                                                        {serviceRisk.score > 70 ? 'Critical failure detected. remediation scripts staged.' : serviceRisk.score > 30 ? 'Moderate risks detected. Optimization suggested.' : 'Gemini is monitoring for common failures in this stack.'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="md:col-span-2 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Recent Telemetry Bursts</h4>
                                                    <Badge variant="outline" className="text-[9px] py-0 h-4">{telemetryHistory.length > 0 ? 'Live Data' : 'Waiting for Data'}</Badge>
                                                </div>
                                                <div className="h-24 flex items-end gap-1 px-2">
                                                    {telemetryHistory.length > 0 ? (
                                                        telemetryHistory.map((point: any, i: number) => (
                                                            <div
                                                                key={i}
                                                                className={`flex-1 rounded-t-sm transition-all duration-700 cursor-help ${point.risk_score > 70 ? 'bg-red-500' : point.risk_score > 30 ? 'bg-yellow-500' : 'bg-indigo-500'
                                                                    }`}
                                                                style={{ height: `${Math.max(10, point.risk_score)}%` }}
                                                                title={`Latency: ${point.latency_ms}ms | Risk: ${point.risk_score}`}
                                                            />
                                                        ))
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-lg">
                                                            <span className="text-[10px] text-gray-400">Waiting for {serviceName} telemetry...</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-4 flex justify-between">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-[10px] text-gray-500 hover:text-red-500 underline"
                                                        onClick={() => {
                                                            setIsSlaConnected(false);
                                                            setWizardStep(1);
                                                            setTelemetryHistory([]);
                                                        }}
                                                    >
                                                        Disconnect Service
                                                    </Button>
                                                    <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> Updated {Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000)}s ago
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
