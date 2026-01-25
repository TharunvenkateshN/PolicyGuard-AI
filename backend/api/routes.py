from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from models.policy import PolicyDocument, WorkflowDefinition, ComplianceReport
from models.chat import ChatRequest, ChatResponse
from models.settings import PolicySettings
from services.ingest import PolicyIngestor
from services.gemini import GeminiService
from services.storage import policy_db
import json
from pydantic import BaseModel


router = APIRouter()
gemini = GeminiService()

class RemediationRequest(BaseModel):
    original_text: str
    violations: list[str]
    doc_type: str = "PRD" # Default to PRD

class CodeGenRequest(BaseModel):
    policy_summary: str
    language: str = "python"


@router.post("/remediate/doc")
async def remediate_document(request: RemediationRequest):
    async def stream_wrapper():
        try:
            async for chunk in gemini.remediate_spec_stream(request.original_text, request.violations, request.doc_type):
                yield chunk
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Stream Error (Doc): {e}")
            yield f"\n[ERROR] Stream interrupted: {str(e)}"

    return StreamingResponse(stream_wrapper(), media_type="text/plain")

@router.post("/remediate/code")
async def generate_guardrail_code(request: CodeGenRequest):
    async def stream_wrapper():
        try:
            async for chunk in gemini.generate_guardrail_code_stream(request.policy_summary, request.language):
                yield chunk
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Stream Error (Code): {e}")
            yield f"\n// [ERROR] Stream interrupted: {str(e)}"

    return StreamingResponse(stream_wrapper(), media_type="text/plain")

@router.post("/remediate/explain")
async def explain_remediation(request: RemediationRequest):
    try:
        explanation = await gemini.explain_remediation_strategy(request.violations, request.original_text)
        return json.loads(explanation)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Explanation Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


