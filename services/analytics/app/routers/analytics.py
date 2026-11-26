from fastapi import APIRouter, HTTPException, Depends, Header
from app.models.schemas import CohortAnalyticsRequest, CohortAnalyticsResponse
from app.services.analytics import LearningAnalyticsEngine
from app.config import settings

router = APIRouter(prefix="/analytics", tags=["Learning Analytics"])

def verify_internal_auth(x_internal_key: str = Header(None)):
    if x_internal_key and x_internal_key != settings.INTERNAL_SERVICE_KEY:
        raise HTTPException(status_code=403, detail="Invalid internal service credentials")
    return True

@router.post("/cohort-performance", response_model=CohortAnalyticsResponse)
def get_cohort_performance(request: CohortAnalyticsRequest, auth: bool = Depends(verify_internal_auth)):
    """
    Computes cohort-level learning metrics: completion rate, pass rate, score distribution,
    and flag at-risk learners based on documented heuristics.
    """
    try:
        return LearningAnalyticsEngine.calculate_cohort_analytics(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cohort analytics calculation error: {str(e)}")
