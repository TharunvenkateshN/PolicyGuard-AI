# PolicyGuard AI 🛡️

**"The Firewall for your AI Deployments"**

PolicyGuard AI is a forensic compliance engine designed to catch risky AI workflows *before* they go live. Built for the **Gemini 3 Global Hackathon**, it leverages the reasoning power of **Gemini 3 Pro** to act as a "Hostile Auditor"—hunting for policy violations with legal precision.

![PolicyGuard Dashboard](https://github.com/TharunvenkateshN/PolicyGuard-AI/assets/screenshot-placeholder.png)

## 🚀 Key Features

*   **🕵️‍♂️ Hostile Auditor Mode**: Uses **Gemini 3 Pro** to rigorously cross-examine your AI workflow against corporate policy documents.
*   **⚖️ Forensic Evidence**: Doesn't just say "Rejected"—it provides a detailed evidence table citing specific policy sections and the exact violating text.
*   **📜 Policy Manager**: Upload, manage, and version-control your organization's PDF/TXT guardrails.
*   **📊 Risk Scorecard**: A visual dashboard showing Compliance Scores, Risk Classifications (Regulatory, Reputational, User Harm), and remediation steps.
*   **🔒 Safe Deletion**: Robust management of policy documents with unique ID tracking.
*   **📈 SLA Guard AI**: A predictive risk engine that forecasts operational breaches (Latency, Burn Rate) using real-time telemetry simulation and **Gemini** insights.

## 🛠 Tech Stack

*   **AI Engine**: Google **Gemini 3 Pro Preview** (`gemini-3-pro-preview`)
*   **Frontend**: Next.js 14, Tailwind CSS, Shadcn UI, Framer Motion
*   **Backend**: FastAPI, Python 3.10+, Pydantic
*   **Orchestration**: Custom Logic (Forensic Prompt Engineering)

## ⚡ Quick Start

### 1. Clone & Setup
```bash
git clone https://github.com/TharunvenkateshN/PolicyGuard-AI.git
cd PolicyGuard-AI
```
```

### 🐳 Run with Docker (Recommended)
The easiest way to get started is using Docker Compose.

1.  **Configure Environment**:
    ```bash
    cd backend
    # Create .env from example (Windows Powershell)
    copy .env.example .env
    # OR Mac/Linux
    cp .env.example .env
    ```
    *Edit `.env` and add your `GOOGLE_API_KEY`.*

2.  **Launch**:
    ```bash
    cd ..
    docker compose up --build
    ```
    Access the app at `http://localhost:3000`.

### 🔧 Manual Setup (Alternative)

#### Backend (The Brain)
```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` with your Gemini 3 key:
```env
# Get key from aistudio.google.com
GOOGLE_API_KEY=your_key_here
GEMINI_MODEL=gemini-3-pro-preview
```

Run it:
```bash
uvicorn main:app --reload
```
```

#### Frontend (The Dashboard)
```bash
cd ../frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to start auditing! 🔎

## 🧪 How to Test

1.  **Upload Policy**: Use the provided `sample_policy_privacy.txt` (The Law).
2.  **Evaluate**: Navigate to "Evaluation".
3.  **Input Workflow**: Copy content from `sample_mortgage_agent_prd.txt` (The Violation) into the workflow description.
4.  **Run Analysis**: Watch Gemini 3 detect the "Human-in-the-Loop" violation!

## 🤝 Contributing

Built with ❤️ for the Google Gemini 3 Hackathon.