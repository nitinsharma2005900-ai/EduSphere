import pytest
from app.models.schemas import CohortAnalyticsRequest, LearnerProgressRecord
from app.services.analytics import LearningAnalyticsEngine

def test_cohort_analytics_and_at_risk_detection():
    learners = [
        # Normal progressing student
        LearnerProgressRecord(
            user_id="u1",
            user_name="Alice Smith",
            lessons_completed=10,
            total_lessons=10,
            assessments_completed=2,
            total_assessments=2,
            average_assessment_score=95.0,
            assignments_submitted=2,
            total_assignments=2,
            last_active_days_ago=1
        ),
        # Moderate student
        LearnerProgressRecord(
            user_id="u2",
            user_name="Bob Jones",
            lessons_completed=8,
            total_lessons=10,
            assessments_completed=2,
            total_assessments=2,
            average_assessment_score=78.0,
            assignments_submitted=2,
            total_assignments=2,
            last_active_days_ago=3
        ),
        # At-risk student (Inactive, failing quiz, low progress)
        LearnerProgressRecord(
            user_id="u3",
            user_name="Charlie AtRisk",
            lessons_completed=2,
            total_lessons=10,
            assessments_completed=1,
            total_assessments=2,
            average_assessment_score=42.0,
            assignments_submitted=0,
            total_assignments=2,
            last_active_days_ago=16
        )
    ]

    req = CohortAnalyticsRequest(
        course_id="c1",
        course_title="Full Stack Web Development",
        total_enrolled=3,
        learners=learners,
        passing_grade_threshold=70.0
    )

    res = LearningAnalyticsEngine.calculate_cohort_analytics(req)

    assert res.total_learners == 3
    # Alice is at 100%, Bob is at 80%, Charlie is at 20% -> 1 completed
    assert res.completion_rate == round(1 / 3 * 100, 2)
    assert res.at_risk_count == 1
    assert res.at_risk_learners[0].user_id == "u3"
    assert res.at_risk_learners[0].risk_level == "HIGH"
    assert len(res.at_risk_learners[0].reasons) >= 3
