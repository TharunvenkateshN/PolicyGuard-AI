"""
Circuit Breaker for upstream LLM API calls in the proxy.

Implements the standard three-state circuit breaker pattern:
  CLOSED   — normal operation, requests pass through
  OPEN     — upstream is failing, requests are rejected immediately
  HALF_OPEN — testing recovery, one probe request is allowed through

Thresholds (configurable via environment variables):
  CIRCUIT_FAILURE_THRESHOLD  : consecutive failures before OPEN (default 3)
  CIRCUIT_RECOVERY_TIMEOUT_S : seconds before OPEN → HALF_OPEN (default 30)
"""

import time
import threading
import logging
import os

logger = logging.getLogger(__name__)

_FAILURE_THRESHOLD = int(os.getenv("CIRCUIT_FAILURE_THRESHOLD", "3"))
_RECOVERY_TIMEOUT = float(os.getenv("CIRCUIT_RECOVERY_TIMEOUT_S", "30"))


class CircuitBreakerOpenError(Exception):
    """Raised when a call is attempted while the circuit is OPEN."""


class CircuitBreaker:
    """
    Thread-safe circuit breaker for a named upstream service.
    """

    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"

    def __init__(
        self,
        name: str,
        failure_threshold: int = _FAILURE_THRESHOLD,
        recovery_timeout: float = _RECOVERY_TIMEOUT,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout

        self._state = self.CLOSED
        self._failure_count = 0
        self._opened_at: float = 0.0
        self._lock = threading.Lock()

    @property
    def state(self) -> str:
        with self._lock:
            return self._get_state()

    def _get_state(self) -> str:
        """Internal state getter — must be called with lock held."""
        if self._state == self.OPEN:
            if time.monotonic() - self._opened_at >= self.recovery_timeout:
                self._state = self.HALF_OPEN
                logger.info("[CIRCUIT-BREAKER] %s → HALF_OPEN (recovery probe)", self.name)
        return self._state

    def allow_request(self) -> bool:
        """Returns True if the request should be allowed through."""
        with self._lock:
            state = self._get_state()
            if state == self.CLOSED:
                return True
            if state == self.HALF_OPEN:
                # Allow exactly one probe through; move to pseudo-OPEN while probing
                self._state = self.OPEN  # Will be reset to CLOSED/OPEN after probe result
                return True
            return False  # OPEN

    def record_success(self):
        """Call after a successful upstream response."""
        with self._lock:
            if self._state != self.CLOSED:
                logger.info("[CIRCUIT-BREAKER] %s → CLOSED (recovery success)", self.name)
            self._state = self.CLOSED
            self._failure_count = 0

    def record_failure(self):
        """Call after an upstream failure (5xx, timeout, connection error)."""
        with self._lock:
            self._failure_count += 1
            logger.warning(
                "[CIRCUIT-BREAKER] %s failure %d/%d",
                self.name, self._failure_count, self.failure_threshold
            )
            if self._failure_count >= self.failure_threshold:
                self._state = self.OPEN
                self._opened_at = time.monotonic()
                logger.error(
                    "[CIRCUIT-BREAKER] %s → OPEN (threshold reached). Will retry in %.0fs",
                    self.name, self.recovery_timeout
                )

    def get_status(self) -> dict:
        """Return current circuit breaker status for health/monitoring endpoints."""
        with self._lock:
            state = self._get_state()
            return {
                "circuit": self.name,
                "state": state,
                "failure_count": self._failure_count,
                "failure_threshold": self.failure_threshold,
                "recovery_timeout_s": self.recovery_timeout,
            }


# Singleton instances for upstream services
upstream_circuit_breaker = CircuitBreaker(name="gemini-upstream")
