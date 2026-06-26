"""
PolicyGuard-AI: GitHub Service
Auto-generates Pull Requests with new Guardrail code changes,
enabling human-in-the-loop review before production deployment.

PR Lifecycle (SEC-14):
  Draft PRs are auto-created by the self-healing engine. Without lifecycle
  management they accumulate indefinitely. Use detect_stale_prs() to find
  draft PRs older than GUARDRAIL_PR_TTL_DAYS (default: 7) and
  close_stale_pr() to comment-and-close them.
"""
import os
import base64
import datetime
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

try:
    from github import Github, GithubException
    HAS_GITHUB = True
except ImportError:
    HAS_GITHUB = False


class GithubService:
    """
    Creates branches, commits guardrail code, and opens Draft PRs
    using the PyGithub library and a personal access token.
    """

    def __init__(self):
        self.token = os.getenv("GITHUB_TOKEN", "")
        self.repo_name = os.getenv("GITHUB_REPO", "")  # e.g. "shalcoder/PolicyGuard-AI"
        self._client = None
        self._repo = None

        if not HAS_GITHUB:
            print("[GitHub] PyGithub not installed. PR generation disabled.")
            return

        if not self.token or not self.repo_name:
            print("[GitHub] GITHUB_TOKEN or GITHUB_REPO not set. PR generation disabled.")
            return

        try:
            self._client = Github(self.token)
            self._repo = self._client.get_repo(self.repo_name)
            print(f"[GitHub] Connected to repo: {self.repo_name}")
        except Exception as e:
            print(f"[GitHub] Connection failed: {e}")

    def is_available(self) -> bool:
        return self._repo is not None

    def create_guardrail_pr(
        self,
        guardrail_code: str,
        violation_summary: str,
        language: str = "python",
        healing_id: str = "auto"
    ) -> Dict:
        """
        Creates a new branch, commits the guardrail code,
        and opens a Draft PR for human review.

        Returns a dict with `pr_url`, `branch`, `status`.
        """
        if not self.is_available():
            return {
                "status": "skipped",
                "reason": "GitHub integration not configured. Set GITHUB_TOKEN and GITHUB_REPO env vars.",
                "pr_url": None
            }

        timestamp = datetime.datetime.utcnow().strftime("%Y%m%d-%H%M%S")
        branch_name = f"policyguard/fix-{timestamp}"
        ext = "py" if language.lower() == "python" else "java" if language.lower() == "java" else "ts"
        file_path = f"backend/guardrails/auto_generated_{timestamp}.{ext}"

        try:
            # Get SHA of main branch
            main_ref = self._repo.get_git_ref("heads/main")
            main_sha = main_ref.object.sha

            # Create new branch
            self._repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=main_sha)

            # Create the file in the new branch
            commit_message = f"🛡️ PolicyGuard Auto-Patch [{healing_id}]\n\nViolations addressed:\n{violation_summary[:500]}"
            self._repo.create_file(
                path=file_path,
                message=commit_message,
                content=guardrail_code,
                branch=branch_name
            )

            # Create Draft PR
            pr = self._repo.create_pull(
                title=f"🛡️ PolicyGuard Guardrail Patch [{healing_id}]",
                body=self._build_pr_body(violation_summary, healing_id, language),
                head=branch_name,
                base="main",
                draft=True
            )

            return {
                "status": "success",
                "pr_url": pr.html_url,
                "pr_number": pr.number,
                "branch": branch_name,
                "file_path": file_path
            }

        except Exception as e:
            return {
                "status": "error",
                "reason": str(e),
                "pr_url": None
            }

    def detect_stale_prs(self, ttl_days: Optional[int] = None) -> List[Dict]:
        """
        Return a list of open draft PRs whose branches start with 'policyguard/'
        and whose age exceeds ttl_days. If ttl_days is None, reads from config.

        Each entry:  {pr_number, title, branch, created_at, age_days, html_url}
        Returns [] when GitHub integration is not configured.
        """
        from config import settings
        if ttl_days is None:
            ttl_days = settings.GUARDRAIL_PR_TTL_DAYS

        if not self.is_available():
            logger.info("[GitHub] detect_stale_prs: integration not configured")
            return []

        threshold = datetime.datetime.utcnow() - datetime.timedelta(days=ttl_days)
        stale: List[Dict] = []
        try:
            for pr in self._repo.get_pulls(state="open", sort="created", direction="asc"):
                if not pr.draft:
                    continue
                if not pr.head.ref.startswith("policyguard/"):
                    continue
                # PyGithub returns naive UTC datetimes
                created = pr.created_at
                if created < threshold:
                    stale.append({
                        "pr_number": pr.number,
                        "title": pr.title,
                        "branch": pr.head.ref,
                        "created_at": created.isoformat() + "Z",
                        "age_days": (datetime.datetime.utcnow() - created).days,
                        "html_url": pr.html_url,
                        "is_draft": pr.draft,
                    })
        except Exception as exc:
            logger.error("[GitHub] detect_stale_prs failed: %s", exc)

        logger.info("[GitHub] detect_stale_prs: %d stale PR(s) found (ttl=%d days)", len(stale), ttl_days)
        return stale

    def close_stale_pr(self, pr_number: int, reason: str = "auto") -> Dict:
        """
        Add a staleness comment to the PR and close it.

        Closing is irreversible via the API but the branch is NOT deleted —
        the maintainer can reopen or cherry-pick manually.

        Returns {status, pr_number, html_url} or {status: "error", reason}.
        """
        if not self.is_available():
            return {"status": "skipped", "reason": "GitHub integration not configured"}

        try:
            pr = self._repo.get_pull(pr_number)
            if pr.state != "open":
                return {
                    "status": "skipped",
                    "reason": f"PR #{pr_number} is already {pr.state}",
                    "pr_number": pr_number,
                    "html_url": pr.html_url,
                }

            from config import settings
            ttl = settings.GUARDRAIL_PR_TTL_DAYS
            age = (datetime.datetime.utcnow() - pr.created_at).days

            comment_body = (
                f"## ⏱️ PolicyGuard: Draft PR Expired\n\n"
                f"This draft PR was auto-closed after **{age} day(s)** "
                f"(TTL: `GUARDRAIL_PR_TTL_DAYS={ttl}`). "
                f"It has not been promoted to a ready PR for review.\n\n"
                f"**Reason**: `{reason}`\n\n"
                f"The branch `{pr.head.ref}` has been preserved. "
                f"If this patch is still relevant, open a new PR from that branch.\n\n"
                f"> Automated by PolicyGuard Self-Healing Engine"
            )
            pr.create_issue_comment(comment_body)
            pr.edit(state="closed")

            logger.info("[GitHub] Closed stale PR #%d (%d days old)", pr_number, age)
            return {
                "status": "closed",
                "pr_number": pr_number,
                "age_days": age,
                "html_url": pr.html_url,
                "branch_preserved": pr.head.ref,
            }

        except Exception as exc:
            logger.error("[GitHub] close_stale_pr #%d failed: %s", pr_number, exc)
            return {"status": "error", "reason": str(exc), "pr_number": pr_number}

    def _build_pr_body(self, violation_summary: str, healing_id: str, language: str) -> str:
        return f"""## 🛡️ PolicyGuard Autonomous Guardrail Patch

**Healing ID**: `{healing_id}`
**Language**: `{language}`
**Generated by**: PolicyGuard AI Self-Healing Engine

---

### Violations Addressed
```
{violation_summary}
```

---

### Review Checklist
- [ ] Code does not introduce new dependencies
- [ ] Logic correctly addresses all listed violations
- [ ] Existing test suite passes
- [ ] No sensitive data is hardcoded

> ⚠️ This is a **Draft PR** auto-generated by PolicyGuard. 
> A human administrator must approve and merge this patch.
> Do NOT merge unless you have reviewed the code thoroughly.
"""


# Global instance
github_service = GithubService()
