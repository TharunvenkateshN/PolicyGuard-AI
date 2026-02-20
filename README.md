# Lexinel

> **AI-native AML Compliance Engine** — powered by Google Gemini, IBM AML Dataset, and a full-stack Next.js dashboard.

Lexinel ingests financial regulation PDFs (BSA, FATF, EU AMLD6) and uses **Neural-to-Logic (N2L)** synthesis to automatically generate enforcement rules that are applied in real-time against transaction records.

---

## What Lexinel Does

| Layer | Description |
|---|---|
| **N2L Synthesis** | Gemini 2.5 Pro converts regulation PDF text into typed enforcement rules (e.g. `amount > 10000 AND type == WIRE`) |
| **Database Sentinel** | Runs synthesized rules against IBM AML dataset records in real-time |
| **Violation Nexus** | Flags, scores, and queues violations for human review or auto-SAR drafting |
| **Adversarial Hub** | Red-teams rules against synthetic attack vectors (smurfing, layering, ghost accounts) |
| **AML Risk Analytics** | Trend charts, jurisdiction heatmaps, and violation breakdowns |
| **Compliance Chat** | Ask your policy documents questions — Gemini-powered RAG |

---

## Tech Stack

- **Frontend**: Next.js 16 · Tailwind CSS · Framer Motion · Recharts
- **Backend**: FastAPI · Python 3.11
- **AI**: Google Gemini 2.5 Pro (N2L synthesis + RAG chat)
- **Data**: IBM AML Transactions Dataset
- **Auth**: Firebase Authentication

---

## Local Setup

```bash
# Frontend
cd frontend
npm install
npm run dev        # → http://localhost:3000

# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `frontend/.env.local`.

---

## AML Rules Active

| Rule ID | Clause | Description |
|---|---|---|
| AML-R01 | BSA §1010.310 | CTR threshold — flag transactions >$10,000 |
| AML-R02 | FATF Rec. 10 | Structuring / smurfing — ≥3 sub-threshold txns/24h |
| AML-R03 | FinCEN 103.29 | Cross-border wire >$5,000 |
| AML-R04 | GDPR Art. 5 | PII encryption enforcement |
| AML-R05 | AMLD6 Art. 3(4) | Tax-haven jurisdiction routing |

---

## License

MIT — Built for the hackathon demo. Not for production financial use.
