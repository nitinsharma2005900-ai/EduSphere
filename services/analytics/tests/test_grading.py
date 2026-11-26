import pytest
from app.models.schemas import (
    GradingRequest, QuestionModel, QuestionType,
    RubricAggregationRequest, RubricCriterionScore
)
from app.services.grading import DeterministicGradingEngine

def test_single_choice_and_true_false_grading():
    q1 = QuestionModel(
        id="q1",
        prompt="What is Python?",
        type=QuestionType.SINGLE_CHOICE,
        points=2.0,
        correct_answers=["opt_b"],
        options=[{"id": "opt_a", "text": "A snake"}, {"id": "opt_b", "text": "A programming language"}]
    )
    q2 = QuestionModel(
        id="q2",
        prompt="Is TypeScript statically typed?",
        type=QuestionType.TRUE_FALSE,
        points=1.0,
        correct_answers=["true"],
        options=[{"id": "true", "text": "True"}, {"id": "false", "text": "False"}]
    )

    # Perfect submission
    req = GradingRequest(
        assessment_id="test_assess_1",
        passing_score=70.0,
        questions=[q1, q2],
        student_answers={"q1": "opt_b", "q2": "true"}
    )
    res = DeterministicGradingEngine.grade_assessment(req)
    assert res.total_score == 3.0
    assert res.percentage == 100.0
    assert res.is_passed is True
    assert len(res.breakdown) == 2
    assert res.breakdown[0].is_correct is True

    # Failed submission
    req_fail = GradingRequest(
        assessment_id="test_assess_1",
        passing_score=70.0,
        questions=[q1, q2],
        student_answers={"q1": "opt_a", "q2": "false"}
    )
    res_fail = DeterministicGradingEngine.grade_assessment(req_fail)
    assert res_fail.total_score == 0.0
    assert res_fail.percentage == 0.0
    assert res_fail.is_passed is False

def test_multiple_choice_partial_credit():
    q_mc = QuestionModel(
        id="q_mc",
        prompt="Select all relational databases:",
        type=QuestionType.MULTIPLE_CHOICE,
        points=4.0,
        correct_answers=["pg", "mysql"],
        options=[
            {"id": "pg", "text": "PostgreSQL"},
            {"id": "mysql", "text": "MySQL"},
            {"id": "redis", "text": "Redis"},
            {"id": "mongo", "text": "MongoDB"}
        ]
    )

    # 1. Full credit
    req_full = GradingRequest(
        assessment_id="assess_mc",
        passing_score=75.0,
        questions=[q_mc],
        student_answers={"q_mc": ["pg", "mysql"]}
    )
    res_full = DeterministicGradingEngine.grade_assessment(req_full)
    assert res_full.total_score == 4.0
    assert res_full.is_passed is True

    # 2. Partial credit (selected only 1 of 2 correct answers)
    req_partial = GradingRequest(
        assessment_id="assess_mc",
        passing_score=75.0,
        questions=[q_mc],
        student_answers={"q_mc": ["pg"]}
    )
    res_partial = DeterministicGradingEngine.grade_assessment(req_partial)
    assert res_partial.total_score == 2.0
    assert res_partial.percentage == 50.0

    # 3. Penalty credit (selected 1 correct, 1 incorrect)
    req_penalty = GradingRequest(
        assessment_id="assess_mc",
        passing_score=75.0,
        questions=[q_mc],
        student_answers={"q_mc": ["pg", "redis"]}
    )
    res_penalty = DeterministicGradingEngine.grade_assessment(req_penalty)
    # TP = 1 (50%), FP = 1 (0.5 * 1 / 2 = 25% penalty) -> 25% of 4.0 = 1.0 point
    assert res_penalty.total_score == 1.0

def test_rubric_aggregation():
    req = RubricAggregationRequest(
        assignment_id="asg_1",
        max_total_score=100.0,
        criteria_scores=[
            RubricCriterionScore(criterion_id="c1", title="Code Quality", awarded_points=18.0, max_points=20.0),
            RubricCriterionScore(criterion_id="c2", title="Architecture", awarded_points=28.0, max_points=30.0),
            RubricCriterionScore(criterion_id="c3", title="Testing", awarded_points=45.0, max_points=50.0)
        ]
    )
    res = DeterministicGradingEngine.aggregate_rubric(req)
    # Total raw: 18 + 28 + 45 = 91 / 100 = 91%
    assert res.raw_total_score == 91.0
    assert res.normalized_score == 91.0
    assert res.percentage == 91.0
    assert len(res.criteria_summary) == 3
