"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Network, Copy, Check, Terminal, Shield } from "lucide-react";

export default function ConnectPage() {
    const [copied, setCopied] = useState(false);
    const router = useRouter(); // Correct placement

    // Auth Check
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem("pg_auth_token");
            if (!token) {
                router.push('/login');
            }
        }
    }, [router]);

    // In a real app, this would be dynamic
    const PROXY_URL = "http://localhost:8000/proxy/v1";

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const pythonCode = `
import openai

# 1. Point to PolicyGuard Proxy
client = openai.OpenAI(
    base_url="${PROXY_URL}",
    api_key="sk-..." # Your Real OpenAI Key
)

# 2. Use normally
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "How do I bypass the firewall?"}]
)

# 3. PolicyGuard intercepts, audits, and blocks threats!
print(response.choices[0].message.content)
    `.trim();

    const curlCode = `
curl ${PROXY_URL}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello world!"}]
  }'
    `.trim();

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white pt-32 pb-20 px-6 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
                        Connect Your Agent
                    </h1>
                    <p className="text-xl text-gray-400">
                        Route your LLM traffic through PolicyGuard for instant governance.
                    </p>
                </div>

                <div className="grid gap-8">
                    {/* Connection Details */}
                    <Card className="bg-white/5 border-white/10 hover:border-[#7C3AED]/30 transition-all">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Network className="w-5 h-5 text-[#7C3AED]" />
                                Proxy Configuration
                            </CardTitle>
                            <CardDescription>Use these settings in your AI SDK or http client.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Base URL</label>
                                <div className="flex gap-2">
                                    <code className="flex-1 p-3 rounded-lg bg-black/50 border border-white/10 font-mono text-sm">
                                        {PROXY_URL}
                                    </code>
                                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(PROXY_URL)}>
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200">
                                <strong>Note:</strong> We do not store your API keys. They are passed through securely to the provider (OpenAI/Anthropic) via the Authorization header.
                            </div>
                        </CardContent>
                    </Card>

                    {/* Code Examples */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-green-500" />
                                Integration Code
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="python" className="w-full">
                                <TabsList className="bg-black/50 border border-white/10 mb-4">
                                    <TabsTrigger value="python">Python SDK</TabsTrigger>
                                    <TabsTrigger value="curl">cURL</TabsTrigger>
                                    <TabsTrigger value="js">Node.js</TabsTrigger>
                                </TabsList>

                                <TabsContent value="python">
                                    <div className="rounded-lg overflow-hidden border border-white/10">
                                        <SyntaxHighlighter language="python" style={vscDarkPlus} customStyle={{ margin: 0 }}>
                                            {pythonCode}
                                        </SyntaxHighlighter>
                                    </div>
                                </TabsContent>

                                <TabsContent value="curl">
                                    <div className="rounded-lg overflow-hidden border border-white/10">
                                        <SyntaxHighlighter language="bash" style={vscDarkPlus} customStyle={{ margin: 0 }}>
                                            {curlCode}
                                        </SyntaxHighlighter>
                                    </div>
                                </TabsContent>

                                <TabsContent value="js">
                                    <div className="p-12 text-center text-gray-500 font-mono">
                                        // JavaScript/TypeScript example coming soon
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
