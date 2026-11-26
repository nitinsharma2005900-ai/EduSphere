# EduSphere Incident Simulation & Root Cause Analysis (RCA) Report

This document records the forensic investigation, root cause identification, remediation implementation, and regression prevention for the five controlled production incident simulations required by **Assessment 15**.

---

## Incident 1: Incorrect Grades & Floating-Point Drift in Multiple-Choice Scoring

### 1. Incident Symptom & Impact
Learners attempting complex multiple-choice questions with partial credit reported inconsistent percentage totals (e.g., 66.6666667% causing boundary pass/fail flip) and occasional negative scores when guessing incorrect distractors.

### 2. Root Cause Analysis (RCA)
- **Log Inspection**: In the legacy scoring script, the ratio `(TP / total_correct) - (FP / total_incorrect)` was evaluated with unconstrained negative balance.
- **Defect**: When a student selected 1 correct answer and 3 incorrect answers on a 4-point question, the penalty outweighed the positive score without a `max(0.0, score)` clamp. Furthermore, unrounded floating point arithmetic caused rounding errors when compared against the integer passing mark `70.0`.

### 3. Engineering Fix & Remediation
- Implemented `DeterministicGradingEngine` in `services/analytics/app/services/grading.py`:
  - Added a strict zero floor: `awarded = round(max(0.0, score_ratio) * q.points, 2)`.
  - Normalized all scores to two decimal places.
  - Implemented partial credit weighting with proportional distractor penalty.

### 4. Regression Test Added
- `services/analytics/tests/test_grading.py::test_multiple_choice_partial_credit` directly asserts exact point bounds across full, partial, and penalty selections.

---

## Incident 2: Duplicated Attempts via Rapid Concurrent Submissions

### 1. Incident Symptom & Impact
Learners on high-latency mobile networks clicking "Submit Quiz" multiple times simultaneously triggered duplicate `AssessmentAttempt` database insertions, bypassing the configured `maxAttempts = 3` limit.

### 2. Root Cause Analysis (RCA)
- **Log Inspection**: Multiple concurrent HTTP `POST /api/v1/assessments/:id/submit` requests executed simultaneously before the first record was committed to the database.
- **Defect**: Lack of a database compound unique constraint and application-level lock allowed a race condition where attempt count was read as 2 by both threads simultaneously.

### 3. Engineering Fix & Remediation
- In `database/prisma/schema.prisma`:
  - Enforced `@@unique([assessmentId, userId, attemptNumber])` on `AssessmentAttempt`.
- In `services/api/src/services/assessment.service.ts`:
  - Wrapped attempt evaluation in transactional state checks. The 4th concurrent attempt immediately returns `403 Forbidden` with `"Attempt limit exceeded"`.

### 4. Regression Test Added
- `services/api/tests/security.test.ts::SECURITY TEST 2: Learner must NOT exceed assessment attempt limits` verifies that even when attempts are fired, the 4th attempt is strictly blocked.

---

## Incident 3: Progress Desynchronization & Sequential Lock Bypass

### 1. Incident Symptom & Impact
Learners discovered they could craft direct API requests to `POST /api/v1/enrollments/lessons/:lessonId/progress` for Lesson 10 without completing Lessons 1 through 9, marking the course 100% complete in seconds.

### 2. Root Cause Analysis (RCA)
- **Log Inspection**: The frontend UI had disabled the buttons for locked lessons, but the backend endpoint only checked if `enrollmentId` existed, assuming the frontend had prevented the navigation.
- **Defect**: Client-side-only security enforcement (CWE-602).

### 3. Engineering Fix & Remediation
- In `services/api/src/services/progress.service.ts`:
  - Implemented server-side sequential verification:
    ```typescript
    if (prevLesson.isMandatory) {
      const prevProg = this.db.lessonProgress.find(...);
      if (!prevProg || !prevProg.isCompleted) {
        throw new ForbiddenError('Sequential learning restriction...');
      }
    }
    ```

### 4. Regression Test Added
- `services/api/tests/security.test.ts::SECURITY TEST 1: Learner must NOT be able to unlock restricted lessons by skipping prerequisites` directly simulates a manipulated API call and verifies a 403 Forbidden rejection.

---

## Incident 4: Broken & Unauthorized Video Access

### 1. Incident Symptom & Impact
Video streaming CDN URLs and direct asset URLs were returned in public course catalogs, allowing non-enrolled users to download copyrighted course videos without enrollment or payment.

### 2. Root Cause Analysis (RCA)
- **Log Inspection**: `GET /api/v1/courses/:id` returned the full `lessons` array including `videoUrl` directly to unauthenticated visitors.

### 3. Engineering Fix & Remediation
- Sanitized public course responses in `services/api/src/services/course.service.ts` to return only titles and metadata without streaming URLs.
- In `services/api/src/services/progress.service.ts`, `videoUrl` is only populated if the lesson is explicitly marked `isPreview` or if the user is verified enrolled and the lesson is unlocked.

### 4. Regression Test Added
- `services/api/tests/learning-workflow.test.ts` and `services/api/tests/security.test.ts` assert that sensitive streaming links are omitted for locked lessons.

---

## Incident 5: Incorrect Certificate Issuance Without Requisite Criteria

### 1. Incident Symptom & Impact
Learners claimed completion certificates for courses where they had only watched 40% of the lessons or failed the knowledge check assessment.

### 2. Root Cause Analysis (RCA)
- **Log Inspection**: The certificate generation endpoint trusted a client-supplied flag `{ "courseCompleted": true }`.

### 3. Engineering Fix & Remediation
- In `services/api/src/services/certificate.service.ts`:
  - Stripped all client inputs; the server queries the database system of record to verify:
    1. 100% of mandatory lessons are completed.
    2. All course assessments have passed attempts.
    3. Enrollment status is verified active.
  - Generates tamper-proof SHA-256 certificate hashes and verification URLs.
  - Implemented administrative revocation with audit logging in `CertificateRevocationAudit`.

### 4. Regression Test Added
- `services/api/tests/security.test.ts::SECURITY TEST 4: Learner must NOT issue an unauthorized certificate without fulfilling requirements` proves that attempting to claim a certificate for Course 2 (40% complete) throws a 403 Forbidden error.
