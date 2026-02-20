# Lexinel — Deployment Guide

## Prerequisites

- Node.js 18+
- Python 3.11+
- Firebase project (Authentication enabled)
- Google Gemini API key

---

## Frontend Deployment (Vercel)

1. Push the `frontend/` folder to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL` = your backend URL
   - `NEXT_PUBLIC_FIREBASE_*` = Firebase config values
4. Deploy — Vercel auto-detects Next.js

## Backend Deployment (Cloud Run / Railway)

```bash
cd backend
docker build -t lexinel-backend .
docker run -p 8000:8000 -e GOOGLE_API_KEY=your_key lexinel-backend
```

Or deploy directly to Railway / Render using the included `Dockerfile`.

## Docker Compose (Local Full Stack)

```bash
docker-compose up --build
```

- Frontend → http://localhost:3000  
- Backend API → http://localhost:8000  
- API Docs → http://localhost:8000/docs
