"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Copy, Check, Code2 } from 'lucide-react'
import { toast } from 'sonner'

interface IntegrationCodeModalProps {
    open: boolean
    onClose: () => void
}

const CODE_SNIPPETS = {
    python: {
        name: "Python (FastAPI)",
        code: `from fastapi import FastAPI, Body
from datetime import datetime

app = FastAPI()

# Global system prompt variable
SYSTEM_PROMPT = "You are a helpful assistant..."

@app.post("/system/update-prompt")
async def update_system_prompt(request: dict = Body(...)):
    """
    Self-Healing Endpoint: Receives patched prompts from Lexinel
    """
    global SYSTEM_PROMPT
    new_prompt = request.get("system_prompt")
    
    if not new_prompt:
        return {"status": "error", "message": "Missing system_prompt"}
    
    # Update in-memory prompt
    SYSTEM_PROMPT = new_prompt
    
    # Optional: Persist to database
    # await db.save_config("system_prompt", new_prompt)
    
    print(f"[Self-Healing] Prompt updated at {datetime.now()}")
    
    return {
        "status": "success",
        "message": "Prompt updated successfully",
        "timestamp": datetime.now().isoformat()
    }

# Use SYSTEM_PROMPT in your agent logic
@app.post("/chat")
async def chat(message: str):
    # Use the SYSTEM_PROMPT variable here
    response = your_llm_call(SYSTEM_PROMPT, message)
    return {"response": response}`
    },
    nodejs: {
        name: "Node.js (Express)",
        code: `const express = require('express');
const app = express();

app.use(express.json());

// Global system prompt variable
let SYSTEM_PROMPT = "You are a helpful assistant...";

app.post('/system/update-prompt', (req, res) => {
  /**
   * Self-Healing Endpoint: Receives patched prompts from Lexinel
   */
  const { system_prompt } = req.body;
  
  if (!system_prompt) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing system_prompt'
    });
  }
  
  // Update in-memory prompt
  SYSTEM_PROMPT = system_prompt;
  
  // Optional: Persist to database
  // await db.saveConfig('system_prompt', system_prompt);
  
  console.log(\`[Self-Healing] Prompt updated at \${new Date()}\`);
  
  res.json({
    status: 'success',
    message: 'Prompt updated successfully',
    timestamp: new Date().toISOString()
  });
});

// Use SYSTEM_PROMPT in your agent logic
app.post('/chat', async (req, res) => {
  const { message } = req.body;
  // Use the SYSTEM_PROMPT variable here
  const response = await yourLLMCall(SYSTEM_PROMPT, message);
  res.json({ response });
});

app.listen(8001, () => {
  console.log('Agent running on port 8001');
});`
    },
    java: {
        name: "Java (Spring Boot)",
        code: `package com.example.agent;

import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
public class SystemController {
    
    // Global system prompt variable
    private String systemPrompt = "You are a helpful assistant...";
    
    @PostMapping("/system/update-prompt")
    public Map<String, Object> updatePrompt(@RequestBody Map<String, String> request) {
        /**
         * Self-Healing Endpoint: Receives patched prompts from Lexinel
         */
        String newPrompt = request.get("system_prompt");
        
        if (newPrompt == null || newPrompt.isEmpty()) {
            return Map.of(
                "status", "error",
                "message", "Missing system_prompt"
            );
        }
        
        // Update in-memory prompt
        systemPrompt = newPrompt;
        
        // Optional: Persist to database
        // configRepository.save("system_prompt", newPrompt);
        
        System.out.println("[Self-Healing] Prompt updated at " + LocalDateTime.now());
        
        return Map.of(
            "status", "success",
            "message", "Prompt updated successfully",
            "timestamp", LocalDateTime.now().toString()
        );
    }
    
    // Use systemPrompt in your agent logic
    @PostMapping("/chat")
    public Map<String, String> chat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        // Use the systemPrompt variable here
        String response = yourLLMCall(systemPrompt, message);
        return Map.of("response", response);
    }
}`
    },
    go: {
        name: "Go (Gin)",
        code: `package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
    "time"
)

// Global system prompt variable
var SystemPrompt = "You are a helpful assistant..."

func main() {
    r := gin.Default()
    
    r.POST("/system/update-prompt", UpdatePrompt)
    r.POST("/chat", Chat)
    
    r.Run(":8001")
}

// UpdatePrompt handles self-healing prompt updates
func UpdatePrompt(c *gin.Context) {
    var req map[string]string
    if err := c.BindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "status":  "error",
            "message": "Invalid request",
        })
        return
    }
    
    newPrompt, exists := req["system_prompt"]
    if !exists || newPrompt == "" {
        c.JSON(http.StatusBadRequest, gin.H{
            "status":  "error",
            "message": "Missing system_prompt",
        })
        return
    }
    
    // Update in-memory prompt
    SystemPrompt = newPrompt
    
    // Optional: Persist to database
    // db.SaveConfig("system_prompt", newPrompt)
    
    println("[Self-Healing] Prompt updated at", time.Now())
    
    c.JSON(http.StatusOK, gin.H{
        "status":    "success",
        "message":   "Prompt updated successfully",
        "timestamp": time.Now().Format(time.RFC3339),
    })
}

// Chat uses the SystemPrompt variable
func Chat(c *gin.Context) {
    var req map[string]string
    c.BindJSON(&req)
    
    message := req["message"]
    // Use the SystemPrompt variable here
    response := yourLLMCall(SystemPrompt, message)
    
    c.JSON(http.StatusOK, gin.H{"response": response})
}`
    }
}

