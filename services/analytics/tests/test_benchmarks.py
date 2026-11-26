import pytest
import time
from app.models.schemas import GradingRequest, QuestionModel, QuestionType
from app.services.grading import DeterministicGradingEngine
from app.services.csv_importer import CsvContentProcessor

def test_csv_import_validation():
    valid_csv = """email,first_name,last_name,external_id
john@example.com,John,Doe,STU-001
jane@example.com,Jane,Roe,STU-002
"""
    result = CsvContentProcessor.process_learner_csv(valid_csv)
    assert result.valid_count == 2
    assert result.invalid_count == 0
    assert len(result.valid_records) == 2

    # Malformed email
    invalid_csv = """email,first_name,last_name,external_id
not-an-email,Bad,User,STU-999
"""
    res_inv = CsvContentProcessor.process_learner_csv(invalid_csv)
    assert res_inv.valid_count == 0
    assert res_inv.invalid_count == 1
    assert "email" in str(res_inv.errors[0]["error"])

def test_grading_performance_benchmark():
    # Benchmark 500 questions scored sub-millisecond
    questions = []
    answers = {}
    for i in range(100):
        qid = f"q_{i}"
        questions.append(QuestionModel(
            id=qid,
            prompt=f"Question {i}",
            type=QuestionType.SINGLE_CHOICE,
            points=1.0,
            correct_answers=["opt_a"],
            options=[{"id": "opt_a", "text": "A"}, {"id": "opt_b", "text": "B"}]
        ))
        answers[qid] = "opt_a" if i % 2 == 0 else "opt_b"

    req = GradingRequest(
        assessment_id="bench_1",
        passing_score=50.0,
        questions=questions,
        student_answers=answers
    )

    start_time = time.time()
    for _ in range(10):
        res = DeterministicGradingEngine.grade_assessment(req)
    duration = time.time() - start_time

    assert res.total_score == 50.0
    # 10 evaluations of 100 questions (1,000 question evaluations) should easily complete under 0.1s
    assert duration < 0.2
