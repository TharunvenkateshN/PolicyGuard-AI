"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Loader2, Activity, AlertTriangle, CheckCircle2, TrendingUp, Zap, Server, Clock } from "lucide-react";

// Types matching Backend
interface SLAMetricsInput {
    latency_ms: number;
    error_rate_percent: number;
    uptime_percent: number;
    support_response_time_hours: number;
    service_name: string;
}

interface TimelineEvent {
    time: string;
    event: string;
    severity: "Info" | "Medium" | "High";
}

interface SLAAnalysisResult {
    sla_score: number;
    status: "Healthy" | "Degraded" | "Breached";
    analysis_summary: string;
    impact_analysis: string;
    recommendations: string[];
    projected_timeline: TimelineEvent[];
}

export default function SLAAnalyticsPage() {
    // Inputs
    const [metrics, setMetrics] = useState<SLAMetricsInput>({
        latency_ms: 150,
        error_rate_percent: 0.05,
        uptime_percent: 99.95,
        support_response_time_hours: 2,
        service_name: "Core-AI-Engine-v1"
    });

    // Analysis State
    const [analysis, setAnalysis] = useState<SLAAnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [simulatedGraphData, setSimulatedGraphData] = useState<any[]>([]);

    // Simulate "Live" Graph based on inputs
    useEffect(() => {
        const generateGraphData = () => {
            const data = [];
            const now = new Date();
            for (let i = 20; i >= 0; i--) {
                const time = new Date(now.getTime() - i * 60000);
                // Add some noise based on inputs
                const noise = (Math.random() - 0.5) * (metrics.latency_ms * 0.2);
                const errorSpike = Math.random() < (metrics.error_rate_percent / 100) ? 1 : 0;

                data.push({
                    time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    latency: Math.max(0, metrics.latency_ms + noise),
                    errors: errorSpike,
                    sla_threshold: 500 // Arbitrary threshold for viz
                });
            }
            return data;
        };
        setSimulatedGraphData(generateGraphData());
    }, [metrics]);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/v1/sla/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metrics)
            });

            if (!response.ok) throw new Error("Analysis Failed");

            const data = await response.json();
            setAnalysis(data);
        } catch (error) {
            console.error("Analysis Error:", error);
            // Fallback mock if backend fails (dev mode safety)
            setAnalysis({
                sla_score: 85,
                status: "Degraded",
                analysis_summary: "Simulated response: Backend connection failed.",
                impact_analysis: "Unable to reach the AI Engine. Displaying mock validation data.",
                recommendations: ["Check backend logs", "Verify API Key"],
                projected_timeline: [
                    { time: "Now", event: "Connection Error", severity: "High" }
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    // Helper to calculate score color
    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-green-500";
        if (score >= 70) return "text-yellow-500";
        return "text-red-500";
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div id="sla-header" className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                        SLA Designer & Analytics
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Powered by <span className="font-semibold text-purple-600">Gemini 3 Pro</span> • Real-time SLA simulation
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="border-purple-500 text-purple-500">
                        <Zap className="w-3 h-3 mr-1" /> Live Preview
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT COLUMN: Controls */}
                <Card id="sla-metrics-card" className="lg:col-span-4 h-fit border-l-4 border-l-purple-500 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-purple-600" /> Service Metrics
                        </CardTitle>
                        <CardDescription>Adjust sliders to simulate service conditions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">

                        {/* 1. Latency */}
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label className="flex items-center gap-2"><Clock className="w-4 h-4" /> Avg. Latency</Label>
                                <span className="font-mono font-bold text-purple-600">{metrics.latency_ms} ms</span>
                            </div>
                            <Slider
                                value={[metrics.latency_ms]}
                                min={10} max={2000} step={10}
                                onValueChange={(v) => {
                                    if (v[0] !== metrics.latency_ms) {
                                        setMetrics(prev => ({ ...prev, latency_ms: v[0] }));
                                    }
                                }}
                                className="cursor-pointer"
                            />
                        </div>

                        {/* 2. Error Rate */}
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Error Rate</Label>
                                <span className={`font-mono font-bold ${metrics.error_rate_percent > 1 ? "text-red-500" : "text-green-600"}`}>
                                    {metrics.error_rate_percent}%
                                </span>
                            </div>
                            <Slider
                                value={[metrics.error_rate_percent]}
                                min={0} max={10} step={0.01}
                                onValueChange={(v) => {
                                    if (v[0] !== metrics.error_rate_percent) {
                                        setMetrics(prev => ({ ...prev, error_rate_percent: v[0] }));
                                    }
                                }}
                            />
                        </div>

                        {/* 3. Uptime */}
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label className="flex items-center gap-2"><Server className="w-4 h-4" /> Uptime Target</Label>
                                <span className="font-mono font-bold text-blue-600">{metrics.uptime_percent}%</span>
                            </div>
                            <Slider
                                value={[metrics.uptime_percent]}
                                min={90} max={99.99} step={0.01}
                                onValueChange={(v) => {
                                    if (v[0] !== metrics.uptime_percent) {
                                        setMetrics(prev => ({ ...prev, uptime_percent: v[0] }));
                                    }
                                }}
                            />
                        </div>

                        {/* 4. Support Response */}
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label>Support Response (Hours)</Label>
                                <span className="font-mono font-bold">{metrics.support_response_time_hours}h</span>
                            </div>
                            <Slider
                                value={[metrics.support_response_time_hours]}
                                min={1} max={48} step={1}
                                onValueChange={(v) => {
                                    if (v[0] !== metrics.support_response_time_hours) {
                                        setMetrics(prev => ({ ...prev, support_response_time_hours: v[0] }));
                                    }
                                }}
                            />
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button
                            id="generate-sla-btn"
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg transition-all"
                            size="lg"
                            onClick={handleAnalyze}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing with Gemini 3 Pro...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2" /> Generate SLA Report
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                {/* RIGHT COLUMN: Visualization & Report */}
                <div className="lg:col-span-8 space-y-6">

                    {/* 1. Live Graph Simulation */}
                    <Card id="sla-simulation-graph" className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-widest">Live Latency Simulation</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={simulatedGraphData}>
                                    <defs>
                                        <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
                                    <XAxis dataKey="time" hide />
                                    <YAxis />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="latency" stroke="#8884d8" fillOpacity={1} fill="url(#colorLat)" />
                                    {/* <Line type="monotone" dataKey="sla_threshold" stroke="#ff7300" strokeDasharray="5 5" dot={false} /> */}
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* 2. Gemini Analysis Output */}
                    {analysis && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">

                            {/* Score Banner */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-black border-2 border-purple-100 dark:border-purple-900">
                                    <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Predicted SLA Score</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className={`text-5xl font-black ${getScoreColor(analysis.sla_score)}`}>
                                            {analysis.sla_score}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="md:col-span-2 bg-purple-50 dark:bg-zinc-900/50 border-none">
                                    <CardHeader className="pb-2"><CardTitle className="text-sm text-purple-700 dark:text-purple-400">Analysis Summary</CardTitle></CardHeader>
                                    <CardContent>
                                        <p className="text-lg font-medium leading-relaxed">
                                            {analysis.analysis_summary}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Detailed Report Tabs */}
                            <Tabs defaultValue="impact" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
                                    <TabsTrigger value="timeline">Risk Timeline</TabsTrigger>
                                    <TabsTrigger value="recs">Recommendations</TabsTrigger>
                                </TabsList>

                                <TabsContent value="impact" className="mt-4">
                                    <Card>
                                        <CardHeader><CardTitle>Operational Impact</CardTitle></CardHeader>
                                        <CardContent>
                                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                                {analysis.impact_analysis}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="timeline" className="mt-4">
                                    <Card>
                                        <CardHeader><CardTitle>Projected Risk Timeline</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="space-y-6">
                                                {analysis.projected_timeline.map((item, idx) => (
                                                    <div key={idx} className="flex gap-4 relative">
                                                        {/* Line */}
                                                        {idx !== analysis.projected_timeline.length - 1 && (
                                                            <div className="absolute left-[19px] top-8 bottom-[-24px] w-0.5 bg-gray-200 dark:bg-zinc-800"></div>
                                                        )}

                                                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                                                            ${item.severity === 'High' ? 'bg-red-100 text-red-600' :
                                                                item.severity === 'Medium' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            {item.severity === 'High' ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                        </div>
                                                        <div className="pt-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-sm bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{item.time}</span>
                                                                <span className={`text-xs font-semibold uppercase ${item.severity === 'High' ? 'text-red-500' : 'text-gray-500'
                                                                    }`}>{item.severity} Impact</span>
                                                            </div>
                                                            <p className="mt-1 font-medium">{item.event}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="recs" className="mt-4">
                                    <Card>
                                        <CardHeader><CardTitle>Mitigation Strategies</CardTitle></CardHeader>
                                        <CardContent>
                                            <ul className="space-y-3">
                                                {analysis.recommendations.map((rec, idx) => (
                                                    <li key={idx} className="flex gap-3 items-start bg-white dark:bg-zinc-950 p-3 rounded border shadow-sm">
                                                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                                        <span>{rec}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
