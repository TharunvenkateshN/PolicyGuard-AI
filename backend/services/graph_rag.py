"""
PolicyGuard-AI: Graph RAG Service
Builds a knowledge graph from policy documents using networkx.
The graph is persisted to disk after every ingestion using atomic rename
(write-to-temp → rename) so a crash mid-write never corrupts the store.
On startup the graph is reloaded from disk, surviving pod restarts.
"""

import re
import os
import json
import tempfile
import logging
import networkx as nx
from networkx.readwrite import json_graph
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Path relative to the backend working directory (where uvicorn/gunicorn runs)
_GRAPH_STORE_PATH = os.getenv("GRAPH_STORE_PATH", "graph_store.json")

# MITRE ATLAS-aligned PII / conflict keywords
CONFLICT_SIGNALS = [
    ("store", "no.*store|must not.*store|prohibit.*store"),
    ("share", "no.*shar|must not.*shar|prohibit.*shar"),
    ("collect", "no.*collect|must not.*collect|prohibit.*collect"),
    ("retain", "no.*retain|no.*keep|must not.*retain"),
    ("encrypt", "no.*encrypt"),
    ("log", "no.*log|prohibit.*log"),
    ("expose", "no.*expos|must not.*expos"),
]

PII_KEYWORDS = [
    "email", "phone", "ip address", "ssn", "social security",
    "passport", "name", "address", "date of birth", "credit card"
]


def _extract_clauses(policy_text: str) -> List[str]:
    """Split a policy document into individual clauses."""
    # Split on sentence boundaries, bullets, numbered lists
    clauses = re.split(r'(?<=[.!?])\s+|\n[-•*]\s*|\n\d+\.\s+', policy_text)
    return [c.strip() for c in clauses if len(c.strip()) > 20]


def _clause_permits(clause: str, keyword: str) -> bool:
    """Returns True if clause uses keyword permissively (e.g. 'store user emails')."""
    c = clause.lower()
    if keyword not in c:
        return False
    for pos_indicator in ["must", "shall", "should", "required", "need to", "need", "allow"]:
        if pos_indicator in c:
            return True
    return keyword in c and not _clause_denies(clause, keyword)


def _clause_denies(clause: str, keyword: str) -> bool:
    """Returns True if clause explicitly denies/prohibits keyword action."""
    c = clause.lower()
    negations = ["no ", "not ", "never ", "must not", "shall not", "prohibit", "forbidden", "disallow"]
    if keyword not in c:
        return False
    for neg in negations:
        if neg in c:
            return True
    return False


