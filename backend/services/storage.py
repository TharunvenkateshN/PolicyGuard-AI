import json
import os
from typing import List
from models.policy import PolicyDocument
from models.settings import PolicySettings
from config import settings
import firebase_admin
from firebase_admin import credentials, firestore

class PolicyStorage:
    def __init__(self):
        self._policies: List[PolicyDocument] = []
        self._evaluations: List[dict] = []
        self.db = None
        
        # Init Firebase Mandatory
        try:
            if not firebase_admin._apps:
                # Check if it's a JSON string or a file path
                creds_input = settings.FIREBASE_CREDENTIALS
                if creds_input.strip().startswith('{'):
                    # It's a JSON string
                    creds_dict = json.loads(creds_input)
                    cred = credentials.Certificate(creds_dict)
                elif os.path.exists(creds_input):
                    # It's a file path
                    cred = credentials.Certificate(creds_input)
                else:
                    raise FileNotFoundError(f"Firebase Credentials not found at {creds_input} and not provided as JSON string.")
                
                firebase_admin.initialize_app(cred)
            
            self.db = firestore.client()
            print("✅ Connected to Firebase Firestore (Production Mode)")
            
            # Initial Load
            self._load_from_firebase()
            self._load_vectors()
            
        except Exception as e:
            print(f"❌ CRITICAL FIREBASE ERROR: {e}")
            print("\n" + "!"*60)
            print("  FIREBASE CONNECTION FAILED")
            print("  1. Place 'serviceAccountKey.json' in /backend")
            print("  2. OR set FIREBASE_CREDENTIALS env var with the JSON string")
            print("  3. Run 'python migrate_to_firebase.py' after connecting")
            print("!"*60 + "\n")
            print("Application running in CRIPPLED state.")

    # --- Loading Logic ---
    def _load_from_firebase(self):
        if not self.db: return
        try:
            # Load Policies
            policy_ref = self.db.collection('policies')
            self._policies = []
            count = 0
            for doc in policy_ref.stream():
                try:
                    data = doc.to_dict()
                    if "id" not in data: data["id"] = doc.id
                    self._policies.append(PolicyDocument(**data))
                    count += 1
                except Exception as e:
                    print(f"⚠️ Failed to parse policy {doc.id}: {e}")
            
            print(f"✅ Loaded {count} policies from Firebase")

            # Load Evaluations (Limit 100 for startup performance)
            eval_ref = self.db.collection('evaluations').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(100)
            self._evaluations = []
            for doc in eval_ref.stream():
                try:
                    self._evaluations.append(doc.to_dict())
                except: pass
            self._evaluations.reverse() 
                
        except Exception as e:
            print(f"Error loading from Firebase: {e}")

    # --- CRUD Operations ---
    def add_policy(self, policy: PolicyDocument):
        self._policies.append(policy)
        if self.db:
            try:
                self.db.collection('policies').document(policy.id).set(policy.model_dump())
            except Exception as e: print(f"Firebase Error: {e}")

    # --- Vector Search Logic ---
    def add_policy_vectors(self, policy_id: str, chunks: List[str], vectors: List[List[float]]):
        if not hasattr(self, '_vector_store'):
            self._vector_store = []

        # Remove existing vectors for this policy if update
        self._vector_store = [v for v in self._vector_store if v['policy_id'] != policy_id]

        new_entries = []
        for i, (chunk, vec) in enumerate(zip(chunks, vectors)):
            entry = {
                "policy_id": policy_id,
                "chunk_id": f"{policy_id}_{i}",
                "chunk_text": chunk,
                "vector": vec
            }
            new_entries.append(entry)
            self._vector_store.append(entry)
        
        # Persist to Firebase only
        if self.db:
            try:
                batch = self.db.batch()
                for entry in new_entries:
                    ref = self.db.collection('policies').document(policy_id).collection('vectors').document(entry['chunk_id'])
                    batch.set(ref, entry)
                batch.commit()
            except Exception as e:
                print(f"Firebase Vector Save Error: {e}")

    def _load_vectors(self):
        self._vector_store = []
        if self.db:
            try:
                policies = self.db.collection('policies').stream()
                for p in policies:
                    vecs = p.reference.collection('vectors').stream()
                    for v in vecs:
                        self._vector_store.append(v.to_dict())
                print(f"✅ Loaded {len(self._vector_store)} policy vector chunks from Firebase")
            except Exception as e:
                print(f"Firebase Vector Load Error: {e}")

    def search_relevant_policies(self, query_vec: List[float], top_k: int = 5) -> List[dict]:
        if not hasattr(self, '_vector_store') or not self._vector_store:
            return []

        import numpy as np
        
        scores = []
        q_vec = np.array(query_vec)
        q_norm = np.linalg.norm(q_vec)
        
        if q_norm == 0: return []

        for item in self._vector_store:
            params = next((p for p in self._policies if p.id == item['policy_id']), None)
            if not params or not params.is_active:
                continue

            doc_vec = np.array(item['vector'])
            d_norm = np.linalg.norm(doc_vec)
            
            if d_norm == 0:
                sim = 0
            else:
                sim = np.dot(q_vec, doc_vec) / (q_norm * d_norm)
            
            scores.append((sim, item))
        
        scores.sort(key=lambda x: x[0], reverse=True)
        return [s[1] for s in scores[:top_k]]

    def get_all_policies(self) -> List[PolicyDocument]:
        return self._policies

    def delete_policy(self, policy_id: str) -> bool:
        initial_count = len(self._policies)
        self._policies = [p for p in self._policies if p.id != policy_id]
        
        if len(self._policies) < initial_count:
            if self.db:
                self.db.collection('policies').document(policy_id).delete()
            return True
        return False

