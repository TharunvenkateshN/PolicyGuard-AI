"""
PolicyGuard-AI: Trusted Execution Environment (TEE) Provider Abstraction

Defines a hardware-agnostic interface for policy enforcement inside a TEE,
enabling verifiable, tamper-proof governance. The abstraction layer allows
future integration of real TEE hardware without changing callers.

Architecture:
    TEEProvider (abstract base class)
        └── InMemoryTEEProvider  (default — software-only, documents the interface)
        └── IntelSGXTEEProvider  (stub — shows what SGX integration would require)
        └── ArmTrustZoneTEEProvider (stub — shows what TrustZone would require)

Why an abstraction layer now?
    Adding TEE support post-hoc requires retrofitting all callers with
    hardware-specific APIs. By establishing the interface today, future
    engineers can drop in a real implementation without changing a single
    call site. The InMemoryTEEProvider documents the exact contract that
    real hardware must satisfy.

Usage:
    from services.tee_provider import tee_provider

    report = await tee_provider.enforce_policy(prompt, agent_id)
    attestation = await tee_provider.get_attestation()
    is_trusted = await tee_provider.verify_attestation(attestation)
"""

import abc
import hashlib
import hmac
import json
import logging
import os
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data contracts
# ---------------------------------------------------------------------------

@dataclass
class PolicyEnforcementResult:
    """Result of a policy enforcement call inside the TEE."""
    allowed: bool
    agent_id: str
    policy_verdict: str          # PASS | BLOCK | REDACT | WARN
    violations: List[str]
    redacted_input: Optional[str]
    execution_environment: str   # e.g. "InMemory", "IntelSGX", "ArmTrustZone"
    attestation_nonce: str       # Unique nonce for this call; include in audit log


@dataclass
class TEEAttestation:
    """
    Attestation report produced by the TEE hardware.
    In a real TEE, this is a signed measurement (a 'quote') of the enclave's
    code and data at the time of evaluation. Verifiers check the quote against
    the hardware manufacturer's certificate authority.
    """
    provider: str               # e.g. "IntelSGX"
    measurement: str            # SHA-256 of enclave code (MRENCLAVE in SGX terms)
    nonce: str                  # Anti-replay nonce provided by the verifier
    timestamp: float
    signature: str              # In a real TEE: ECDSA signature from the QE
    is_simulated: bool = True   # ALWAYS True for InMemoryTEEProvider


# ---------------------------------------------------------------------------
# Abstract base class
# ---------------------------------------------------------------------------

