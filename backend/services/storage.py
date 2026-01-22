import json
import os
from typing import List
from models.policy import PolicyDocument
from models.settings import PolicySettings
from config import settings
import firebase_admin
from firebase_admin import credentials, firestore

STORAGE_FILE = "policy_store.json"
SETTINGS_FILE = "settings_store.json"
EVALUATIONS_FILE = "evaluations_store.json"

class PolicyStorage:
    def __init__(self):
        self._policies: List[PolicyDocument] = []
        self._evaluations: List[dict] = []
        self.use_firebase = False
        self.db = None
        
        # Init Firebase if creds exist
        if os.path.exists(settings.FIREBASE_CREDENTIALS):
            try:
                if not firebase_admin._apps:
                    cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS)
                    firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                self.use_firebase = True
                print("✅ Connected to Firebase Firestore")
                # Initial Load
                self._load_from_firebase()
                self._load_vectors()
            except Exception as e:
                print(f"❌ Firebase Init Failed: {e}")
                self._load_from_disk()
                self._load_vectors()
        else:
            print("⚠️ Firebase Key skipped (DEBUG MODE). Using local JSON storage.")
            self._load_from_disk()
            self._load_vectors()

    # --- Loading Logic ---
    def _load_from_firebase(self):
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
            self._evaluations.reverse() # Keep internal order chronological if needed, or handle in getters
                
        except Exception as e:
            print(f"Error loading from Firebase: {e}")

    def _load_from_disk(self):
        if os.path.exists(STORAGE_FILE):
            try:
                with open(STORAGE_FILE, 'r') as f:
                    data = json.load(f)
                    self._policies = [PolicyDocument(**item) for item in data]
            except Exception as e:
                print(f"Failed to load policies: {e}")
                self._policies = []
        
        if os.path.exists(EVALUATIONS_FILE):
             try:
                self._evaluations = []
                with open(EVALUATIONS_FILE, 'r') as f:
                    # Try loading as NDJSON first
                    for line in f:
                        if line.strip():
                            try:
                                self._evaluations.append(json.loads(line))
                            except: pass
             except:
                 # Fallback to old list format if NDJSON fails
                 try:
                     with open(EVALUATIONS_FILE, 'r') as f:
                        self._evaluations = json.load(f)
                 except: self._evaluations = []

    def _save_to_disk(self):
        if not self.use_firebase:
            try:
                with open(STORAGE_FILE, 'w') as f:
                    json.dump([p.model_dump() for p in self._policies], f)
            except Exception as e:
                print(f"Failed to save policies: {e}")

    def _save_evaluations_disk(self, new_record: dict = None):
        """
        Optimized: Append new record to file instead of rewriting entire list.
        If new_record is provided, append it.
        If None (e.g., startup sync), we might rewrite, but generally we avoid full dumps.
        """
        if not self.use_firebase and new_record:
            try:
                # Use NDJSON (Newline Delimited JSON) for O(1) appending
                with open(EVALUATIONS_FILE, 'a') as f:
                    f.write(json.dumps(new_record) + "\n")
            except Exception as e:
                print(f"Failed to append evaluation: {e}")
        elif not self.use_firebase and not new_record:
            # Full rewrite (only used if we modify old records, which we rarely do)
            try:
                # Fallback to standard JSON array if needed, but NDJSON is preferred.
                # If we convert to NDJSON, we should verify load structure.
                pass 
            except Exception as e:
                print(f"Failed to save evaluations: {e}")

    # --- CRUD Operations ---
    def add_policy(self, policy: PolicyDocument):
        self._policies.append(policy)
        if self.use_firebase:
            try:
                self.db.collection('policies').document(policy.id).set(policy.model_dump())
            except Exception as e: print(f"Firebase Error: {e}")
        else:
            self._save_to_disk()

    # --- Vector Search Logic ---
    def add_policy_vectors(self, policy_id: str, chunks: List[str], vectors: List[List[float]]):
        """
        Stores vectors in memory and persists them.
        Structure: self._vectors = [ {"policy_id": "pid", "chunk_text": "...", "vector": [...], "chunk_id": "..."} ]
        """
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
        
        # Persist
        if self.use_firebase:
            try:
                # Store chunks in a subcollection 'vectors' under the policy document
                batch = self.db.batch()
                # Delete old vectors first (naive approach: limit 500 in batch)
                # For MVP, we just add new ones. cleanup is harder in NoSQL without knowing IDs.
                # Ideally, we list subcollection and delete.
                
                # Write new
                for entry in new_entries:
                    ref = self.db.collection('policies').document(policy_id).collection('vectors').document(entry['chunk_id'])
                    batch.set(ref, entry)
                batch.commit()
            except Exception as e:
                print(f"Firebase Vector Save Error: {e}")
        else:
            # We need a separate file for vectors to avoid bloating policy_store.json
            self._save_vectors_disk()

    def _save_vectors_disk(self):
        try:
            with open("vector_store.json", 'w') as f:
                json.dump(self._vector_store, f)
        except Exception as e: 
            print(f"Vector Disk Save Error: {e}")

    def _load_vectors(self):
        self._vector_store = []
        if self.use_firebase:
            # Load all vectors? That might be heavy. 
            # Better: We load on demand? No, for cosine similarity we need them in memory (numpy).
            # If 100 policies * 10 chunks = 1000 vectors. Small enough for memory.
            try:
                policies = self.db.collection('policies').stream()
                for p in policies:
                    vecs = p.reference.collection('vectors').stream()
                    for v in vecs:
                        self._vector_store.append(v.to_dict())
            except Exception as e:
                print(f"Vector Load Error: {e}")
        else:
            if os.path.exists("vector_store.json"):
                try:
                    with open("vector_store.json", 'r') as f:
                        self._vector_store = json.load(f)
                except: pass

    def search_relevant_policies(self, query_vec: List[float], top_k: int = 5) -> List[dict]:
        """
        Returns top_k chunks sorted by cosine similarity.
        """
        if not hasattr(self, '_vector_store') or not self._vector_store:
            return []

        from services.gemini import GeminiService # Circular import fix?
        # Actually we need the math helper. Or just use numpy here.
        import numpy as np
        
        scores = []
        q_vec = np.array(query_vec)
        q_norm = np.linalg.norm(q_vec)
        
        if q_norm == 0: return []

        for item in self._vector_store:
            # Check if policy is active
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

    # --- Initializer Update ---
    # Need to call _load_vectors in __init__
    
    # --- CRUD Operations ---
    def add_policy(self, policy: PolicyDocument):
        self._policies.append(policy)
        if self.use_firebase:
            try:
                self.db.collection('policies').document(policy.id).set(policy.model_dump())
            except Exception as e: print(f"Firebase Error: {e}")
        else:
            self._save_to_disk()
        # Vectors are added separately by the caller via add_policy_vectors

    def get_all_policies(self) -> List[PolicyDocument]:
        return self._policies

    def clear(self):
        self._policies = []
        if self.use_firebase:
            # Not implemented for safety
            pass
        else:
            self._save_to_disk()

    def delete_policy(self, policy_id: str) -> bool:
        initial_count = len(self._policies)
        self._policies = [p for p in self._policies if p.id != policy_id]
        
        if len(self._policies) < initial_count:
            if self.use_firebase:
                self.db.collection('policies').document(policy_id).delete()
            else:
                self._save_to_disk()
            return True
        return False

    def update_policy(self, policy_id: str, updates: dict) -> PolicyDocument | None:
        for p in self._policies:
            if p.id == policy_id:
                updated_data = p.model_dump()
                updated_data.update(updates)
                new_policy = PolicyDocument(**updated_data)
                
                index = self._policies.index(p)
                self._policies[index] = new_policy
                
                if self.use_firebase:
                    self.db.collection('policies').document(policy_id).update(updates)
                else:
                    self._save_to_disk()
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
        
        if self.use_firebase:
            try:
                self.db.collection('evaluations').add(record)
            except Exception as e: print(f"Firebase Add Error: {e}")
        else:
            self._save_evaluations_disk(record)

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
        # Sort by timestamp (assuming self._evaluations is mixed if we did lazy loading? 
        # But we load latest 100 on start. For hackathon, assume memory list is truth source for stats)
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

        # Calculate Risk Breakdown
        risk_counts = {"High": 0, "Medium": 0, "Low": 0}
        for entry in self._evaluations:
            report = entry.get('report', {})
            risk = report.get('risk_assessment', {})
            rating = risk.get('overall_rating', 'Low')
            if rating in risk_counts:
                risk_counts[rating] += 1
            else:
                risk_counts["Low"] += 1 # Default fallback

        # Mock Trend Data (Hackathon Visuals) - Generate last 7 days
        import datetime
        import random
        today = datetime.date.today()
        trends = []
        base_score = 100 if len(self._evaluations) == 0 else 85
        
        for i in range(6, -1, -1):
            date_label = (today - datetime.timedelta(days=i)).strftime("%b %d")
            # Create a realistic "wobble"
            daily_score = base_score + random.randint(-5, 5)
            # If today, make it match actual health roughly
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
        # Extract latest business impact signals
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

    # --- Settings Management ---
    def get_settings(self) -> PolicySettings:
        if self.use_firebase:
            try:
                doc = self.db.collection('settings').document('global').get()
                if doc.exists:
                    return PolicySettings(**doc.to_dict())
            except: pass
            return PolicySettings()
        else:
            if os.path.exists(SETTINGS_FILE):
                try:
                    with open(SETTINGS_FILE, 'r') as f:
                        data = json.load(f)
                        return PolicySettings(**data)
                except: pass
            return PolicySettings()

    def save_settings(self, settings: PolicySettings):
        if self.use_firebase:
            self.db.collection('settings').document('global').set(settings.model_dump())
        else:
            try:
                with open(SETTINGS_FILE, 'w') as f:
                    json.dump(settings.model_dump(), f, indent=2)
            except Exception as e:
                print(f"Failed to save settings: {e}")

# Global instance
policy_db = PolicyStorage()
