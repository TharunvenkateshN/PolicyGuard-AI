import json
import os
from typing import List
from models.policy import PolicyDocument

from models.settings import PolicySettings

STORAGE_FILE = "policy_store.json"
SETTINGS_FILE = "settings_store.json"

class PolicyStorage:
    def __init__(self):
        self._policies: List[PolicyDocument] = []
        self._load_from_disk()

    def _load_from_disk(self):
        if os.path.exists(STORAGE_FILE):
            try:
                with open(STORAGE_FILE, 'r') as f:
                    data = json.load(f)
                    self._policies = [PolicyDocument(**item) for item in data]
            except Exception as e:
                print(f"Failed to load policies: {e}")
                self._policies = []

    def _save_to_disk(self):
        try:
            with open(STORAGE_FILE, 'w') as f:
                json.dump([p.model_dump() for p in self._policies], f)
        except Exception as e:
            print(f"Failed to save policies: {e}")

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
