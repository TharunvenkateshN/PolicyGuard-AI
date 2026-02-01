"use client";

import { cn } from "@/lib/utils";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Clock, Shield, AlertTriangle, CheckCircle2, XCircle, Brain, Lightbulb, Zap, Terminal, Search } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ProxyLog {
    timestamp: string;
    event: string;
    status: 'INFO' | 'PASS' | 'BLOCK' | 'WARN';
    details?: string;
}

interface SLAMetrics {
    timestamp: string;
    uptime_percentage: number;
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    success_rate: number;
    avg_response_time_ms: number;
    p95_response_time_ms: number;
    p99_response_time_ms: number;
    requests_per_minute: number;
    requests_per_hour: number;
    pii_blocks: number;
    policy_violations: number;
    sla_status: 'healthy' | 'at_risk' | 'violated';
}

interface HistoryDataPoint {
    timestamp: string;
    total_requests: number;
    successful_requests: number;
    avg_response_time_ms: number;
    pii_blocks: number;
    policy_violations: number;
}

interface AIAnalysis {
    risk_score: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    risk_factors: Array<{
        factor: string;
        severity: string;
        impact_percentage: number;
    }>;
    trend_analysis: {
        direction: 'improving' | 'stable' | 'degrading';
        confidence: number;
        summary: string;
    };
    recommendations: Array<{
        priority: string;
        action: string;
        reason: string;
        expected_impact: string;
    }>;
    forecast: {
        next_hour_uptime: number;
        next_hour_avg_latency: number;
        breach_probability: number;
    };
}

