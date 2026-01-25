# PolicyGuard AI 🛡️

<<<<<<< HEAD
**PolicyGuard AI** is a pre-deployment policy governance control plane designed to ensure AI workflows comply with organizational policies before they go live. 

> “PolicyGuard doesn’t decide what to build. It proves what you knew before you built it.”

It serves as a **Fiduciary Shield** for financial institutions, providing a forensic record of pre-deployment policy knowledge and risk discovery.
=======
**The Trust Layer for the Action Era.**

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688) ![Gemini 3](https://img.shields.io/badge/AI-Gemini%203%20Pro-4285F4) ![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)

---

### 🚨 The Problem: "Who Watches the Watchmen?"
In the **Action Era**, AI agents aren't just chatting—they are executing transactions, accessing PII, and making decisions. 
**PolicyGuard AI** is the **Governance Layer** that validates these agents against corporate policies *before* they are deployed. We don't just "check code"; we use **Gemini 3 Pro** to simulate adversarial attacks and audit intent.

![PolicyGuard Dashboard](https://github.com/TharunvenkateshN/PolicyGuard-AI/assets/screenshot-placeholder.png)

---

## 🧪 Try it Now (Judge Friendly)
We built a specialized **Test Mode** for the hackathon judges. No signup, no API keys needed.
1.  Go to the [Live Demo](#).
2.  Click the **🧪 Test Mode** button in the Navbar.
3.  Enjoy the **Self-Driving Tour** that guides you through the Red Team attack simulation.

---
>>>>>>> main

## 🚀 Key Features

### 1. ⚔️ Red Team Mode (Adversarial Simulation)
> *"We hack your agent so hackers can't."*
*   **What it does**: Automatically generates an "Attacker Persona" using Gemini 3.
*   **How it works**: The attacker actively tries to jailbreak your agent or extract PII, while the "Defender" scores the resilience.
*   **Tech**: Uses recursive reasoning loops to simulate real-world threat vectors (OWASP LLM Top 10).

### 2. 📜 Compliance Engine (Multimodal Reasoning)
*   **What it does**: Turns static PDF/TXT policy documents into executable guardrails.
*   **How it works**: Ingests your corporate "AI Usage Policy" and creates a semantic knowledge graph to audit every agent workflow.
*   **Tech**: High-fidelity RAG + Long-context reasoning.

### 3. ⚡ SLA Risk Engine (New!)
*   **What it does**: Predicts if your agent will be *too slow* or *too expensive* for production.
*   **How it works**: Simulates token loads to forecast latency spikes and burn rates.
*   **Value**: "Latency IS a compliance issue."

### 4. 💬 AI CISO Chat
*   **What it does**: A "Chief Information Security Officer" in your pocket.
*   **How it works**: Chat with your architecture. "Is this medical bot HIPAA compliant?"

---

## 🧠 Powered by Gemini 3 Pro
We don't use Gemini as a simple wrapper. We use it for **Cognitive Architecture**:
*   **Reasoning**: We force the model to *think* like a lawyer (Auditor) and a hacker (Red Team) simultaneously.
*   **Agentic Workflow**: The system autonomously navigates through "Audit -> Attack -> Report" cycles without human intervention.
*   **Structured Output**: All analysis returns strict JSON for programmatic enforcement, not just conversational text.

---

## ⚡ Quick Start

### Option A: Docker (Recommended)
The easiest way to spin up the full stack (Frontend + Backend + DB).

```bash
# 1. Clone the repo
git clone https://github.com/TharunvenkateshN/PolicyGuard-AI.git
cd PolicyGuard-AI

# 2. Setup Environment
cp backend/.env.example backend/.env
# (Add your GOOGLE_API_KEY to backend/.env)

# 3. Launch
docker compose up --build
```
Access the app at `http://localhost:3000`.

### Option B: Manual Setup

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## 🛠 Tech Stack
*   **Frontend**: Next.js 14, Tailwind CSS, Shadcn UI, Framer Motion (Vibe Engineering)
*   **Backend**: FastAPI, Python 3.10+, Pydantic (Strict Typing)
*   **AI**: Google Gemini 3 Pro Preview via `google-genai` SDK
*   **Auth**: Firebase (with anonymous Guest Login)

---

## 🏆 Hackathon Tracks
*   **Vibe Engineering**: A polished, premium "Red Team Console" experience.
*   **Action Era**: Enabling the safe deployment of autonomous agents.

Built with ❤️ for the **Google Gemini 3 Hackathon**.