class PolicyGraphService:
    """
    Builds a persistent knowledge graph of policy clauses and detects cross-document
    conflicts. Uses NetworkX for in-memory traversal; persists to disk after every
    ingestion so the graph survives pod restarts. No external database required.
    """

    def __init__(self):
        self.graph = nx.DiGraph()
        self._policy_index: List[Dict] = []
        self._load_from_disk()  # Restore graph on startup

    def build_graph(self, policy_texts: List[str], policy_names: List[str] = None) -> Dict:
        """
        Parse policy texts into a knowledge graph.
        Each clause is a node; edges represent relationships or conflicts.
        """
        self.graph.clear()
        self._policy_index = []

        if policy_names is None:
            policy_names = [f"Policy_{i+1}" for i in range(len(policy_texts))]

        for doc_idx, (text, name) in enumerate(zip(policy_texts, policy_names)):
            clauses = _extract_clauses(text)
            for clause_idx, clause in enumerate(clauses):
                node_id = f"{name}_C{clause_idx}"

                # Tag PII-relevant clauses
                pii_tags = [kw for kw in PII_KEYWORDS if kw in clause.lower()]

                self.graph.add_node(node_id, **{
                    "doc": name,
                    "doc_idx": doc_idx,
                    "clause": clause,
                    "pii_tags": pii_tags,
                })
                self._policy_index.append({
                    "node_id": node_id,
                    "doc": name,
                    "clause": clause,
                    "pii_tags": pii_tags,
                })

        # Build conflict edges between nodes
        self._detect_conflicts()

        stats = {
            "total_nodes": self.graph.number_of_nodes(),
            "total_edges": self.graph.number_of_edges(),
            "policies": policy_names,
        }
        self._save_to_disk()
        return stats

    def _detect_conflicts(self):
        """Find conflicting clause pairs and add red 'CONFLICT' edges."""
        nodes = list(self._policy_index)
        for i, node_a in enumerate(nodes):
            for j, node_b in enumerate(nodes):
                if i >= j:
                    continue
                if node_a["doc"] == node_b["doc"]:
                    continue  # Skip same-document conflicts for now

                for keyword, deny_pattern in CONFLICT_SIGNALS:
                    a_permits = _clause_permits(node_a["clause"], keyword)
                    b_denies = bool(re.search(deny_pattern, node_b["clause"].lower()))

                    if a_permits and b_denies:
                        self.graph.add_edge(
                            node_a["node_id"],
                            node_b["node_id"],
                            relation="CONFLICT",
                            keyword=keyword,
                            description=f"'{node_a['doc']}' permits '{keyword}' but '{node_b['doc']}' prohibits it."
                        )

    def find_conflicts(self) -> List[Dict]:
        """Return all detected cross-document conflicts as a list."""
        conflicts = []
        for u, v, data in self.graph.edges(data=True):
            if data.get("relation") == "CONFLICT":
                conflicts.append({
                    "source_doc": self.graph.nodes[u]["doc"],
                    "source_clause": self.graph.nodes[u]["clause"],
                    "target_doc": self.graph.nodes[v]["doc"],
                    "target_clause": self.graph.nodes[v]["clause"],
                    "conflict_keyword": data["keyword"],
                    "description": data["description"],
                    "severity": "HIGH" if any(t in self.graph.nodes[u]["pii_tags"] for t in PII_KEYWORDS) else "MEDIUM"
                })
        return conflicts

    def get_graph_json(self) -> Dict:
        """Return the full graph as a JSON-serialisable dict for frontend visualisation."""
        nodes = [
            {
                "id": n,
                "doc": self.graph.nodes[n]["doc"],
                "clause_preview": self.graph.nodes[n]["clause"][:120],
                "has_conflict": any(
                    self.graph[n][nb].get("relation") == "CONFLICT"
                    for nb in self.graph.successors(n)
                )
            }
            for n in self.graph.nodes
        ]
        edges = [
            {
                "source": u,
                "target": v,
                "relation": d.get("relation", "RELATES"),
                "keyword": d.get("keyword", ""),
                "description": d.get("description", "")
            }
            for u, v, d in self.graph.edges(data=True)
        ]
        return {"nodes": nodes, "edges": edges}

    def _save_to_disk(self):
        """
        Atomically persist the graph and policy index to disk.
        Writes to a temp file first, then renames — a crash mid-write
        leaves the previous snapshot intact rather than producing corruption.
        """
        payload = {
            "graph": json_graph.node_link_data(self.graph),
            "policy_index": self._policy_index,
        }
        store_dir = os.path.dirname(os.path.abspath(_GRAPH_STORE_PATH)) or "."
        try:
            fd, tmp_path = tempfile.mkstemp(dir=store_dir, suffix=".tmp")
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False)
            os.replace(tmp_path, _GRAPH_STORE_PATH)  # atomic rename
            logger.info(
                "[GraphRAG] Graph persisted: %d nodes, %d edges → %s",
                self.graph.number_of_nodes(), self.graph.number_of_edges(), _GRAPH_STORE_PATH
            )
        except Exception as exc:
            logger.error("[GraphRAG] Failed to persist graph: %s", exc)
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass

    def _load_from_disk(self):
        """Restore graph and policy index from disk on startup."""
        if not os.path.exists(_GRAPH_STORE_PATH):
            logger.info("[GraphRAG] No persisted graph found at %s — starting empty.", _GRAPH_STORE_PATH)
            return
        try:
            with open(_GRAPH_STORE_PATH, "r", encoding="utf-8") as f:
                payload = json.load(f)
            self.graph = json_graph.node_link_graph(payload["graph"], directed=True)
            self._policy_index = payload.get("policy_index", [])
            logger.info(
                "[GraphRAG] Restored graph from disk: %d nodes, %d edges",
                self.graph.number_of_nodes(), self.graph.number_of_edges()
            )
        except Exception as exc:
            logger.error("[GraphRAG] Failed to load persisted graph: %s — starting empty.", exc)
            self.graph = nx.DiGraph()
            self._policy_index = []

    def query(self, question: str) -> str:
        """Find clauses most relevant to a question based on keyword overlap."""
        question_words = set(question.lower().split())
        scored = []
        for item in self._policy_index:
            clause_words = set(item["clause"].lower().split())
            overlap = len(question_words & clause_words)
            if overlap > 0:
                scored.append((overlap, item))
        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:5]
        if not top:
            return "No relevant clauses found."
        context = "\n\n".join(
            f"[{item['doc']}]: {item['clause']}" for _, item in top
        )
        return context


# Global singleton
graph_service = PolicyGraphService()
