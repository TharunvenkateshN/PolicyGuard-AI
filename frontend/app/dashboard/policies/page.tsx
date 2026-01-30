"use client"

import { PolicyUploadPanel } from '@/components/PolicyUploadPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, CheckCircle2, Trash2, Eye, EyeOff } from 'lucide-react'
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
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
            <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <FileText className="h-10 w-10 text-blue-600" />
                        Policy Management
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Define and enforce authorized AI behavior across your enterprise.
                    </p>
                </div>
                <PolicyUploadPanel onPolicyCreated={(p) => setPolicies(prev => [...prev, p])} />
            </div>

            <div id="active-policies-list" className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                    Active Guardrails
                    <Badge variant="secondary" className="rounded-full px-3 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {policies.filter(p => p.is_active).length}
                    </Badge>
                </h3>

                {loading ? (
                    <div className="flex justify-center p-12 text-muted-foreground animate-pulse">Loading policies...</div>
                ) : policies.length === 0 ? (
                    <div className="text-center p-20 border-2 border-dashed rounded-2xl text-muted-foreground bg-gray-50/50 dark:bg-zinc-900/50">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No policies uploaded yet</p>
                        <p className="text-sm">Upload a document above to get started.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {policies.map((policy) => (
                            <Card key={policy.id} className={`group hover:shadow-xl transition-all duration-300 border-gray-100 dark:border-zinc-800 ${!policy.is_active ? 'opacity-60 bg-gray-50/50 dark:bg-zinc-900/50' : 'bg-white dark:bg-zinc-900'}`}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg ${policy.is_active ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-zinc-800'}`}>
                                            <FileText className={`h-5 w-5 ${policy.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                                        </div>
                                        <CardTitle className="text-base font-bold truncate max-w-[180px] text-foreground" title={policy.name}>
                                            {policy.name}
                                        </CardTitle>
                                    </div>
                                    {policy.is_active && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="line-clamp-3 text-sm mt-2 min-h-[60px] text-muted-foreground leading-relaxed">
                                        {policy.summary || "No summary available."}
                                    </CardDescription>
                                    <div className="mt-6 pt-4 border-t border-gray-50 dark:border-zinc-800 flex items-center justify-between">
                                        <div className="flex items-center text-xs font-medium text-muted-foreground">
                                            <Calendar className="mr-2 h-3.5 w-3.5" />
                                            <span>{policy.is_active ? 'Active' : 'Inactive'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={`h-9 w-9 p-0 rounded-lg transition-colors ${policy.is_active ? 'text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100' : 'text-gray-400 border-gray-100'}`}
                                                onClick={() => handleToggle(policy.id, !!policy.is_active)}
                                                title={policy.is_active ? "Deactivate Policy" : "Activate Policy"}
                                            >
                                                {policy.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 w-9 p-0 rounded-lg text-red-500 border-red-50 border-red-100 bg-red-50/50 hover:bg-red-100 hover:text-red-700"
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
