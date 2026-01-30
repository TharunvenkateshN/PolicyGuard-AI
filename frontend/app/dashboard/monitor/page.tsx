"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Shield } from "lucide-react"

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

export default function MonitorPage() {
    // --- Global Data ---
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const [data, setData] = useState<MonitorData>({ traces_per_min: 0, blocking_rate: 0, active_policies: 0, traces: [] });

    // --- Fetching Logic ---
    useEffect(() => {
        const fetchMonitor = async () => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

                const res = await fetch(`${apiUrl}/api/v1/dashboard/monitor`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (res.ok) setData(await res.json());
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    console.error("Monitor fetch timed out after 120s");
                } else {
                    console.error(err);
                }
            }
        };
        fetchMonitor();
        const interval = setInterval(fetchMonitor, 5000); // Poll every 5s for live feed
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-20">
            <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Shield className="h-10 w-10 text-indigo-500" />
                        Safety Console (Stream 1)
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Real-time audit logs of every prompt intercepted by PolicyGuard.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="animate-pulse border-green-500 text-green-500 bg-green-500/10">
                        <Activity className="w-3 h-3 mr-1" /> Live Audit Stream
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-indigo-100 dark:border-indigo-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Live Traces / Min</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.traces_per_min}</div>
                    </CardContent>
                </Card>
                <Card className="border-indigo-100 dark:border-indigo-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Blocking Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${data.blocking_rate > 0 ? "text-red-500" : "text-green-500"}`}>
                            {data.blocking_rate}%
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-indigo-100 dark:border-indigo-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Active Policies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">{data.active_policies}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-indigo-200 dark:border-indigo-900 shadow-sm">
                <CardHeader className="bg-gray-50/50 dark:bg-zinc-900/50">
                    <CardTitle className="text-base font-semibold">Audit Log Stream</CardTitle>
                    <CardDescription>All authorized and blocked interactions.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-zinc-800 dark:text-gray-400 border-b dark:border-zinc-700">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Timestamp</th>
                                    <th className="px-6 py-4 font-semibold">Trace ID</th>
                                    <th className="px-6 py-4 font-semibold">Agent</th>
                                    <th className="px-6 py-4 font-semibold">Action</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                                {data.traces.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <Activity className="w-6 h-6 text-gray-400 animate-pulse" />
                                                <span>Waiting for live traffic...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    data.traces.map((trace) => (
                                        <tr key={trace.id} className="bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors animate-in fade-in slide-in-from-top-2 duration-300">
                                            <td className="px-6 py-4 font-mono text-gray-500 text-xs">{trace.timestamp}</td>
                                            <td className="px-6 py-4 font-mono text-xs">{trace.id.substring(0, 8)}...</td>
                                            <td className="px-6 py-4 truncate max-w-[150px] font-medium" title={trace.agent}>{trace.agent}</td>
                                            <td className="px-6 py-4">{trace.action}</td>
                                            <td className="px-6 py-4">
                                                {trace.status === 'pass' && <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">PASS</Badge>}
                                                {trace.status === 'block' && <Badge variant="destructive" className="animate-pulse">BLOCKED</Badge>}
                                                {trace.status === 'warn' && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">WARN</Badge>}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 truncate max-w-xs text-xs">{trace.details}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
