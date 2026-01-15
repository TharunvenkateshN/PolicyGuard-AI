import json
import os
from typing import List
from models.policy import PolicyDocument

from models.settings import PolicySettings

STORAGE_FILE = "policy_store.json"
SETTINGS_FILE = "settings_store.json"
EVALUATIONS_FILE = "evaluations_store.json"

class PolicyStorage:
    def __init__(self):
        self._policies: List[PolicyDocument] = []
        self._evaluations: List[dict] = []
        self._load_from_disk()
        self._load_evaluations()

    def _load_from_disk(self):
        if os.path.exists(STORAGE_FILE):
            try:
                with open(STORAGE_FILE, 'r') as f:
                    data = json.load(f)
                    self._policies = [PolicyDocument(**item) for item in data]
            except Exception as e:
                print(f"Failed to load policies: {e}")
                self._policies = []

    def _load_evaluations(self):
        if os.path.exists(EVALUATIONS_FILE):
            try:
                with open(EVALUATIONS_FILE, 'r') as f:
                    self._evaluations = json.load(f)
            except Exception as e:
                print(f"Failed to load evaluations: {e}")
                self._evaluations = []

    def _save_to_disk(self):
        try:
            with open(STORAGE_FILE, 'w') as f:
                json.dump([p.model_dump() for p in self._policies], f)
        except Exception as e:
            print(f"Failed to save policies: {e}")

    def _save_evaluations(self):
        try:
            with open(EVALUATIONS_FILE, 'w') as f:
                json.dump(self._evaluations, f)
        except Exception as e:
            print(f"Failed to save evaluations: {e}")

    def add_policy(self, policy: PolicyDocument):
        self._policies.append(policy)
        self._save_to_disk()

    def get_all_policies(self) -> List[PolicyDocument]:
        return self._policies

    def clear(self):
        self._policies = []
        self._save_to_disk()

    def delete_policy(self, policy_id: str) -> bool:
        initial_count = len(self._policies)
        self._policies = [p for p in self._policies if p.id != policy_id]
        if len(self._policies) < initial_count:
            self._save_to_disk()
            return True
        return False

    def update_policy(self, policy_id: str, updates: dict) -> PolicyDocument | None:
        for p in self._policies:
            if p.id == policy_id:
                updated_data = p.model_dump()
                updated_data.update(updates)
                new_policy = PolicyDocument(**updated_data)
                # Replace in list
                index = self._policies.index(p)
                self._policies[index] = new_policy
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
        self._save_evaluations()

    def get_dashboard_stats(self):
        active_policies = len([p for p in self._policies if p.is_active])
        total_evaluations = len(self._evaluations)
        
        # Calculate violations (Assuming risk_assessment.overall_score > 50 means High Risk/Violation in our new inverted logic? 
        # Wait, previous logic was: 100=Risk, 0=Safe. So score > 50 is risky.
        # Actually let's count actual issues in 'evidence' or 'policy_matrix' if possible, or just high risk reports.
        # Simple metric: High Risk Reports
        violations = 0
        for entry in self._evaluations:
            report = entry.get('report', {})
            risk = report.get('risk_assessment', {})
            if risk.get('overall_rating') == 'High':
                violations += 1

        # Recent Activity (Last 5)
        recent = []
        for entry in reversed(self._evaluations[-5:]):
            report = entry.get('report', {})
            spec = report.get('system_spec', {})
            risk = report.get('risk_assessment', {})
            recent.append({
                "workflow_name": spec.get('primary_purpose', 'Unknown Workflow'),
                "verdict": "PASS" if risk.get('overall_rating') != 'High' else "FAIL", # Simplistic pass/fail
                "timestamp": entry.get('timestamp')
            })

        return {
            "traces_analyzed": total_evaluations * 125, # Mock multiplier for "traces" simulation
            "violations": violations,
            "active_policies": active_policies,
            "system_health": 100 if violations == 0 else 98.5, # Mock health
            "recent_evaluations": recent
        }

    # --- Settings Management ---
    def get_settings(self) -> PolicySettings:
        if os.path.exists(SETTINGS_FILE):
            try:
                with open(SETTINGS_FILE, 'r') as f:
                    data = json.load(f)
                    return PolicySettings(**data)
            except Exception as e:
                print(f"Failed to load settings: {e}")
        return PolicySettings() # Default

    def save_settings(self, settings: PolicySettings):
        try:
            with open(SETTINGS_FILE, 'w') as f:
                json.dump(settings.model_dump(), f, indent=2)
        except Exception as e:
            print(f"Failed to save settings: {e}")

# Global instance
policy_db = PolicyStorage()
