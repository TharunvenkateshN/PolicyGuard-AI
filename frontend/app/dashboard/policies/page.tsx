"use client"

import { PolicyUploadPanel } from '@/components/PolicyUploadPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, CheckCircle2, Trash2, Eye, EyeOff, Shield } from 'lucide-react'
import { useEffect, useState } from 'react';

type Policy = {
    id: string;
    name: string;
    content: string;
    summary: string;
    is_active?: boolean;
}

export default function PoliciesPage() {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPolicies = async () => {
        try {
            setLoading(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const res = await fetch(`${apiUrl}/api/v1/policies`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                setPolicies(data);
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.error("Policies fetch timed out after 30s - Check backend connection.");
            } else {
                console.error("Failed to fetch policies", error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete policy: ${name}?`)) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/v1/policies/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setPolicies(prev => prev.filter(p => p.id !== id));
            } else {
                alert("Failed to delete policy");
            }
        } catch (error) {
            console.error("Delete failed", error);
            alert("Delete failed due to network error");
        }
    }

    const handleToggle = async (id: string, currentStatus: boolean) => {
        // Optimistic update for instant feedback
        setPolicies(prev => prev.map(p =>
            p.id === id ? { ...p, is_active: !currentStatus } : p
        ));

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        try {
            const url = `${apiUrl}/api/v1/policies/${id}/toggle`;
            const res = await fetch(url, {
                method: 'POST',
            });
            if (!res.ok) {
                // Revert on failure
                setPolicies(prev => prev.map(p =>
                    p.id === id ? { ...p, is_active: currentStatus } : p
                ));
                const txt = await res.text();
                alert(`Toggle failed: ${txt || res.statusText}`);
            }
        } catch (error) {
            console.error("Toggle failed", error);
            // Revert on failure
            setPolicies(prev => prev.map(p =>
                p.id === id ? { ...p, is_active: currentStatus } : p
            ));
            alert(`Network Error calling ${apiUrl}: ${(error as Error).message}`);
        }
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex items-center gap-5 mb-8">
                <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg ring-1 ring-white/20">
                    <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        Policy Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">
                        Configure and manage your organization's AI guardrails.
                    </p>
                </div>
            </div>

            {/* Upload Section - Centered */}
            <div className="flex justify-center w-full mb-12">
                <div id="policy-upload-panel" className="w-full max-w-2xl">
                    <PolicyUploadPanel onPolicyCreated={fetchPolicies} />
                </div>
            </div>

            <div id="active-policies-list" className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                    Active Guardrails
                    <Badge variant="secondary" className="rounded-full px-3 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {policies.filter(p => p.is_active).length}
                    </Badge>
                </h3>

                {loading ? (
                    <div className="flex justify-center p-12 text-slate-500 animate-pulse">Loading policies...</div>
                ) : policies.length === 0 ? (
                    <div className="text-center p-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No policies uploaded yet</p>
                        <p className="text-sm">Upload a document above to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {policies.map((policy) => (
                            <Card key={policy.id} className={`group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-200 dark:border-slate-800/60 ${!policy.is_active ? 'opacity-70 bg-slate-50/50 dark:bg-slate-900/30 grayscale-[0.5]' : 'bg-white dark:bg-slate-900/60'}`}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2.5 rounded-lg ${policy.is_active ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-500/20'}`}>
                                            <FileText className={`h-5 w-5 ${policy.is_active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                                        </div>
                                        <CardTitle className="text-base font-bold truncate max-w-[180px] text-slate-900 dark:text-slate-50" title={policy.name}>
                                            {policy.name}
                                        </CardTitle>
                                    </div>
                                    {policy.is_active && <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />}
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="line-clamp-3 text-sm mt-2 min-h-[60px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {policy.summary || "No summary available."}
                                    </CardDescription>
                                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                                        <div className="flex items-center text-xs font-medium text-slate-400 dark:text-slate-500">
                                            <Calendar className="mr-2 h-3.5 w-3.5" />
                                            <span>{policy.is_active ? 'Active' : 'Inactive'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={`h-9 w-9 p-0 rounded-lg transition-colors border-0 ring-1 ${policy.is_active ? 'text-blue-600 dark:text-blue-400 ring-blue-200 dark:ring-blue-900 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40' : 'text-slate-400 ring-slate-200 dark:ring-slate-700 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                                onClick={() => handleToggle(policy.id, !!policy.is_active)}
                                                title={policy.is_active ? "Deactivate Policy" : "Activate Policy"}
                                            >
                                                {policy.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 w-9 p-0 rounded-lg text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800/50 transition-colors"
                                                onClick={() => handleDelete(policy.id, policy.name)}
                                                title="Delete Policy"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
