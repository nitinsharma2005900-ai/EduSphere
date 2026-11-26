from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
client = TestClient(app)

def test_health_and_readiness():
    assert client.get('/health').status_code == 200
    assert client.get('/ready').json()['ready'] is True

def test_internal_routes_reject_missing_and_invalid_credentials():
    for endpoint in ['/api/v1/grading/evaluate-assessment', '/api/v1/analytics/cohort-performance', '/api/v1/utilities/prepare-certificate']:
        assert client.post(endpoint, json={}).status_code == 403
        assert client.post(endpoint, json={}, headers={'X-Internal-Key': 'wrong-key'}).status_code == 403

def test_grading_http_success_and_invalid_payload():
    headers = {'X-Internal-Key': settings.INTERNAL_SERVICE_KEY}
    assert client.post('/api/v1/grading/evaluate-assessment', headers=headers, json={}).status_code == 422
    result = client.post('/api/v1/grading/evaluate-assessment', headers=headers, json={
        'assessment_id': 'test', 'passing_score': 70,
        'questions': [{'id': 'q1', 'prompt': 'Is PostgreSQL relational?', 'type': 'TRUE_FALSE', 'points': 10, 'correct_answers': ['true'], 'options': [{'id': 'true', 'text': 'True'}, {'id': 'false', 'text': 'False'}]}],
        'student_answers': {'q1': 'true'}
    })
    assert result.status_code == 200
    assert result.json()['percentage'] == 100

def test_certificate_pdf_is_generated():
    result = client.post('/api/v1/utilities/render-certificate', headers={'X-Internal-Key': settings.INTERNAL_SERVICE_KEY}, json={
        'certificate_id': 'test', 'certificate_number': 'EDU-TEST', 'learner_id': 'learner', 'learner_name': 'Test Learner',
        'course_id': 'course', 'course_title': 'Test Course', 'completion_date': '2026-11-26', 'issuer_name': 'EduSphere'
    })
    assert result.status_code == 200
    assert result.content.startswith(b'%PDF-')
