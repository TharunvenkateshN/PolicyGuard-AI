import json
import os
import asyncio
import threading
from typing import List
from models.policy import PolicyDocument
from models.settings import PolicySettings, GatekeeperSettings
from config import settings
import firebase_admin
from firebase_admin import credentials, firestore

class PolicyStorage:
    def __init__(self):
        self._policies: List[PolicyDocument] = []
        self._evaluations: List[dict] = []
        self._ground_truth: List[dict] = []
        self.db = None
        self._initialized = False
        self._hitl_queue: List[dict] = []
        self._local_vector_path = "vectors.json"
        self._local_store_path = "policy_store.json"
        self._use_firebase = settings.USE_FIREBASE
        self._lock = threading.Lock()
        self._local_settings = PolicySettings() # Initialize default settings
        
        if self._use_firebase:
            # Init Firebase
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
                print("[OK] Connected to Firebase Firestore (Production Mode)")
                
                # Load data in background thread to avoid blocking requests
                loading_thread = threading.Thread(target=self._load_from_firebase_background, daemon=True)
                loading_thread.start()
                print("[BUSY] Loading Firebase data in background...")
                
            except Exception as e:
                print(f"[ERR] CRITICAL FIREBASE ERROR: {e}")
                print("\n" + "!"*60)
                print("  FIREBASE CONNECTION FAILED")
                print("  1. Place 'serviceAccountKey.json' in /backend")
                print("  2. OR set FIREBASE_CREDENTIALS env var with the JSON string")
                print("  3. Run 'python migrate_to_firebase.py' after connecting")
                print("!"*60 + "\n")
                print("Application running in CRIPPLED state -> FALLING BACK TO LOCAL STORAGE.")
                self._use_firebase = False
                self._load_from_local_json() # Load local data immediately
        else:
            # Use local JSON storage (fast, no network)
            print("[START] Using LOCAL JSON storage (Development Mode - Fast)")
            self._load_from_local_json()
            print(f"[OK] Loaded {len(self._policies)} policies from {self._local_store_path}")

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
                    print(f"[WARN] Failed to parse policy {doc.id}: {e}")
            
            print(f"[OK] Loaded {count} policies from Firebase")
            # Load Evaluations (Limit 100 for startup performance)
            eval_ref = self.db.collection('evaluations').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(100)
            self._evaluations = []
            eval_count = 0
            for doc in eval_ref.stream():
                try:
                    self._evaluations.append(doc.to_dict())
                    eval_count += 1
                except: pass
            self._evaluations.reverse() 
            print(f"[OK] Loaded {eval_count} evaluations from Firebase")
            self._initialized = True
                
        except Exception as e:
            print(f"Error loading from Firebase: {e}")
    
    def _load_from_firebase_background(self):
        """Load Firebase data in background thread without blocking requests"""
        with self._lock:
            self._load_from_firebase()
    
    def _load_from_local_json(self):
        """Load data from local JSON files (fast, no network overhead)"""
        try:
            # 1. Load Policies
            if os.path.exists(self._local_store_path):
                with open(self._local_store_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    policies_data = data.get('policies', [])
                    self._policies = [PolicyDocument(**p) for p in policies_data]
                    print(f"[STORAGE] Loaded {len(self._policies)} policies from {self._local_store_path}")
            
            # 2. Load General Settings
            if os.path.exists("settings_store.json"):
                with open("settings_store.json", "r") as f:
                    self._local_settings = PolicySettings(**json.load(f))
                    print("[STORAGE] Loaded general settings from settings_store.json")
            
            self._initialized = True
        except Exception as e:
            print(f"Error loading from local JSON: {e}")
            self._policies = []
            self._initialized = True
    
    def _save_to_local_json(self):
        """Save policies to local JSON file (only when USE_FIREBASE=false)"""
        if self._use_firebase:
            return  # Don't save locally if using Firebase
        
        try:
            data = {
                'policies': [p.model_dump() for p in self._policies],
                'evaluations': self._evaluations[:100]  # Limit to 100 to prevent bloat
            }
            with open(self._local_store_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving to local JSON: {e}")

    # --- CRUD Operations ---
    def add_policy(self, policy: PolicyDocument):
        self._policies.append(policy)
        if self.db:
            try:
                self.db.collection('policies').document(policy.id).set(policy.model_dump())
            except Exception as e: print(f"Firebase Error: {e}")
        else:
            # Save to local JSON if not using Firebase
            self._save_to_local_json()

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
        
        # Local Persistence Fallback (Background)
        try:
            import threading
            threading.Thread(target=self._save_vectors_to_disk, daemon=True).start()
        except Exception as e:
            print(f"Local Vector Save Error: {e}")

    def _save_vectors_to_disk(self):
        """Save vectors to local JSON for persistence across restarts"""
        try:
            with open(self._local_vector_path, 'w') as f:
                json.dump(self._vector_store, f)
            print(f"[STORAGE] Saved {len(self._vector_store)} vectors to local disk")
        except Exception as e:
            print(f"[STORAGE] ERROR: Failed to save local vectors: {e}")

    def _load_vectors_from_disk(self):
        """Load vectors from local JSON"""
        if os.path.exists(self._local_vector_path):
            try:
                with open(self._local_vector_path, 'r') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        self._vector_store = data
                        print(f"[STORAGE] Loaded {len(self._vector_store)} vectors from local disk")
            except Exception as e:
                print(f"[STORAGE] ERROR: Failed to load local vectors: {e}")

    def _load_vectors(self):
        self._vector_store = []
        if self.db:
            try:
                policies = self.db.collection('policies').stream()
                for p in policies:
                    vecs = p.reference.collection('vectors').stream()
                    for v in vecs:
                        self._vector_store.append(v.to_dict())
                print(f"[STORAGE] SUCCESS: Loaded {len(self._vector_store)} policy vector chunks from Firebase")
            except Exception as e:
                print(f"Firebase Vector Load Error: {e}")
        
        # If Firebase didn't yield results (or isn't connected), try disk
        if not self._vector_store:
            self._load_vectors_from_disk()

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
        # Return immediately - Firebase loading happens in background
        # Policies will be populated as they load
        return self._policies

    def delete_policy(self, policy_id: str) -> bool:
        initial_count = len(self._policies)
        self._policies = [p for p in self._policies if p.id != policy_id]
        
        if len(self._policies) < initial_count:
            if self.db:
                self.db.collection('policies').document(policy_id).delete()
            return True
        return False

    def update_policy_status(self, policy_id: str, status: str) -> bool:
        for p in self._policies:
            if p.id == policy_id:
                p.status = status
                if self.db:
                    self.db.collection('policies').document(policy_id).update({"status": status})
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
                
                if self.db:
                    try:
                        self.db.collection('policies').document(policy_id).update(updates)
                    except Exception as e:
                        print(f"Firebase Update Error: {e}")
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
        # Return whatever is current (background thread handles loading)
        if not self._initialized:
            print("[STORAGE] get_dashboard_stats: Data not yet initialized, returning empty stats")
            
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
        if not hasattr(self, '_initialized') or not self._initialized:
            self._load_from_firebase()
            self._load_vectors()
            
        import datetime
        from services.metrics import metrics_store
        
        now = datetime.datetime.now()
        active_policies = len([p for p in self._policies if p.is_active])
        
        # 1. Get Live Metrics from Proxy
        live_metrics = metrics_store.get_current_metrics()
        live_logs = metrics_store.get_audit_logs()
        
        # 2. Prefer Live Stats if traffic exists
        if live_metrics['total_requests'] > 0:
            traces_per_min = live_metrics['requests_per_minute']
            total = live_metrics['total_requests']
            blocked = live_metrics['pg_blocks']
            blocking_rate = round((blocked / total * 100), 1) if total > 0 else 0
        else:
            # Fallback to evaluation history for demo
            five_mins_ago = now - datetime.timedelta(minutes=5)
            recent_count = sum(1 for e in self._evaluations if datetime.datetime.fromisoformat(e['timestamp']) > five_mins_ago)
            traces_per_min = round(recent_count / 5, 1) if recent_count > 0 else 0
            
            total_evals = len(self._evaluations)
            blocked_evals = sum(1 for e in self._evaluations if e.get('report', {}).get('risk_assessment', {}).get('overall_rating') == 'High')
            blocking_rate = round((blocked_evals / total_evals * 100), 1) if total_evals > 0 else 0

        # 3. Combine Traces (Live Logs + Evaluation History)
        traces = []
        seen_ids = set()
        
        # Add Live Logs (High Priority)
        for idx, log in enumerate(reversed(live_logs)):
            status = log['status'].lower()
            if status == 'info': continue 
            
            trace_id = log.get('id') or f"LIVE-{idx}"
            if trace_id in seen_ids: continue
            
            seen_ids.add(trace_id)
            traces.append({
                "id": trace_id,
                "timestamp": log['timestamp'],
                "agent": "Lexinel-Sentinel",
                "action": log['event'],
                "status": 'pass' if status == 'pass' else ('block' if status == 'block' else 'warn'),
                "details": log.get('details') or "Live traffic intercepted"
            })
            
        # Add Historical Evaluations (Maximum 50 traces total)
        if len(traces) < 50:
            sorted_evals = sorted(self._evaluations, key=lambda x: x['timestamp'], reverse=True)
            for idx, entry in enumerate(sorted_evals[:(50-len(traces))]):
                report = entry.get('report', {})
                risk = report.get('risk_assessment', {})
                spec = report.get('system_spec', {})
                verdict = report.get('verdict', {})
                
                rating = risk.get('overall_rating', 'Low')
                status = 'pass'
                if rating == 'High': status = 'block'
                elif rating == 'Medium': status = 'warn'
                
                # Check if this historical eval ID conflicts (unlikely but safe)
                hist_id = f"TR-{1000 + idx}"
                if hist_id in seen_ids: continue
                seen_ids.add(hist_id)

                traces.append({
                    "id": hist_id,
                    "timestamp": entry['timestamp'],
                    "agent": report.get('workflow_name') or spec.get('agent_name') or "AI Agent",
                    "action": "Safety Evaluation",
                    "status": status,
                    "details": verdict.get('status_label', 'Offline Audit')
                })

        return {
            "traces_per_min": traces_per_min,
            "blocking_rate": blocking_rate,
            "active_policies": active_policies,
            "traces": traces
        }

    # --- Settings Management ---
    def get_settings(self) -> PolicySettings:
        print("[STORAGE] Fetching global policy settings...")
        if self._use_firebase:
            try:
                doc = self.db.collection('settings').document('global').get()
                if doc.exists:
                    return PolicySettings(**doc.to_dict())
            except Exception as e:
                print(f"[STORAGE] Failed to fetch settings: {e}")
        
        # Fallback to local or default
        return self._local_settings

    # --- SLA Persistence ---

    def add_sla_risk(self, risk_data: dict):
        """Save SLA risk assessment to history"""
        if self._use_firebase:
            try:
                # Add timestamp if missing
                if "timestamp" not in risk_data:
                    import datetime
                    risk_data["timestamp"] = datetime.datetime.now().isoformat()
                    
                self.db.collection('sla_risk_history').add(risk_data)
            except Exception as e:
                print(f"[STORAGE] Failed to save SLA risk: {e}")

    def get_sla_risk_history(self, limit: int = 50) -> list:
        """Get recent SLA risk assessments"""
        history = []
        if self._use_firebase:
            try:
                from firebase_admin import firestore
                docs = self.db.collection('sla_risk_history')\
                    .order_by('timestamp', direction=firestore.Query.DESCENDING)\
                    .limit(limit).stream()
                
                for doc in docs:
                    history.append(doc.to_dict())
            except Exception as e:
                print(f"[STORAGE] Failed to fetch SLA history: {e}")
        
        # Return in chronological order (oldest first) for charts
        return list(reversed(history))

    def add_sla_analysis(self, analysis_data: dict):
        """Save comprehensive SLA analysis report"""
        if self._use_firebase:
            try:
                if "timestamp" not in analysis_data:
                    import datetime
                    analysis_data["timestamp"] = datetime.datetime.now().isoformat()
                
                self.db.collection('sla_analysis_reports').add(analysis_data)
            except Exception as e:
                print(f"[STORAGE] Failed to save SLA analysis: {e}")

    def get_latest_sla_analysis(self) -> dict:
        """Get the most recent SLA analysis report"""
        if self._use_firebase:
            try:
                from firebase_admin import firestore
                docs = self.db.collection('sla_analysis_reports')\
                    .order_by('timestamp', direction=firestore.Query.DESCENDING)\
                    .limit(1).stream()
                
                for doc in docs:
                    return doc.to_dict()
            except Exception as e:
                print(f"[STORAGE] Failed to fetch latest SLA analysis: {e}")
        return None

    # --- Gatekeeper Persistence ---

    def get_gatekeeper_settings(self) -> GatekeeperSettings:
        """Fetch Gatekeeper configuration from Firebase"""
        print("[STORAGE] get_gatekeeper_settings requested")
        if self._use_firebase:
            try:
                doc = self.db.collection('settings').document('gatekeeper').get()
                if doc.exists:
                    return GatekeeperSettings(**doc.to_dict())
            except Exception as e:
                print(f"[STORAGE] Failed to fetch Gatekeeper settings: {e}")
        
        # Default fallback
        if os.path.exists("gatekeeper_settings.json"):
            try:
                with open("gatekeeper_settings.json", "r") as f:
                    return GatekeeperSettings(**json.load(f))
            except: pass
        return GatekeeperSettings()

    async def save_gatekeeper_settings(self, settings_data: dict):
        """Save Gatekeeper configuration to Firebase"""
        def _save():
            if self._use_firebase:
                try:
                    self.db.collection('settings').document('gatekeeper').set(settings_data)
                    return True
                except Exception as e:
                    print(f"[STORAGE] Failed to save Gatekeeper settings: {e}")
                    return False
            else:
                # Save locally
                try:
                    with open("gatekeeper_settings.json", "w") as f:
                        json.dump(settings_data, f, indent=2)
                    print("[STORAGE] Saved Gatekeeper settings to local JSON")
                    return True
                except Exception as e:
                    print(f"[STORAGE] Failed to save local Gatekeeper settings: {e}")
                    return False
        
        return await asyncio.to_thread(_save)
    
    # --- Self-Healing History ---
    
    async def add_healing_record(self, healing_record: dict):
        """Save self-healing operation to history"""
        if self._use_firebase:
            try:
                if "timestamp" not in healing_record:
                    import datetime
                    healing_record["timestamp"] = datetime.datetime.now().isoformat()
                
                self.db.collection('healing_history').add(healing_record)
                print(f"[STORAGE] Saved healing record: {healing_record.get('healing_id')}")
            except Exception as e:
                print(f"[STORAGE] Failed to save healing record: {e}")
    
    async def get_healing_history(self, limit: int = 20) -> list:
        """Get recent self-healing operations"""
        history = []
        if self._use_firebase:
            try:
                from firebase_admin import firestore
                docs = self.db.collection('healing_history')\
                    .order_by('timestamp', direction=firestore.Query.DESCENDING)\
                    .limit(limit).stream()
                
                for doc in docs:
                    history.append(doc.to_dict())
            except Exception as e:
                print(f"[STORAGE] Failed to fetch healing history: {e}")
        
        return history
                
    async def save_settings(self, settings: PolicySettings):
        print("[STORAGE] save_settings requested")
        def _save():
            print("[STORAGE] Internal _save (global) starting...")
            if self.db:
                try:
                    self.db.collection('settings').document('global').set(settings.model_dump())
                    return True
                except Exception as e:
                    print(f"Failed to save settings to Firebase: {e}")
                    return False
            else:
                # Local fallback for general settings
                try:
                    with open("settings_store.json", "w") as f:
                        json.dump(settings.model_dump(), f, indent=2)
                    return True
                except Exception as e:
                    print(f"Failed to save local settings: {e}")
                    return False
        
        return await asyncio.to_thread(_save)

# Global instance
policy_db = PolicyStorage()
