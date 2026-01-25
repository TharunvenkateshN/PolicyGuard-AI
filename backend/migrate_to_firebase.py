import json
import os
import firebase_admin
from firebase_admin import credentials, firestore
from pydantic import BaseModel
from typing import List

# --- Target Config ---
# Ensure this matches your FIREBASE_CREDENTIALS env var or file
FIREBASE_KEY_PATH = "serviceAccountKey.json" 

# --- Source Local Files ---
POLICIES_FILE = "policy_store.json"
SETTINGS_FILE = "settings_store.json"
EVALUATIONS_FILE = "evaluations_store.json"
VECTORS_FILE = "vector_store.json"

def migrate():
    print("🚀 Starting Firebase Migration...")
    
    if not os.path.exists(FIREBASE_KEY_PATH):
        print(f"❌ ERROR: {FIREBASE_KEY_PATH} not found. Migration cannot proceed.")
        return

    # Initialize Firebase
    cred = credentials.Certificate(FIREBASE_KEY_PATH)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Connected to Firebase.")

    # 1. Migrate Policies
    if os.path.exists(POLICIES_FILE):
        print(f"📦 Migrating Policies from {POLICIES_FILE}...")
        with open(POLICIES_FILE, 'r') as f:
            policies = json.load(f)
            for p in policies:
                db.collection('policies').document(p['id']).set(p)
                print(f"  - Migrated Policy: {p.get('name', p['id'])}")
    
    # 2. Migrate Vectors (Subcollections)
    if os.path.exists(VECTORS_FILE):
        print(f"🧬 Migrating Vectors from {VECTORS_FILE}...")
        with open(VECTORS_FILE, 'r') as f:
            vectors = json.load(f)
            batch = db.batch()
            count = 0
            for v in vectors:
                pid = v['policy_id']
                cid = v['chunk_id']
                ref = db.collection('policies').document(pid).collection('vectors').document(cid)
                batch.set(ref, v)
                count += 1
                if count % 400 == 0:
                    batch.commit()
                    batch = db.batch()
            batch.commit()
            print(f"  - Migrated {count} vector chunks.")

    # 3. Migrate Settings
    if os.path.exists(SETTINGS_FILE):
        print(f"⚙️ Migrating Settings from {SETTINGS_FILE}...")
        with open(SETTINGS_FILE, 'r') as f:
            settings_data = json.load(f)
            db.collection('settings').document('global').set(settings_data)
            print("  - Settings migrated.")

    # 4. Migrate Evaluations
    if os.path.exists(EVALUATIONS_FILE):
        print(f"📊 Migrating Evaluations from {EVALUATIONS_FILE}...")
        with open(EVALUATIONS_FILE, 'r') as f:
            evals = json.load(f)
            for ev in evals:
                db.collection('evaluations').add(ev)
            print(f"  - Migrated {len(evals)} evaluation records.")

    print("\n✨ Migration Complete! You can now delete your local .json files.")

if __name__ == "__main__":
    migrate()
