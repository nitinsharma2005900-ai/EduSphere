from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Union
from enum import Enum
from datetime import datetime

class QuestionType(str, Enum):
    SINGLE_CHOICE = "SINGLE_CHOICE"
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    TRUE_FALSE = "TRUE_FALSE"

class QuestionModel(BaseModel):
    id: str
    prompt: str
    type: QuestionType
    points: float = 1.0
    correct_answers: List[str]
    options: List[Dict[str, str]]
    explanation: Optional[str] = None

class GradingRequest(BaseModel):
    assessment_id: str
    passing_score: float = 70.0
    questions: List[QuestionModel]
    student_answers: Dict[str, Union[str, List[str]]]

class QuestionGradingResult(BaseModel):
    question_id: str
    is_correct: bool
    points_awarded: float
    max_points: float
    user_answer: Union[str, List[str], None]
    correct_answers: List[str]
    explanation: Optional[str] = None

class GradingResponse(BaseModel):
    assessment_id: str
    total_score: float
    max_score: float
    percentage: float
    is_passed: bool
    passing_score: float
    breakdown: List[QuestionGradingResult]
    graded_at: datetime = Field(default_factory=datetime.utcnow)

class RubricCriterionScore(BaseModel):
    criterion_id: str
    title: str
    awarded_points: float
    max_points: float
    comment: Optional[str] = None

class RubricAggregationRequest(BaseModel):
    assignment_id: str
    max_total_score: float = 100.0
    criteria_scores: List[RubricCriterionScore]

class RubricAggregationResponse(BaseModel):
    assignment_id: str
    raw_total_score: float
    max_possible_score: float
    normalized_score: float
    percentage: float
    criteria_summary: List[Dict[str, Any]]
    is_valid: bool

class LearnerProgressRecord(BaseModel):
    user_id: str
    user_name: str
    lessons_completed: int
    total_lessons: int
    assessments_completed: int
    total_assessments: int
    average_assessment_score: float
    assignments_submitted: int
    total_assignments: int
    last_active_days_ago: int

class CohortAnalyticsRequest(BaseModel):
    course_id: str
    course_title: str
    total_enrolled: int
    learners: List[LearnerProgressRecord]
    passing_grade_threshold: float = 70.0

class AtRiskIndicator(BaseModel):
    user_id: str
    user_name: str
    risk_level: str  # HIGH, MEDIUM, LOW
    risk_score: float  # 0 to 100
    reasons: List[str]
    recommended_action: str

class CohortAnalyticsResponse(BaseModel):
    course_id: str
    course_title: str
    total_learners: int
    completion_rate: float
    average_progress_percentage: float
    average_assessment_score: float
    pass_rate: float
    at_risk_count: int
    at_risk_learners: List[AtRiskIndicator]
    distribution: Dict[str, int] # "<50%", "50-70%", "70-90%", "90-100%"

class CertificateDataPrepRequest(BaseModel):
    certificate_id: str
    certificate_number: str
    learner_id: str
    learner_name: str
    course_id: str
    course_title: str
    completion_date: str
    issuer_name: str = "EduSphere Academic Board"

class CertificateDataPrepResponse(BaseModel):
    certificate_number: str
    verification_url: str
    qr_payload: str
    integrity_hash: str
    metadata: Dict[str, Any]
