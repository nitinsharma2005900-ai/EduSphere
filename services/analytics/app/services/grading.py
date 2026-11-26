from typing import List, Dict, Union, Any
from app.models.schemas import (
    GradingRequest, GradingResponse, QuestionGradingResult,
    RubricAggregationRequest, RubricAggregationResponse, QuestionType
)

class DeterministicGradingEngine:
    """
    Deterministic Assessment Grading Engine
    Ensures 100% reproducible scoring across single-choice, multiple-choice,
    true/false questions and rubric criteria aggregation.
    """

    @staticmethod
    def grade_assessment(request: GradingRequest) -> GradingResponse:
        total_awarded = 0.0
        max_possible = 0.0
        breakdown: List[QuestionGradingResult] = []

        for q in request.questions:
            max_possible += q.points
            user_ans = request.student_answers.get(q.id)
            awarded = 0.0
            is_correct = False

            if user_ans is None:
                # Unanswered
                awarded = 0.0
                is_correct = False
            elif q.type in [QuestionType.SINGLE_CHOICE, QuestionType.TRUE_FALSE]:
                # String comparison
                ans_str = str(user_ans).strip().lower()
                correct_str = str(q.correct_answers[0]).strip().lower() if q.correct_answers else ""
                if ans_str == correct_str:
                    awarded = float(q.points)
                    is_correct = True
                else:
                    awarded = 0.0
                    is_correct = False
            elif q.type == QuestionType.MULTIPLE_CHOICE:
                # Multiple choice scoring:
                # Awards proportional score for correct selections; penalizes incorrect selections.
                # Never drops below 0 points for the question.
                selected = set()
                if isinstance(user_ans, list):
                    selected = {str(x).strip().lower() for x in user_ans}
                elif isinstance(user_ans, str):
                    selected = {user_ans.strip().lower()}

                correct_set = {str(x).strip().lower() for x in q.correct_answers}
                if not correct_set:
                    awarded = 0.0
                    is_correct = False
                else:
                    # True positives
                    true_positives = len(selected.intersection(correct_set))
                    # False positives (incorrect options chosen)
                    false_positives = len(selected.difference(correct_set))
                    # False negatives (missed correct options)
                    false_negatives = len(correct_set.difference(selected))

                    if true_positives == len(correct_set) and false_positives == 0:
                        awarded = float(q.points)
                        is_correct = True
                    else:
                        # Partial credit formula:
                        # (TP / Total Correct) - (FP / Total Incorrect options)
                        total_correct_count = len(correct_set)
                        total_incorrect_options = max(1, len(q.options) - total_correct_count)
                        
                        score_ratio = (true_positives / total_correct_count) - (0.5 * false_positives / total_incorrect_options)
                        awarded = round(max(0.0, score_ratio) * float(q.points), 2)
                        is_correct = (awarded == float(q.points))

            total_awarded += awarded
            breakdown.append(QuestionGradingResult(
                question_id=q.id,
                is_correct=is_correct,
                points_awarded=round(awarded, 2),
                max_points=float(q.points),
                user_answer=user_ans,
                correct_answers=q.correct_answers,
                explanation=q.explanation
            ))

        total_awarded = round(total_awarded, 2)
        percentage = round((total_awarded / max_possible * 100.0), 2) if max_possible > 0 else 0.0
        is_passed = percentage >= request.passing_score

        return GradingResponse(
            assessment_id=request.assessment_id,
            total_score=total_awarded,
            max_score=max_possible,
            percentage=percentage,
            is_passed=is_passed,
            passing_score=request.passing_score,
            breakdown=breakdown
        )

    @staticmethod
    def aggregate_rubric(request: RubricAggregationRequest) -> RubricAggregationResponse:
        raw_total = 0.0
        max_possible = 0.0
        criteria_summary = []

        for c in request.criteria_scores:
            clamped_points = max(0.0, min(c.awarded_points, c.max_points))
            raw_total += clamped_points
            max_possible += c.max_points
            criteria_summary.append({
                "criterion_id": c.criterion_id,
                "title": c.title,
                "awarded": clamped_points,
                "max": c.max_points,
                "percentage": round((clamped_points / c.max_points * 100.0), 2) if c.max_points > 0 else 0.0,
                "comment": c.comment
            })

        percentage = round((raw_total / max_possible * 100.0), 2) if max_possible > 0 else 0.0
        normalized_score = round((percentage / 100.0) * request.max_total_score, 2)

        return RubricAggregationResponse(
            assignment_id=request.assignment_id,
            raw_total_score=round(raw_total, 2),
            max_possible_score=round(max_possible, 2),
            normalized_score=normalized_score,
            percentage=percentage,
            criteria_summary=criteria_summary,
            is_valid=True
        )