<<<<<<< HEAD
    def update_policy_status(self, policy_id: str, status: str) -> bool:
        for p in self._policies:
            if p.id == policy_id:
                p.status = status
                self._save_to_disk()
                return True
        return False
=======
    def update_policy(self, policy_id: str, updates: dict) -> PolicyDocument | None:
        for p in self._policies:
            if p.id == policy_id:
                updated_data = p.model_dump()
                updated_data.update(updates)
                new_policy = PolicyDocument(**updated_data)
                
                index = self._policies.index(p)
                self._policies[index] = new_policy
                
                if self.db:
                    self.db.collection('policies').document(policy_id).update(updates)
                return new_policy
        return None

    # --- Evaluation History ---
    def add_evaluation(self, report: dict):
        import datetime
        record = {
            "timestamp": datetime.datetime.now().isoformat(),
            "report": report
        }
        self._evaluations.append(record)
        
        if self.db:
            try:
                self.db.collection('evaluations').add(record)
            except Exception as e: print(f"Firebase Add Error: {e}")

    def get_dashboard_stats(self):
        active_policies = len([p for p in self._policies if p.is_active])
        total_evaluations = len(self._evaluations)
        
        violations = 0
        for entry in self._evaluations:
            report = entry.get('report', {})
            risk = report.get('risk_assessment', {})
            if risk.get('overall_rating') == 'High':
                violations += 1

        recent = []
        sorted_evals = sorted(self._evaluations, key=lambda x: x['timestamp'])
        
        for entry in reversed(sorted_evals[-5:]):
            report = entry.get('report', {})
            spec = report.get('system_spec', {})
            risk = report.get('risk_assessment', {})
            recent.append({
                "workflow_name": spec.get('primary_purpose', 'Unknown Workflow'),
                "verdict": "PASS" if risk.get('overall_rating') != 'High' else "FAIL", 
                "timestamp": entry.get('timestamp')
            })

        risk_counts = {"High": 0, "Medium": 0, "Low": 0}
        for entry in self._evaluations:
            report = entry.get('report', {})
            risk = report.get('risk_assessment', {})
            rating = risk.get('overall_rating', 'Low')
            if rating in risk_counts:
                risk_counts[rating] += 1
            else:
                risk_counts["Low"] += 1 

        import datetime
        import random
        today = datetime.date.today()
        trends = []
        base_score = 100 if len(self._evaluations) == 0 else 85
        
        for i in range(6, -1, -1):
            date_label = (today - datetime.timedelta(days=i)).strftime("%b %d")
            daily_score = base_score + random.randint(-5, 5)
            if i == 0:
                 daily_score = 100 if violations == 0 else 65
            
            trends.append({"date": date_label, "score": min(100, max(0, daily_score))})

        return {
            "traces_analyzed": total_evaluations, 
            "violations": violations,
            "active_policies": active_policies,
            "system_health": 100 if violations == 0 else 65, 
            "risk_distribution": [
                {"name": "High", "value": risk_counts["High"]},
                {"name": "Medium", "value": risk_counts["Medium"]},
                {"name": "Low", "value": risk_counts["Low"]}
            ],
            "compliance_trend": trends,
            "recent_evaluations": recent,
            "top_business_risks": self._get_business_risks()
        }

    def _get_business_risks(self):
        if not self._evaluations:
             return None
             
        latest_high_risk = next((e for e in reversed(self._evaluations) if e.get('report', {}).get('business_impact')), None)
        
        if latest_high_risk:
            impact = latest_high_risk['report']['business_impact']
            return {
                "financial": impact.get('financial_exposure', 'Low'),
                "financial_cost": impact.get('estimated_cost', '$0'),
                "regulatory": impact.get('regulatory_penalty', 'None'),
                "brand": impact.get('brand_reputation', 'Stable')
            }
        return None

    def get_monitor_data(self):
        import datetime
        now = datetime.datetime.now()
        active_policies = len([p for p in self._policies if p.is_active])
        
        sorted_evals = sorted(self._evaluations, key=lambda x: x['timestamp'])
        
        five_mins_ago = now - datetime.timedelta(minutes=5)
        recent_count = sum(1 for e in self._evaluations if datetime.datetime.fromisoformat(e['timestamp']) > five_mins_ago)
        traces_per_min = round(recent_count / 5, 1) if recent_count > 0 else 0

        total = len(self._evaluations)
        blocked = sum(1 for e in self._evaluations if e['report']['risk_assessment']['overall_rating'] == 'High')
        blocking_rate = round((blocked / total * 100), 1) if total > 0 else 0

        traces = []
        for idx, entry in enumerate(reversed(sorted_evals[-20:])):
            report = entry.get('report', {})
            risk = report.get('risk_assessment', {})
            spec = report.get('system_spec', {})
            verdict = report.get('verdict', {})
            
            rating = risk.get('overall_rating', 'Low')
            status = 'pass'
            if rating == 'High': status = 'block'
            elif rating == 'Medium': status = 'warn'
             
            traces.append({
                "id": f"TR-{1000 + idx}",
                "timestamp": datetime.datetime.fromisoformat(entry['timestamp']).strftime("%H:%M:%S"),
                "agent": report.get('workflow_name') or spec.get('agent_name') or " ".join(spec.get('primary_purpose', 'AI Agent').split()[:2]),
                "action": "Policy Scan",
                "status": status,
                "details": verdict.get('status_label', 'Evaluated')
            })
            
        return {
            "traces_per_min": traces_per_min,
            "blocking_rate": blocking_rate,
            "active_policies": active_policies,
            "traces": traces
        }
>>>>>>> main

    # --- Settings Management ---
    def get_settings(self) -> PolicySettings:
        if self.db:
            try:
                doc = self.db.collection('settings').document('global').get()
                if doc.exists:
                    return PolicySettings(**doc.to_dict())
            except: pass
        return PolicySettings()

    def save_settings(self, settings: PolicySettings):
        if self.db:
            try:
                self.db.collection('settings').document('global').set(settings.model_dump())
            except Exception as e:
                print(f"Failed to save settings to Firebase: {e}")

# Global instance
policy_db = PolicyStorage()
