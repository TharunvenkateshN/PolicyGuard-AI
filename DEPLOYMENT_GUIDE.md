# PolicyGuard AI Deployment Guide

This guide outlines the steps to deploy PolicyGuard AI using free-tier services: **Vercel** for the frontend, **Hugging Face Spaces** for the backend, and **Firebase** for persistence.

## 1. Database & Auth (Firebase)
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project named `PolicyGuard-AI`.
3. Enable **Authentication** (Email/Password).
4. Enable **Firestore Database** in "Test Mode" or "Production Mode".
5. Go to **Project Settings > Service Accounts** and generate a new private key. Save this as `serviceAccountKey.json`.
6. Go to **Project Settings > General** and add a "Web App". Copy the `firebaseConfig` keys for the frontend.

## 2. Backend (Hugging Face Spaces)
1. Create a new **Space** on [Hugging Face](https://huggingface.co/spaces).
2. Set the **SDK** to `Docker`.
3. Choose the `Blank` template or use your GitHub repository.
4. In the **Settings** tab, add your **Secrets**:
   - `GOOGLE_API_KEY`: Your Gemini API Key.
   - `FIREBASE_CREDENTIALS`: The **complete content** of your `serviceAccountKey.json` (as a single JSON string).
   - `USE_FIREBASE`: `true`
   - `ALLOWED_ORIGINS`: Your Vercel URL (e.g., `https://policyguard-ai.vercel.app`).
5. Upload the `backend/` directory or connect your GitHub. Hugging Face will automatically build and start the Docker container on port `7860`.

## 3. Frontend (Vercel)
1. Connect your Github repository to **Vercel**.
2. Set the **Root Directory** to `frontend`.
3. Add the following **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Your Hugging Face Space URL (e.g., `https://[user]-[space].hf.space`).
   - `NEXT_PUBLIC_USE_FIREBASE`: `true`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: ...
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: ...
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: ...
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: ...
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: ...
   - `NEXT_PUBLIC_FIREBASE_APP_ID`: ...
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: ...
4. Deploy.

## 4. Keeping it Awake (Cron-job.org)
Hugging Face Spaces free tier may sleep after inactivity.
1. Create a free account on [Cron-job.org](https://cron-job.org/).
2. Create a new cron job.
3. **URL**: `https://[user]-[space].hf.space/health`
4. **Execution**: Every 10 minutes.
5. This will ensure your backend is "warm" and ready for judging anytime.

## 5. Deployment Checklist
- [ ] Backend is running on HF Space (check logs for `[OK] Connected to Firebase`).
- [ ] Frontend is live on Vercel.
- [ ] CORS is configured (Vercel URL is in HF `ALLOWED_ORIGINS`).
- [ ] Signup/Login works and saves data to Firestore.
