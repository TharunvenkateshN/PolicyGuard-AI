# PolicyGuard AI - Testing & Setup Guide

This guide explains how to set up and test PolicyGuard AI in different modes: **Firebase (Cloud)** or **Local Storage (Offline-first)**.

## 🚀 Quick Start (Local Storage Mode)
If you want to test the application without setting up Firebase or a database:

1.  **Backend Config**:
    *   Open `backend/.env`.
    *   Set `USE_FIREBASE=false`.
    *   Ensure `GOOGLE_API_KEY` is set for AI features.
2.  **Frontend Config**:
    *   Open `frontend/.env`.
    *   Set `NEXT_PUBLIC_USE_FIREBASE=false`.
3.  **Frontend Access**:
    *   Go to `http://localhost:3000/login`.
    *   Click **"One-Click Test Access"** (Guest Mode).
    *   The app will bypass Firebase Auth and use a mock session stored in `localStorage`.

---

## ☁️ Firebase Mode (Production-like)
To use actual persistence and multi-user auth:

1.  **Backend Config**:
    *   Set `USE_FIREBASE=true` in `backend/.env`.
    *   Place your `serviceAccountKey.json` in the `backend/` folder.
2.  **Frontend Config**:
    *   Fill in all `NEXT_PUBLIC_FIREBASE_*` variables in `frontend/.env`.
3.  **Migration**:
    *   If you have local data in `policy_store.json` you want to move to the cloud, run:
        ```bash
        cd backend
        python migrate_to_firebase.py
        ```

---

## 🛠️ Environment Variables Reference

### Backend (`/backend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `GOOGLE_API_KEY` | Gemini API Key for policy analysis | Required |
| `USE_FIREBASE` | Toggle Cloud (true) vs Local (false) persistence | `true` |
| `FIREBASE_CREDENTIALS` | Path to service account JSON | `serviceAccountKey.json` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |

### Frontend (`/frontend/.env`)
| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | URL of the backend Control Plane |
| `NEXT_PUBLIC_USE_FIREBASE` | Toggle Frontend Firebase reliance (true/false) |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase project config for Auth & Firestore |

---

## 🧪 Testing Procedures

### 1. Manual Verification
*   **Toggle Test**: Switch `USE_FIREBASE` to `false`, restart backend. Verify logs say `🚀 Using LOCAL JSON storage`.
*   **Guest Access**: Click "One-Click Test Access" on login. Check Browser DevTools -> Application -> Local Storage for `pg_auth_user`.
*   **Policy Analytics**: Upload a policy PDF/Docx. If logic works locally, `policy_store.json` in `/backend` will be updated.

### 2. Automated Tests
Run backend unit tests:
```bash
cd backend
python -m pytest
```
