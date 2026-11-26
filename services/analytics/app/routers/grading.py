from fastapi import APIRouter, HTTPException, Depends, Header
from app.models.schemas import (
    GradingRequest, GradingResponse,
    RubricAggregationRequest, RubricAggregationResponse
)
from app.services.grading import DeterministicGradingEngine
from app.config import settings

router = APIRouter(prefix="/grading", tags=["Grading Engine"])

def verify_internal_auth(x_internal_key: str = Header(None)):
    # Internal service token verification
    if x_internal_key and x_internal_key != settings.INTERNAL_SERVICE_KEY:
        raise HTTPException(status_code=403, detail="Invalid internal service credentials")
    return True

@router.post("/evaluate-assessment", response_model=GradingResponse)
def evaluate_assessment(request: GradingRequest, auth: bool = Depends(verify_internal_auth)):
    """
    Deterministically scores an assessment attempt including MCQs, multi-answer questions,
    and true/false items with partial credit logic.
    """
    try:
        return DeterministicGradingEngine.grade_assessment(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Grading calculation error: {str(e)}")

@router.post("/aggregate-rubric", response_model=RubricAggregationResponse)
def aggregate_rubric(request: RubricAggregationRequest, auth: bool = Depends(verify_internal_auth)):
    """
    Aggregates multi-criterion rubric scores for assignments.
    """
    try:
        return DeterministicGradingEngine.aggregate_rubric(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Rubric aggregation error: {str(e)}")
