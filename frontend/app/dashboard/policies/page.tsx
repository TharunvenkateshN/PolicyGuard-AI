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
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/v1/policies`);
            if (res.ok) {
                const data = await res.json();
                setPolicies(data);
            }
        } catch (error) {
            console.error("Failed to fetch policies");
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
                fetchPolicies(); // Refresh
            } else {
                alert("Failed to delete policy");
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    }

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/v1/policies/${id}/toggle`, {
                method: 'PATCH',
            });
            if (res.ok) {
                fetchPolicies();
            }
        } catch (error) {
            console.error("Toggle failed", error);
        }
    }

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Policy Management</h1>
                <p className="text-gray-500 dark:text-gray-400">Upload and manage organization guardrails.</p>
            </div>

            <div id="policy-upload-panel">
                <PolicyUploadPanel onUpload={(files) => {
                    // Wait small delay for processing then refresh
                    setTimeout(fetchPolicies, 1000);
                }} />
            </div>

            <div id="active-policies-list" className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    Active Policies
                    <Badge variant="secondary" className="rounded-full">{policies.filter(p => p.is_active).length}</Badge>
                </h3>

                {loading ? (
                    <div className="flex justify-center p-8 text-muted-foreground">Loading policies...</div>
                ) : policies.length === 0 ? (
                    <div className="text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
                        No policies uploaded yet. Upload a document above to get started.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {policies.map((policy) => (
                            <Card key={policy.id} className={`hover:shadow-md transition-shadow ${!policy.is_active ? 'opacity-60 bg-gray-50 dark:bg-zinc-900' : ''}`}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center space-x-2">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        <CardTitle className="text-sm font-medium truncate max-w-[180px]" title={policy.name}>
                                            {policy.name}
                                        </CardTitle>
                                    </div>
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="line-clamp-3 text-xs mt-2 min-h-[40px]">
                                        {policy.summary || "No summary available."}
                                    </CardDescription>
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <Calendar className="mr-1 h-3 w-3" />
                                            <span>{policy.is_active ? 'Active' : 'Inactive'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-8 w-8 p-0 ${policy.is_active ? 'text-blue-600' : 'text-gray-400'}`}
                                                onClick={() => handleToggle(policy.id, !!policy.is_active)}
                                                title={policy.is_active ? "Deactivate Policy" : "Activate Policy"}
                                            >
                                                {policy.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
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
