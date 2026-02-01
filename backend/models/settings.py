from pydantic import BaseModel
from typing import Dict

class PolicyDomains(BaseModel):
    privacy: bool = True
    safety: bool = True
    security: bool = True
    fairness: bool = False
    compliance: bool = True

class PolicySources(BaseModel):
    prds: bool = True
    architecture: bool = False
    jira: bool = False
    api: bool = False
    prompts: bool = True

class NotificationTriggers(BaseModel):
    highRisk: bool = True
    conflict: bool = False
    blocked: bool = True

class Notifications(BaseModel):
    email: bool = True
    slack: bool = False
    dashboard: bool = True
    triggers: NotificationTriggers = NotificationTriggers()

class GatekeeperSettings(BaseModel):
    stream1_url: str = "https://generativelanguage.googleapis.com"
    stream1_key: str = ""
    stream2_url: str = "http://localhost:8001" # Fin-Agent default
    stream2_key: str = ""
    routing_mode: str = "Failover" # Failover | Parallel | Semantic

class PolicySettings(BaseModel):
    domains: PolicyDomains = PolicyDomains()
    region: str = "Global"
    sensitivity: str = "Balanced"
    riskThreshold: str = "Warn Medium"
    minConfidence: int = 80
    strictness: int = 50
    guardrailAction: str = "Suggest"
    guardrailExplain: bool = True
    guardrailCite: bool = False
    sources: PolicySources = PolicySources()
    notifications: Notifications = Notifications()
    auditLevel: str = "Detailed"
    auditRetention: str = "90"
    aiReasoning: bool = True
    aiConflict: bool = False
    deploymentMode: str = "Staging"
