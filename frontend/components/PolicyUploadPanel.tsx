"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PolicyUploadPanelProps {
    onUpload?: (files: File[]) => void;
}

export function PolicyUploadPanel({ onUpload }: PolicyUploadPanelProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const [uploading, setUploading] = useState(false);
    const [uploadedPolicies, setUploadedPolicies] = useState<{ id: string, name: string, summary?: string, status: string }[]>([]);

    const uploadFile = async (file: File) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:8000/api/v1/policies/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            setUploadedPolicies(prev => [...prev, { id: data.id, name: data.name, summary: data.summary, status: data.status }]);

            // Trigger parent refresh immediately after success
            if (onUpload) onUpload([file]);

        } catch (error: any) {
            console.error(error);
            alert(error.message || "Failed to upload policy");
        } finally {
            setUploading(false);
        }
    };

    const handleActivate = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:8000/api/v1/policies/${id}/status?status=Active`, {
                method: 'PUT'
            });
            if (!res.ok) throw new Error('Activation failed');

            setUploadedPolicies(prev => prev.map(p => p.id === id ? { ...p, status: 'Active' } : p));
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files);
            setFiles((prev) => [...prev, ...droppedFiles]);
            uploadFile(droppedFiles[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...selectedFiles]);
            uploadFile(selectedFiles[0]);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    Policy Discovery & Human Review
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50/10' : 'border-gray-300 dark:border-zinc-700'
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-full">
                            {uploading ? <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" /> : <Upload className="w-8 h-8 text-gray-500" />}
                        </div>
                        <div>
                            <p className="text-lg font-medium">Upload corporate policy documents</p>
                            <p className="text-sm text-gray-500">Gemini will extract guardrails for your review.</p>
                        </div>
                        <div className="relative">
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                id="file-upload"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="file-upload">
                                <Button variant="outline" className="cursor-pointer" asChild disabled={uploading}>
                                    <span>{uploading ? "Analyzing Docs..." : "Select Files"}</span>
                                </Button>
                            </label>
                        </div>
                    </div>
                </div>

                {uploadedPolicies.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            Governance Queue
                            <Badge variant="outline" className="text-[10px]">{uploadedPolicies.length}</Badge>
                        </h4>
                        {uploadedPolicies.map((policy, idx) => (
                            <div key={idx} className="flex flex-col p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-800 transition-all hover:shadow-md">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <div className="font-medium text-sm">{policy.name}</div>
                                                <div className="text-[10px] text-gray-400 mt-1">
                                                    Version: v1.0.0 • Fingerprint: {policy.id}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {policy.status === 'Pending Review' ? (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
                                                    Awaiting Authorization
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Authorized
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {policy.summary && (
                                        <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-950 rounded border border-dashed text-xs text-zinc-600">
                                            <span className="font-bold uppercase text-[9px] text-zinc-400 block mb-1">Semantic Discovery Abstract</span>
                                            {policy.summary}
                                        </div>
                                    )}

                                    {policy.status === 'Pending Review' && (
                                        <div className="mt-4 flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="bg-blue-600 hover:bg-blue-700 h-8"
                                                onClick={() => handleActivate(policy.id)}
                                            >
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Approve Authorization
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-between items-center pt-4 border-t">
                            <p className="text-[10px] text-gray-400 italic font-medium">
                                Discovery and Authorization phase fulfills "Human-in-the-loop" governance requirements.
                            </p>
                            <Button onClick={() => window.location.href = '/dashboard/evaluate'} disabled={!uploadedPolicies.some(p => p.status === 'Active')} className="bg-zinc-900 hover:bg-zinc-800 text-white px-8">
                                Evaluation Center
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