class TEEProvider(abc.ABC):
    """
    Interface that every TEE backend must implement.
    Callers depend only on this contract; concrete implementations are swapped
    by setting the TEE_PROVIDER environment variable.
    """

    @abc.abstractmethod
    async def enforce_policy(
        self,
        input_text: str,
        agent_id: str = "default",
        context: Optional[Dict[str, Any]] = None,
    ) -> PolicyEnforcementResult:
        """
        Evaluate input_text against active policies inside the TEE.
        Returns a PolicyEnforcementResult — callers must NOT proceed if
        result.allowed is False.
        """

    @abc.abstractmethod
    async def get_attestation(self, nonce: Optional[str] = None) -> TEEAttestation:
        """
        Request an attestation report from the TEE.
        In real hardware: triggers a remote attestation round-trip to the
        Intel/ARM attestation service and returns a signed quote.
        Verifiers can check the quote's signature and measurement offline.
        """

    @abc.abstractmethod
    async def verify_attestation(self, attestation: TEEAttestation) -> bool:
        """
        Verify an attestation report's integrity and authenticity.
        In real hardware: checks the quote signature against the
        manufacturer's certificate chain.
        """

    @property
    @abc.abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider identifier."""


# ---------------------------------------------------------------------------
# Default implementation: in-process software simulation
# ---------------------------------------------------------------------------

class InMemoryTEEProvider(TEEProvider):
    """
    Software-only TEE provider. Provides the correct interface and audit trail
    but offers NO actual hardware isolation — suitable for development, testing,
    and documenting the integration contract for future hardware work.

    Security properties:
        - Confidentiality: NONE (runs in normal process memory)
        - Integrity:       NONE (no code measurement)
        - Remote attestation: SIMULATED (HMAC-based, not hardware-backed)

    When evaluating real hardware providers, this class serves as the reference
    implementation: any real provider must satisfy every method signature and
    produce a PolicyEnforcementResult with the same structure.
    """

    _PROVIDER_NAME = "InMemory"

    def __init__(self):
        # Import here to avoid circular imports at module load
        from services.policy_engine import policy_engine as _pe
        self._policy_engine = _pe
        # Simulated attestation key — in a real TEE this is generated inside
        # the enclave and never leaves the hardware boundary.
        self._sim_key = os.urandom(32)
        logger.info("[TEE] InMemoryTEEProvider initialised (SIMULATED — no hardware isolation)")

    @property
    def provider_name(self) -> str:
        return self._PROVIDER_NAME

    async def enforce_policy(
        self,
        input_text: str,
        agent_id: str = "default",
        context: Optional[Dict[str, Any]] = None,
    ) -> PolicyEnforcementResult:
        nonce = hashlib.sha256(
            f"{input_text[:64]}{agent_id}{time.time()}".encode()
        ).hexdigest()[:16]

        # Delegate to the existing deterministic policy engine
        is_blocked, processed_text, metadata = self._policy_engine.evaluate_prompt(
            input_text, agent_id=agent_id
        )

        violations = []
        if metadata.get("drift", {}).get("detected"):
            violations.append("EntropyCollapse")
        if metadata.get("redactions", 0) > 0:
            violations.append(f"PIIDetected({metadata['redactions']} items)")
        if is_blocked and metadata.get("reason"):
            violations.append(metadata["reason"])

        verdict = "BLOCK" if is_blocked else ("REDACT" if metadata.get("redactions", 0) > 0 else "PASS")

        logger.info(
            "[TEE:%s] enforce_policy agent=%s verdict=%s nonce=%s",
            self._PROVIDER_NAME, agent_id, verdict, nonce
        )
        return PolicyEnforcementResult(
            allowed=not is_blocked,
            agent_id=agent_id,
            policy_verdict=verdict,
            violations=violations,
            redacted_input=processed_text if metadata.get("redactions", 0) > 0 else None,
            execution_environment=self._PROVIDER_NAME,
            attestation_nonce=nonce,
        )

    async def get_attestation(self, nonce: Optional[str] = None) -> TEEAttestation:
        if nonce is None:
            nonce = hashlib.sha256(os.urandom(16)).hexdigest()[:16]

        # Simulated measurement — in SGX this would be MRENCLAVE (SHA-256 of enclave pages)
        code_measurement = hashlib.sha256(b"InMemoryTEEProvider_v1").hexdigest()

        # Simulated signature — in SGX this is an ECDSA signature from the Quoting Enclave
        sig_input = json.dumps({
            "measurement": code_measurement,
            "nonce": nonce,
            "timestamp": time.time(),
        }).encode()
        sim_signature = hmac.new(self._sim_key, sig_input, hashlib.sha256).hexdigest()

        return TEEAttestation(
            provider=self._PROVIDER_NAME,
            measurement=code_measurement,
            nonce=nonce,
            timestamp=time.time(),
            signature=sim_signature,
            is_simulated=True,
        )

    async def verify_attestation(self, attestation: TEEAttestation) -> bool:
        if attestation.is_simulated:
            logger.warning("[TEE] verify_attestation called on SIMULATED attestation — trivially accepted")
            return True
        logger.error("[TEE] Cannot verify real hardware attestation on InMemoryTEEProvider")
        return False


# ---------------------------------------------------------------------------
# Hardware TEE stubs (documents integration requirements)
# ---------------------------------------------------------------------------

class IntelSGXTEEProvider(TEEProvider):
    """
    Stub for Intel SGX integration.

    To make this functional, install:
        - Intel SGX SDK + DCAP driver (kernel module)
        - gramine or fortanix EDP for Python enclave support
        - pysgx or a custom CFFI binding to the SGX SDK

    The enclave must be signed with a developer key (sgx_sign tool).
    Remote attestation requires an Intel Attestation Service (IAS) account
    or a DCAP-compliant provisioning infrastructure.
    """

    @property
    def provider_name(self) -> str:
        return "IntelSGX"

    async def enforce_policy(self, input_text, agent_id="default", context=None):
        raise NotImplementedError(
            "Intel SGX TEE support requires the SGX SDK, DCAP driver, and an enclave binary. "
            "See backend/docs/tee_integration.md for hardware setup instructions."
        )

    async def get_attestation(self, nonce=None):
        raise NotImplementedError("Intel SGX attestation requires DCAP infrastructure.")

    async def verify_attestation(self, attestation):
        raise NotImplementedError("Intel SGX quote verification requires Intel PCS or IAS.")


class ArmTrustZoneTEEProvider(TEEProvider):
    """
    Stub for ARM TrustZone integration.

    To make this functional, install:
        - OP-TEE OS (Open Portable TEE)
        - OP-TEE client library (libteec)
        - A signed Trusted Application (TA) compiled for your SoC

    Reference: https://optee.readthedocs.io/
    """

    @property
    def provider_name(self) -> str:
        return "ArmTrustZone"

    async def enforce_policy(self, input_text, agent_id="default", context=None):
        raise NotImplementedError(
            "ARM TrustZone support requires OP-TEE OS and a compiled Trusted Application. "
            "See backend/docs/tee_integration.md for hardware setup instructions."
        )

    async def get_attestation(self, nonce=None):
        raise NotImplementedError("ARM TrustZone attestation requires OP-TEE attestation TA.")

    async def verify_attestation(self, attestation):
        raise NotImplementedError("ARM TrustZone attestation verification requires OP-TEE client library.")


# ---------------------------------------------------------------------------
# Factory — select provider via TEE_PROVIDER env var
# ---------------------------------------------------------------------------

_REGISTRY: Dict[str, type] = {
    "inmemory": InMemoryTEEProvider,
    "sgx": IntelSGXTEEProvider,
    "trustzone": ArmTrustZoneTEEProvider,
}


def _create_provider() -> TEEProvider:
    provider_name = os.getenv("TEE_PROVIDER", "inmemory").lower()
    cls = _REGISTRY.get(provider_name, InMemoryTEEProvider)
    if cls is not InMemoryTEEProvider:
        logger.info("[TEE] Instantiating %s provider", provider_name)
    return cls()


# Global singleton — swap the backend by setting TEE_PROVIDER env var
tee_provider: TEEProvider = _create_provider()