export function IntegrationCodeModal({ open, onClose }: IntegrationCodeModalProps) {
    const [selectedLang, setSelectedLang] = useState<keyof typeof CODE_SNIPPETS>('python')
    const [copied, setCopied] = useState(false)

    const copyToClipboard = () => {
        navigator.clipboard.writeText(CODE_SNIPPETS[selectedLang].code)
        setCopied(true)
        toast.success('Code copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Code2 className="w-5 h-5 text-purple-600" />
                        Self-Healing Integration Code
                    </DialogTitle>
                    <DialogDescription>
                        Add this endpoint to your Stream 2 agent to enable autonomous self-healing.
                        Lexinel will call this endpoint to deploy patched system prompts when vulnerabilities are detected.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Tabs value={selectedLang} onValueChange={(val) => setSelectedLang(val as keyof typeof CODE_SNIPPETS)}>
                        <TabsList className="grid grid-cols-4 w-full">
                            <TabsTrigger value="python">Python</TabsTrigger>
                            <TabsTrigger value="nodejs">Node.js</TabsTrigger>
                            <TabsTrigger value="java">Java</TabsTrigger>
                            <TabsTrigger value="go">Go</TabsTrigger>
                        </TabsList>

                        {Object.entries(CODE_SNIPPETS).map(([lang, { name, code }]) => (
                            <TabsContent key={lang} value={lang} className="mt-4">
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {name}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={copyToClipboard}
                                            className="gap-2"
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="w-4 h-4 text-green-600" />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    Copy Code
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                                        <code>{code}</code>
                                    </pre>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>

                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                            📋 Implementation Steps:
                        </h4>
                        <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
                            <li>Copy the code snippet for your language</li>
                            <li>Add the <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/system/update-prompt</code> endpoint to your agent</li>
                            <li>Ensure your agent uses the <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">SYSTEM_PROMPT</code> variable in all LLM calls</li>
                            <li>Test the endpoint using the "Test Connection" button</li>
                            <li>Save your changes and enable self-healing</li>
                        </ol>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                            ⚠️ Important Notes:
                        </h4>
                        <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1 list-disc list-inside">
                            <li>The endpoint must be accessible at <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">http://your-agent-url/system/update-prompt</code></li>
                            <li>Consider persisting the prompt to a database for production use</li>
                            <li>Add authentication if your agent is publicly accessible</li>
                            <li>Log all prompt updates for audit purposes</li>
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
