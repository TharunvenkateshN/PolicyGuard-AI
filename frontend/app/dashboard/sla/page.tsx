"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Clock, Shield, AlertTriangle, CheckCircle2, XCircle, Brain, Lightbulb, Zap } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
        if (!metrics) return;
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
        const interval = setInterval(fetchMetrics, 5000); // Refresh every 5 seconds

        // Run AI analysis initially after a short delay to ensure metrics are loaded
        const aiTimer = setTimeout(() => {
            runAIAnalysis();
        }, 2000);

        return () => {
            clearInterval(interval);
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
            case 'healthy': return <CheckCircle2 className="w-6 h-6 text-green-500" />;
            case 'at_risk': return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
            case 'violated': return <XCircle className="w-6 h-6 text-red-500" />;
            default: return <Activity className="w-6 h-6 text-gray-500" />;
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
                <h1 className="text-3xl font-bold mb-2">SLA Monitoring</h1>
                <p className="text-gray-400">Real-time performance metrics with Gemini AI predictive analysis</p>
            </div>

            {/* SLA Status Banner */}
            <Card className="border-2" style={{ borderColor: metrics.sla_status === 'healthy' ? '#22c55e' : metrics.sla_status === 'at_risk' ? '#eab308' : '#ef4444' }}>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {getSLAStatusIcon(metrics.sla_status)}
                            <div>
                                <h3 className="text-2xl font-bold">
                                    {metrics.uptime_percentage.toFixed(3)}% Uptime
                                </h3>
                                <p className="text-sm text-gray-400">
                                    SLA Target: 99.9% | Status: <span className={getSLAStatusColor(metrics.sla_status)}>{metrics.sla_status.toUpperCase()}</span>
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-400">Last Updated</div>
                            <div className="text-sm font-mono">{new Date(metrics.timestamp).toLocaleTimeString()}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* AI Analysis Section */}
            {aiAnalysis ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* 1. Risk Score Card */}
                    <Card className="border-2 border-purple-500/20 bg-purple-500/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-purple-400">
                                <Brain className="w-5 h-5" />
                                Gemini Risk Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center mb-6">
                                <div className="text-5xl font-bold text-white mb-2">
                                    {aiAnalysis.risk_score}<span className="text-2xl text-purple-400">%</span>
                                </div>
                                <div className="text-sm text-gray-400">Breach Probability (1h)</div>
                            </div>

                            <div className="flex justify-center mb-6">
                                <Badge variant="outline" className={`px-4 py-1 uppercase ${getRiskColor(aiAnalysis.risk_level)}`}>
                                    {aiAnalysis.risk_level} RISK
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-300">Analysis Summary</h4>
                                <p className="text-sm text-gray-400 italic">
                                    "{aiAnalysis.trend_analysis.summary}"
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Risk Factors & Forecast */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-400" />
                                Risk Factors
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                {aiAnalysis.risk_factors.map((factor, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between mb-1 text-sm">
                                            <span>{factor.factor}</span>
                                            <span className={factor.impact_percentage > 50 ? 'text-red-400' : 'text-yellow-400'}>
                                                {factor.impact_percentage}% Impact
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${factor.impact_percentage > 50 ? 'bg-red-500' : 'bg-yellow-500'}`}
                                                style={{ width: `${factor.impact_percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {aiAnalysis.risk_factors.length === 0 && (
                                    <div className="text-center text-gray-500 py-4">
                                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500/50" />
                                        No active risk factors detected
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-800">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" /> Next Hour Forecast
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-800/50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-400">Predicted Uptime</div>
                                        <div className="text-lg font-bold text-green-400">
                                            {aiAnalysis.forecast.next_hour_uptime.toFixed(3)}%
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/50 p-3 rounded-lg">
                                        <div className="text-xs text-gray-400">Predicted Latency</div>
                                        <div className="text-lg font-bold text-blue-400">
                                            {aiAnalysis.forecast.next_hour_avg_latency.toFixed(0)}ms
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Recommendations */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-yellow-400" />
                                Smart Recommendations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {aiAnalysis.recommendations.map((rec, i) => (
                                <div key={i} className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="secondary" className="text-xs uppercase">
                                            {rec.priority} Priority
                                        </Badge>
                                        <Zap className="w-3 h-3 text-yellow-500" />
                                    </div>
                                    <h5 className="font-medium text-sm mb-1 text-gray-200">{rec.action}</h5>
                                    <p className="text-xs text-gray-400 mb-2">{rec.reason}</p>
                                    <div className="text-xs text-green-400 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        Impact: {rec.expected_impact}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="flex justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Gemini is analyzing SLA patterns...</p>
                    </div>
                </div>
            )}

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Avg Response Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.avg_response_time_ms.toFixed(0)}ms</div>
                        <div className="text-xs text-gray-400 mt-1">
                            P95: {metrics.p95_response_time_ms.toFixed(0)}ms | P99: {metrics.p99_response_time_ms.toFixed(0)}ms
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
                            <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        stroke="#666"
                                    />
                                    <YAxis stroke="#666" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                        labelFormatter={(value) => new Date(value).toLocaleString()}
                                    />
                                    <Line type="monotone" dataKey="avg_response_time_ms" stroke="#8b5cf6" strokeWidth={2} dot={false} />
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
                            <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
                                <AreaChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        stroke="#666"
                                    />
                                    <YAxis stroke="#666" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                        labelFormatter={(value) => new Date(value).toLocaleString()}
                                    />
                                    <Area type="monotone" dataKey="total_requests" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
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
                            <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
                                <BarChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        stroke="#666"
                                    />
                                    <YAxis stroke="#666" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                        labelFormatter={(value) => new Date(value).toLocaleString()}
                                    />
                                    <Legend />
                                    <Bar dataKey="pii_blocks" fill="#ef4444" name="PII Blocks" />
                                    <Bar dataKey="policy_violations" fill="#f59e0b" name="Policy Violations" />
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
                            <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
                                <AreaChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        stroke="#666"
                                    />
                                    <YAxis stroke="#666" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                        labelFormatter={(value) => new Date(value).toLocaleString()}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="successful_requests" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Successful" />
                                    <Area type="monotone" dataKey={(data) => data.total_requests - data.successful_requests} stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Failed" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs text-center p-12">Loading Chart...</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
