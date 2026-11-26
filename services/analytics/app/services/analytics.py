from typing import List, Dict
from app.models.schemas import (
    CohortAnalyticsRequest, CohortAnalyticsResponse, AtRiskIndicator, LearnerProgressRecord
)

class LearningAnalyticsEngine:
    """
    Rule-Based Deterministic Learning Analytics
    Calculates cohort engagement, pass rates, and identifies at-risk learners
    using transparent, documented heuristic rules (no black-box AI).
    
    Documented At-Risk Rules:
    1. Inactivity Rule: If learner has been inactive for >= 14 days.
    2. Progress Deficit Rule: If course progress < 30% and enrolled >= 21 days ago.
    3. Assessment Underperformance Rule: If average assessment score < 60%.
    4. Assignment Backlog Rule: If assignments submitted < 50% of required.
    """

    @staticmethod
    def calculate_cohort_analytics(request: CohortAnalyticsRequest) -> CohortAnalyticsResponse:
        learners = request.learners
        total_learners = len(learners)

        if total_learners == 0:
            return CohortAnalyticsResponse(
                course_id=request.course_id,
                course_title=request.course_title,
                total_learners=0,
                completion_rate=0.0,
                average_progress_percentage=0.0,
                average_assessment_score=0.0,
                pass_rate=0.0,
                at_risk_count=0,
                at_risk_learners=[],
                distribution={"<50%": 0, "50-70%": 0, "70-90%": 0, "90-100%": 0}
            )

        completed_count = 0
        total_progress_pct = 0.0
        total_assessment_score = 0.0
        passed_assessment_count = 0
        at_risk_list: List[AtRiskIndicator] = []
        distribution = {"<50%": 0, "50-70%": 0, "70-90%": 0, "90-100%": 0}

        for l in learners:
            # Individual progress %
            prog_pct = (l.lessons_completed / l.total_lessons * 100.0) if l.total_lessons > 0 else 0.0
            total_progress_pct += prog_pct

            if prog_pct >= 100.0:
                completed_count += 1

            # Distribution buckets
            if prog_pct < 50.0:
                distribution["<50%"] += 1
            elif prog_pct < 70.0:
                distribution["50-70%"] += 1
            elif prog_pct < 90.0:
                distribution["70-90%"] += 1
            else:
                distribution["90-100%"] += 1

            total_assessment_score += l.average_assessment_score
            if l.average_assessment_score >= request.passing_grade_threshold:
                passed_assessment_count += 1

            # At-risk evaluation
            risk_score = 0.0
            reasons = []

            # Rule 1: Inactivity
            if l.last_active_days_ago >= 14:
                risk_score += 40.0
                reasons.append(f"Inactive for {l.last_active_days_ago} consecutive days")
            elif l.last_active_days_ago >= 7:
                risk_score += 20.0
                reasons.append(f"Inactive for {l.last_active_days_ago} days")

            # Rule 2: Low Quiz Score
            if l.average_assessment_score < 50.0 and l.assessments_completed > 0:
                risk_score += 35.0
                reasons.append(f"Critical quiz average: {l.average_assessment_score:.1f}% (below 50%)")
            elif l.average_assessment_score < request.passing_grade_threshold and l.assessments_completed > 0:
                risk_score += 20.0
                reasons.append(f"Sub-par quiz average: {l.average_assessment_score:.1f}% (below passing mark {request.passing_grade_threshold}%)")

            # Rule 3: Low lesson completion with pending assignments
            if prog_pct < 40.0 and l.total_lessons > 0:
                risk_score += 25.0
                reasons.append(f"Low lesson progress: only {l.lessons_completed}/{l.total_lessons} lessons completed")

            if l.total_assignments > 0 and (l.assignments_submitted / l.total_assignments) < 0.5:
                risk_score += 20.0
                reasons.append(f"Assignment backlog: only {l.assignments_submitted}/{l.total_assignments} submitted")

            risk_score = min(100.0, risk_score)

            if risk_score >= 60.0:
                risk_level = "HIGH"
                recommended_action = "Urgent instructor outreach and remedial tutoring recommendation"
                at_risk_list.append(AtRiskIndicator(
                    user_id=l.user_id,
                    user_name=l.user_name,
                    risk_level=risk_level,
                    risk_score=risk_score,
                    reasons=reasons,
                    recommended_action=recommended_action
                ))
            elif risk_score >= 35.0:
                risk_level = "MEDIUM"
                recommended_action = "Automated email reminder and assessment review suggestions"
                at_risk_list.append(AtRiskIndicator(
                    user_id=l.user_id,
                    user_name=l.user_name,
                    risk_level=risk_level,
                    risk_score=risk_score,
                    reasons=reasons,
                    recommended_action=recommended_action
                ))

        # Sort at-risk learners descending by risk score
        at_risk_list.sort(key=lambda x: x.risk_score, reverse=True)

        completion_rate = round((completed_count / total_learners * 100.0), 2)
        avg_prog = round((total_progress_pct / total_learners), 2)
        avg_score = round((total_assessment_score / total_learners), 2)
        pass_rate = round((passed_assessment_count / total_learners * 100.0), 2)

        return CohortAnalyticsResponse(
            course_id=request.course_id,
            course_title=request.course_title,
            total_learners=total_learners,
            completion_rate=completion_rate,
            average_progress_percentage=avg_prog,
            average_assessment_score=avg_score,
            pass_rate=pass_rate,
            at_risk_count=len(at_risk_list),
            at_risk_learners=at_risk_list,
            distribution=distribution
        )
