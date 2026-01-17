"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle2 } from 'lucide-react';

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
    const [uploadedPolicies, setUploadedPolicies] = useState<{ name: string, summary?: string }[]>([]);

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
            setUploadedPolicies(prev => [...prev, { name: data.name, summary: data.summary }]);

            // Trigger parent refresh immediately after success
            if (onUpload) onUpload([file]);

        } catch (error: any) {
            console.error(error);
            alert(error.message || "Failed to upload policy");
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files);
            setFiles((prev) => [...prev, ...droppedFiles]);
            // Auto upload first file for MVP
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
                    <Upload className="w-5 h-5" />
                    Policy Upload & Versioning
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
                            <p className="text-lg font-medium">Drag & drop policy documents here</p>
                            <p className="text-sm text-gray-500">Supports PDF, DOCX, TXT</p>
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
                                    <span>{uploading ? "Analyzing..." : "Browse Files"}</span>
                                </Button>
                            </label>
                        </div>
                    </div>
                </div>

                {uploadedPolicies.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Policies (Analyzed)</h4>
                        {uploadedPolicies.map((file, idx) => (
                            <div key={idx} className="flex flex-col p-3 bg-gray-50 dark:bg-zinc-900 rounded-md border border-gray-100 dark:border-zinc-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-blue-500" />
                                        <p className="text-sm font-medium">{file.name}</p>
                                    </div>
                                    <div className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Indexed
                                    </div>
                                </div>
                                {file.summary && (
                                    <p className="mt-2 text-xs text-gray-500 pl-8 italic">
                                        "{file.summary}"
                                    </p>
                                )}
                            </div>
                        ))}

                        <div className="flex justify-end pt-4">
                            <Button onClick={() => window.location.href = '/dashboard/evaluate'} className="bg-blue-600 hover:bg-blue-700">
                                Proceed to Evaluation
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