export default function SLAMonitorPage() {
    const [metrics, setMetrics] = useState<SLAMetrics | null>(null);
    const [history, setHistory] = useState<HistoryDataPoint[]>([]);
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [logs, setLogs] = useState<ProxyLog[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const fetchMetrics = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

            // Create timeout promise (10 seconds)
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), 10000)
            );

            // Fetch current metrics with timeout
            const metricsPromise = fetch(`${apiUrl}/api/v1/sla/metrics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json());

            const metricsData = await Promise.race([metricsPromise, timeout]);
            setMetrics(metricsData as SLAMetrics);

            // Fetch history with timeout
            const historyPromise = fetch(`${apiUrl}/api/v1/sla/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hours: 24 })
            }).then(res => res.json());

            const historyData = await Promise.race([historyPromise, timeout]);
            setHistory(historyData.data_points || []);

            const logsRes = await fetch(`${apiUrl}/api/v1/proxy/logs`);
            const logsData = await logsRes.json();
            setLogs(logsData);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching SLA metrics:', error);
            // Set mock data on timeout/error so page isn't stuck
            setMetrics({
                timestamp: new Date().toISOString(),
                uptime_percentage: 99.5,
                total_requests: 0,
                successful_requests: 0,
                failed_requests: 0,
                success_rate: 100,
                avg_response_time_ms: 0,
                p95_response_time_ms: 0,
                p99_response_time_ms: 0,
                requests_per_minute: 0,
                requests_per_hour: 0,
                pii_blocks: 0,
                policy_violations: 0,
                sla_status: 'healthy'
            });
            setHistory([]);
            setLoading(false);
        }
    };

    const runAIAnalysis = async () => {
        setAnalyzing(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await fetch(`${apiUrl}/api/v1/sla/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            setAiAnalysis(data);
        } catch (error) {
            console.error('AI Analysis failed:', error);
        } finally {
            setAnalyzing(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        const metricsInterval = setInterval(fetchMetrics, 5000); // Refresh metrics every 5 seconds

        // Run AI analysis initially
        const aiTimer = setTimeout(() => {
            runAIAnalysis();
        }, 2000);

        // Poll AI Analysis every 12 seconds
        const aiInterval = setInterval(() => {
            runAIAnalysis();
        }, 12000);

        return () => {
            clearInterval(metricsInterval);
            clearInterval(aiInterval);
            clearTimeout(aiTimer);
        };
    }, []);

    const getSLAStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-green-500';
            case 'at_risk': return 'text-yellow-500';
            case 'violated': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    const getSLAStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle2 className="w-8 h-8 text-green-500" />;
            case 'at_risk': return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
            case 'violated': return <XCircle className="w-8 h-8 text-red-500" />;
            default: return <Activity className="w-8 h-8 text-gray-500" />;
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'low': return 'text-green-500 border-green-500/20 bg-green-500/10';
            case 'medium': return 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10';
            case 'high': return 'text-orange-500 border-orange-500/20 bg-orange-500/10';
            case 'critical': return 'text-red-500 border-red-500/20 bg-red-500/10';
            default: return 'text-gray-500 border-gray-500/20 bg-gray-500/10';
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-400">Loading SLA metrics...</div>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-400">No metrics available. Start sending requests through the proxy to see SLA data.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2 text-foreground">SLA Monitoring</h1>
                <p className="text-muted-foreground">Real-time performance metrics with Gemini AI predictive analysis</p>
            </div>

            {/* SLA Status Banner */}
            <Card className="border-2 shadow-sm dark:shadow-none bg-white dark:bg-zinc-900" style={{ borderColor: metrics.sla_status === 'healthy' ? '#22c55e' : metrics.sla_status === 'at_risk' ? '#eab308' : '#ef4444' }}>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-full">
                                {getSLAStatusIcon(metrics.sla_status)}
                            </div>
                            <div>
                                <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                                    {metrics.uptime_percentage.toFixed(3)}% Uptime
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    SLA Target: 99.9% | Status: <span className={cn("font-bold", getSLAStatusColor(metrics.sla_status))}>{metrics.sla_status.toUpperCase()}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center sm:items-end">
                            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-bold">Last Updated</div>
                            <div className="text-sm font-mono text-foreground font-semibold bg-gray-50 dark:bg-zinc-800 px-3 py-1 rounded-md">{new Date(metrics.timestamp).toLocaleTimeString()}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/* AI Analysis Section */}
            {aiAnalysis ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Left Column: Stacked Analysis & Factors */}
                    <div className="lg:col-span-1 space-y-6 flex flex-col">
                        {/* 1. Risk Score Card */}
                        <Card id="gemini-risk-card" className="border-2 border-purple-200 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/5 shadow-md dark:shadow-none flex-grow">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                                    <Brain className="w-5 h-5" />
                                    Gemini Risk Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center mb-6">
                                    <div className="text-5xl font-bold text-foreground mb-2">
                                        {aiAnalysis?.risk_score ?? 0}<span className="text-2xl text-purple-600 dark:text-purple-400">%</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">Breach Probability (1h)</div>
                                </div>

                                <div className="flex justify-center mb-6 text-foreground font-bold">
                                    <Badge variant="outline" className={`px-4 py-1 uppercase font-bold border-2 ${getRiskColor(aiAnalysis.risk_level)}`}>
                                        {aiAnalysis.risk_level} RISK
                                    </Badge>
                                </div>

                                <div className="space-y-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-purple-100 dark:border-transparent">
                                    <h4 className="text-sm font-semibold text-foreground">Analysis Summary</h4>
                                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                                        "{aiAnalysis?.trend_analysis?.summary || 'No summary available.'}"
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Risk Factors & Forecast */}
                        <Card className="shadow-md dark:shadow-none bg-card flex-grow">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-foreground">
                                    <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    Risk Factors
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    {aiAnalysis?.risk_factors?.map((factor, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between mb-1 text-sm font-medium text-foreground">
                                                <span>{factor.factor}</span>
                                                <span className={factor.impact_percentage > 50 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}>
                                                    {factor.impact_percentage}% Impact
                                                </span>
                                            </div>
                                            <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${factor.impact_percentage > 50 ? 'bg-red-500 dark:bg-red-600' : 'bg-yellow-500'}`}
                                                    style={{ width: `${factor.impact_percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {(!aiAnalysis?.risk_factors || aiAnalysis.risk_factors.length === 0) && (
                                        <div className="text-center text-muted-foreground py-4">
                                            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                            No active risk factors detected
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-border">
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                                        <TrendingUp className="w-4 h-4 text-indigo-500" /> Next Hour Forecast
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-foreground">
                                        <div className="bg-secondary/50 dark:bg-gray-800/50 p-4 rounded-xl border border-border/50">
                                            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Predicted Uptime</div>
                                            <div className="text-xl font-black text-green-600 dark:text-green-400">
                                                {aiAnalysis?.forecast?.next_hour_uptime?.toFixed(3) ?? '0.000'}%
                                            </div>
                                        </div>
                                        <div className="bg-secondary/50 dark:bg-gray-800/50 p-4 rounded-xl border border-border/50">
                                            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Predicted Latency</div>
                                            <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                                                {aiAnalysis?.forecast?.next_hour_avg_latency?.toFixed(0) ?? '0'}<span className="text-xs ml-0.5">ms</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Expanded Recommendations & Logs */}
                    <div className="lg:col-span-2 space-y-6 flex flex-col">
                        <Card className="shadow-md dark:shadow-none flex-grow">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-foreground">
                                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                                    Smart Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '400px' }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {aiAnalysis?.recommendations?.map((rec, i) => (
                                        <div key={i} className="bg-secondary/30 dark:bg-gray-800/30 border border-border rounded-xl p-4 transition-all hover:bg-secondary/50 flex flex-col">
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge variant="outline" className="text-[10px] uppercase font-bold bg-white dark:bg-black/20">
                                                    {rec.priority?.toUpperCase()} Priority
                                                </Badge>
                                                <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/20" />
                                            </div>
                                            <h5 className="font-bold text-sm mb-1 text-foreground leading-tight">{rec.action}</h5>
                                            <p className="text-xs text-muted-foreground mb-3 leading-relaxed flex-grow">{rec.reason}</p>
                                            <div className="text-[11px] font-semibold text-green-600 dark:text-green-400 flex items-center gap-1.5 p-1.5 bg-green-50 dark:bg-green-500/10 rounded-md mt-auto">
                                                <TrendingUp className="w-3 h-3" />
                                                Impact: {rec.expected_impact}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Live Proxy Audit Feed */}
                        <Card className="shadow-md dark:shadow-none border-t-2 border-t-blue-500/50 flex-grow">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-foreground text-sm font-bold">
                                        <Terminal className="w-4 h-4 text-blue-500" />
                                        Live Proxy Audit Feed
                                    </CardTitle>
                                    <Badge variant="secondary" className="text-[10px] animate-pulse bg-blue-500/10 text-blue-500 border-blue-500/20">
                                        LIVE STREAM
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-black/5 dark:bg-black/40 rounded-xl border border-border overflow-hidden">
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar font-mono text-[11px]">
                                        {logs.length > 0 ? (
                                            <table className="w-full border-collapse">
                                                <thead className="bg-muted/50 text-muted-foreground sticky top-0">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left font-bold uppercase tracking-wider w-24">Time</th>
                                                        <th className="px-3 py-2 text-left font-bold uppercase tracking-wider">Event</th>
                                                        <th className="px-3 py-2 text-center font-bold uppercase tracking-wider w-20">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {[...logs].reverse().map((log, i) => (
                                                        <tr key={i} className="hover:bg-blue-500/5 transition-colors">
                                                            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="text-foreground font-semibold">{log.event}</span>
                                                                    {log.details && <span className="text-[10px] text-muted-foreground opacity-70 truncate max-w-[300px]">{log.details}</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "text-[9px] px-1.5 py-0 font-black",
                                                                        log.status === 'BLOCK' && "border-red-500 text-red-500 bg-red-500/10",
                                                                        log.status === 'PASS' && "border-green-500 text-green-500 bg-green-500/10",
                                                                        log.status === 'WARN' && "border-yellow-500 text-yellow-500 bg-yellow-500/10",
                                                                        log.status === 'INFO' && "border-blue-500 text-blue-500 bg-blue-500/10"
                                                                    )}
                                                                >
                                                                    {log.status}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
                                                <Search className="w-8 h-8 opacity-20" />
                                                <p className="text-xs italic">Waiting for proxy traffic...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="flex justify-center py-12">
                    {analyzing ? (
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                            <p className="text-gray-400">Gemini is analyzing SLA patterns...</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <Brain className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 mb-4">AI Analysis ready for generation.</p>
                            <button
                                onClick={runAIAnalysis}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors"
                            >
                                Run Analysis
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="md:col-span-2 border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            Latency Control Center
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Average</div>
                                <div className="text-3xl font-black text-foreground">
                                    {metrics.avg_response_time_ms.toFixed(0)}<span className="text-xs ml-0.5">ms</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    <span className="text-[10px] font-medium text-green-500">System Avg</span>
                                </div>
                            </div>
                            <div className="space-y-1 border-x border-border/50 px-4">
                                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-yellow-500" /> P95
                                </div>
                                <div className="text-3xl font-black text-yellow-500">
                                    {metrics.p95_response_time_ms.toFixed(0)}<span className="text-xs ml-0.5">ms</span>
                                </div>
                                <div className="text-[10px] font-medium text-muted-foreground">Typical Slow</div>
                            </div>
                            <div className="space-y-1 text-right">
                                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-end gap-1">
                                    <Zap className="w-3 h-3 text-red-500 fill-red-500/20" /> P99
                                </div>
                                <div className="text-3xl font-black text-red-500">
                                    {metrics.p99_response_time_ms.toFixed(0)}<span className="text-xs ml-0.5">ms</span>
                                </div>
                                <div className="text-[10px] font-medium text-red-500 font-bold uppercase tracking-tighter">SLA Critical</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Throughput
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.requests_per_minute}</div>
                        <div className="text-xs text-gray-400 mt-1">
                            requests/min | {metrics.requests_per_hour} req/hour
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Success Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.success_rate.toFixed(1)}%</div>
                        <div className="text-xs text-gray-400 mt-1">
                            {metrics.successful_requests} / {metrics.total_requests} requests
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Security Blocks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.pii_blocks}</div>
                        <div className="text-xs text-gray-400 mt-1">
                            PII detections | {metrics.policy_violations} policy violations
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Response Time Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Response Time Trend</CardTitle>
                        <CardDescription>Average response time over the last 24 hours</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {mounted ? (
                            <ResponsiveContainer width="100%" height={300} minWidth={100}>
                                <LineChart data={history} margin={{ left: 20, right: 20, top: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" vertical={false} />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        stroke="currentColor"
                                        className="text-muted-foreground/50 text-[10px]"
                                        tickLine={true}
                                        axisLine={true}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="currentColor"
                                        className="text-muted-foreground/50 text-[10px]"
                                        tickLine={true}
                                        axisLine={true}
                                        tickFormatter={(value) => `${value}ms`}
                                        width={65}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--background)',
                                            borderColor: 'var(--border)',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                        }}
                                        labelClassName="font-bold text-foreground"
                                        labelFormatter={(value) => new Date(value).toLocaleString()}
                                    />
                                    <Line type="monotone" dataKey="avg_response_time_ms" stroke="#8b5cf6" strokeWidth={3} dot={false} animationDuration={1000} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs text-center p-12">Loading Chart...</div>
                        )}
                    </CardContent>
                </Card>

                {/* Request Volume */}
                <Card>
                    <CardHeader>
                        <CardTitle>Request Volume</CardTitle>
                        <CardDescription>Total requests over the last 24 hours</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {mounted ? (
                            <ResponsiveContainer width="100%" height={300} minWidth={100}>
                                <AreaChart data={history} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" vertical={false} />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        stroke="currentColor"
                                        className="text-muted-foreground text-[10px]"
                                        tickLine={true}
                                        axisLine={true}
                                        dy={10}
                                    />
                                    <YAxis stroke="currentColor" className="text-muted-foreground text-[10px]" tickLine={true} axisLine={true} width={40} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--background)',
                                            borderColor: 'var(--border)',
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }}
                                        labelClassName="font-bold text-foreground"
                                        labelFormatter={(value) => new Date(value).toLocaleString()}
                                    />
                                    <Area type="monotone" dataKey="total_requests" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs text-center p-12">Loading Chart...</div>
                        )}
                    </CardContent>
                </Card>

                {/* Security Events */}
                <Card>
                    <CardHeader>
                        <CardTitle>Security Events</CardTitle>
                        <CardDescription>PII blocks and policy violations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {mounted ? (
                            <ResponsiveContainer width="100%" height={300} minWidth={100}>
                                <BarChart data={history} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" vertical={false} />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        stroke="currentColor"
                                        className="text-muted-foreground text-[10px]"
                                        tickLine={true}
                                        axisLine={true}
                                        dy={10}
                                    />
                                    <YAxis stroke="currentColor" className="text-muted-foreground text-[10px]" tickLine={true} axisLine={true} width={40} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--background)',
                                            borderColor: 'var(--border)',
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }}
                                        labelClassName="font-bold text-foreground"
                                        labelFormatter={(value) => new Date(value).toLocaleString()}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                    <Bar dataKey="pii_blocks" fill="#ef4444" name="PII Blocks" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="policy_violations" fill="#f59e0b" name="Policy Violations" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs text-center p-12">Loading Chart...</div>
                        )}
                    </CardContent>
                </Card>

                {/* Success vs Failed */}
                <Card>
                    <CardHeader>
                        <CardTitle>Request Success Rate</CardTitle>
                        <CardDescription>Successful vs failed requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {mounted ? (
                            <ResponsiveContainer width="100%" height={300} minWidth={100}>
                                <AreaChart data={history} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" vertical={false} />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        stroke="currentColor"
                                        className="text-muted-foreground text-[10px]"
                                        tickLine={true}
                                        axisLine={true}
                                        dy={10}
                                    />
                                    <YAxis stroke="currentColor" className="text-muted-foreground text-[10px]" tickLine={true} axisLine={true} width={40} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--background)',
                                            borderColor: 'var(--border)',
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }}
                                        labelClassName="font-bold text-foreground"
                                        labelFormatter={(value) => new Date(value).toLocaleString()}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                    <Area type="monotone" dataKey="successful_requests" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.4} name="Successful" />
                                    <Area type="monotone" dataKey={(data: any) => data.total_requests - data.successful_requests} stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} name="Failed" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs text-center p-12">Loading Chart...</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
