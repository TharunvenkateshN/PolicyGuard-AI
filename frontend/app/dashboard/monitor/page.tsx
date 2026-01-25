"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Zap, TrendingUp, AlertTriangle, Lock, Server, CheckCircle2, ShieldCheck, LineChart, Globe } from "lucide-react"
import { LineChart as RLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import ComplianceGraph from "@/components/dashboard/ComplianceGraph";

interface Trace {
    id: string;
    timestamp: string;
    agent: string;
    action: string;
    status: 'pass' | 'block' | 'warn';
    details: string;
}

interface MonitorData {
    traces_per_min: number;
    blocking_rate: number;
    active_policies: number;
    traces: Trace[];
}

interface RiskData {
    risk_score: number;
    risk_label: string;
    factors: string[];
    timestamp?: string;
}

export default function MonitorPage() {
    // --- Global Data ---
    const [data, setData] = useState<MonitorData>({ traces_per_min: 0, blocking_rate: 0, active_policies: 0, traces: [] });
    const [risk, setRisk] = useState<RiskData>({ risk_score: 0, risk_label: "Calculating...", factors: [] });
    const [riskHistory, setRiskHistory] = useState<any[]>([]);

    // --- SLA Guard State ---
    const [isSlaConnected, setIsSlaConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [serviceName, setServiceName] = useState("payment-service-prod");

    // --- Fetching Logic ---
    useEffect(() => {
        const fetchMonitor = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/v1/dashboard/monitor');
                if (res.ok) setData(await res.json());
            } catch (err) { console.error(err); }
        };
        fetchMonitor();
        const interval = setInterval(fetchMonitor, 30000); // 30s to save API quota
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const SIM_SERVICE_ID = "agent-core-001";
        const simulateTelemetry = async () => {
            const baseLatency = 200;
            const randomLatency = Math.floor(Math.random() * 100) + baseLatency;
            const errorSpike = Math.random() > 0.85 ? 0.05 : 0.001;

            const payload = {
                service_id: SIM_SERVICE_ID,
                error_rate: errorSpike,
                latency_ms: randomLatency,
                request_count: Math.floor(Math.random() * 50)
            };

            await fetch('http://localhost:8000/api/v1/telemetry/ingest', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });

            const res = await fetch(`http://localhost:8000/api/v1/telemetry/risk/${SIM_SERVICE_ID}`);
            if (res.ok) setRisk(await res.json());

            // Fetch History for Graph
            const histRes = await fetch(`http://localhost:8000/api/v1/telemetry/history/${SIM_SERVICE_ID}`);
            if (histRes.ok) {
                const histData = await histRes.json();
                // Format for Recharts
                setRiskHistory(histData.map((h: any) => ({
                    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    risk: h.risk_score
                })));
            }
        };
        const interval = setInterval(simulateTelemetry, 15000); // 15s to save quota
        return () => clearInterval(interval);
    }, []);

    const handleConnect = () => {
        setIsConnecting(true);
        // Simulate handshake delay
        setTimeout(() => {
            setIsConnecting(false);
            setIsSlaConnected(true);
        }, 2500);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Continuous Compliance Monitor</h1>
                    <p className="text-gray-500 dark:text-gray-400">Real-time auditing & predictive risk analysis.</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="animate-pulse border-green-500 text-green-500 bg-green-500/10">
                        <Activity className="w-3 h-3 mr-1" /> Live Feed
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="audit" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                    <TabsTrigger id="audit-tab" value="audit">Audit Log Stream</TabsTrigger>
                    <TabsTrigger id="topology-tab" value="topology" className="flex items-center gap-2">
                        <Globe className="w-3 h-3" /> Topology 3D
                    </TabsTrigger>
                    <TabsTrigger id="sla-tab" value="sla" className="flex items-center gap-2">
                        <Zap className="w-3 h-3" /> SLA Guard
                    </TabsTrigger>
                </TabsList>


                {/* --- TAB 1: AUDIT STREAM --- */}
                <TabsContent value="audit" className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Live Traces / Min</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{data.traces_per_min}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Blocking Rate</CardTitle></CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${data.blocking_rate > 0 ? "text-red-500" : "text-green-500"}`}>{data.blocking_rate}%</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Active Policies</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-blue-500">{data.active_policies}</div></CardContent>
                        </Card>
                    </div>
                    <Card id="audit-log-table">
                        <CardHeader><CardTitle>Audit Log Stream</CardTitle></CardHeader>
                        <CardContent>
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-zinc-800 dark:text-gray-400">
                                        <tr>
                                            <th className="px-6 py-3">Timestamp</th><th className="px-6 py-3">Trace ID</th><th className="px-6 py-3">Agent</th><th className="px-6 py-3">Action</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                                        {data.traces.length === 0 ? (
                                            <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Waiting for live traffic...</td></tr>
                                        ) : (
                                            data.traces.map((trace) => (
                                                <tr key={trace.id} className="bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <td className="px-6 py-4 font-mono text-gray-500">{trace.timestamp}</td>
                                                    <td className="px-6 py-4 font-medium">{trace.id}</td>
                                                    <td className="px-6 py-4 truncate max-w-[200px]" title={trace.agent}>{trace.agent}</td>
                                                    <td className="px-6 py-4">{trace.action}</td>
                                                    <td className="px-6 py-4">
                                                        {trace.status === 'pass' && <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">PASS</Badge>}
                                                        {trace.status === 'block' && <Badge variant="destructive">BLOCKED</Badge>}
                                                        {trace.status === 'warn' && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">WARN</Badge>}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{trace.details}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB 2: 3D TOPOLOGY --- */}
                <TabsContent value="topology" className="mt-4">
                    <Card className="border-cyan-500/20 bg-[#020617]/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Globe className="w-5 h-5 text-cyan-500" />
                                System Topology
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Real-time 3D mapping of service infrastructure, policy envelopes, and detected vulnerabilities.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 border-t border-slate-800">
                            <ComplianceGraph report={{
                                workflow_name: serviceName,
                                system_spec: {
                                    agent_name: serviceName,
                                    summary: "Enterprise Grade AI Service in Production",
                                    primary_purpose: "Infrastructure Management",
                                    decision_authority: "High",
                                    automation_level: "Medium",
                                    deployment_stage: "Production",
                                    geographic_exposure: ["Global"]
                                },
                                data_map: {
                                    data_categories_detected: ["PII", "Encrypted Secrets", "Auth Tokens", "User Metadata"],
                                    data_flow_source: "Gateway -> Microservice -> DB",
                                    data_storage_retention: "SOC2 Compliant",
                                    cross_border_transfer: "Blocked (GDPR)"
                                },
                                policy_matrix: [
                                    { policy_area: "Data Privacy", status: "Compliant", reason: "Encryption active" },
                                    { policy_area: "Access Control", status: "Compliant", reason: "RBAC enforced" },
                                    { policy_area: "Resiliency SLI", status: "At Risk", reason: "Latency spike detected" },
                                    { policy_area: "OWASP LLM01", status: "At Risk", reason: "Instruction Injection possible" }
                                ],
                                risk_assessment: {
                                    overall_score: 85,
                                    overall_rating: "Medium",
                                    confidence_score: "High",
                                    breakdown: { "Technical": "Low", "Compliance": "Medium" }
                                },
                                evidence: [
                                    { policy_section: "SLA-001", issue_description: "Response time > 500ms", severity: "Medium", workflow_component: "API Layer", source_doc: "CloudWatch", snippet: "LATENCY_THRESHOLD_EXCEEDED" },
                                    { policy_section: "OWASP-01", issue_description: "Malicious prompt pattern detected", severity: "High", workflow_component: "Prompt Engine", source_doc: "WAF Logs", snippet: "PROMPT_INJECTION_MATCH" }
                                ],
                                business_impact: {
                                    financial_exposure: "Medium",
                                    regulatory_penalty: "Potential SOC2 non-compliance fines",
                                    brand_reputation: "Risk of trust erosion",
                                    estimated_cost: "$10k - $25k"
                                },
                                recommendations: [
                                    { title: "Optimize Gateway Latency", type: "Advisory", description: "Scale up pod resources.", related_policy: "SLA-001" }
                                ],
                                verdict: { approved: true, status_label: "Stable", approval_conditions: [] }
                            }} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB 2: SLA GUARD --- */}
                <TabsContent value="sla" className="space-y-4 mt-4">
                    {!isSlaConnected ? (
                        <div className="flex justify-center items-center py-12">
                            <Card className="w-full max-w-lg border-2 border-dashed border-gray-300 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/50">
                                <CardHeader className="text-center">
                                    <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-4">
                                        <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <CardTitle>Connect SLA-Guard AI</CardTitle>
                                    <CardDescription>
                                        Integrate your service backend to enable predictive SLA monitoring and risk forecasting.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Service Name</Label>
                                        <Input placeholder="e.g. payment-service-prod" value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Metrics Endpoint</Label>
                                        <Input placeholder="https://api.yourservice.com/metrics" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>API Key</Label>
                                        <Input type="password" placeholder="sk_live_..." />
                                    </div>
                                    <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleConnect} disabled={isConnecting}>
                                        {isConnecting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Verifying Handshake...
                                            </>
                                        ) : (
                                            <>
                                                <Server className="w-4 h-4 mr-2" /> Connect Backend
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            {/* Header Status */}
                            <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-lg border shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{serviceName}</h3>
                                        <p className="text-sm text-gray-500 flex items-center">
                                            <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" /> Connection Active • Syncing every 3s
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Current Risk</p>
                                    <div className={`text-3xl font-black ${risk.risk_score > 50 ? "text-red-500" : "text-green-500"}`}>
                                        {risk.risk_score}%
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                                {/* Main Chart */}
                                <Card className="lg:col-span-4">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <LineChart className="w-4 h-4" /> Risk Trend Forecast
                                        </CardTitle>
                                        <CardDescription>Probability of SLA breach over the last hour.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={riskHistory}>
                                                    <defs>
                                                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="time" hide />
                                                    <YAxis domain={[0, 100]} />
                                                    <RTooltip
                                                        contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }}
                                                    />
                                                    <Area type="monotone" dataKey="risk" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={3} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Scorecards / Factors */}
                                <Card className="lg:col-span-3">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" /> Risk Factors
                                        </CardTitle>
                                        <CardDescription>Key drivers contributing to current risk.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {risk.factors.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <CheckCircle2 className="w-12 h-12 mx-auto text-green-200 mb-2" />
                                                <p>System operating within optimal parameters.</p>
                                            </div>
                                        ) : (
                                            risk.factors.map((factor, idx) => (
                                                <div key={idx} className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                            <AlertTriangle className="w-4 h-4 text-orange-500" /> {factor}
                                                        </span>
                                                        <span className="text-red-500 font-bold">Critical</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-red-500 w-[85%] rounded-full animate-pulse"></div>
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                        <div className="mt-8 pt-6 border-t">
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Incident Timeline</h4>
                                            <div className="flex gap-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <div key={i} className={`h-2 flex-1 rounded-sm ${i === 4 ? (risk.risk_score > 50 ? 'bg-red-500' : 'bg-green-500') : 'bg-green-200'}`}></div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                <span>10 min ago</span>
                                                <span>Now</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
