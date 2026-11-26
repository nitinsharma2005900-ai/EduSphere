# EduSphere Security Model & Capstone Challenge Verification

## 1. Security Architecture Summary
EduSphere enforces defense-in-depth across the entire application lifecycle. The system guarantees that learners cannot tamper with grades, unlock restricted content, bypass attempt quotas, or fabricate certificates.

## 2. Capstone Challenge Security Guarantees

| Attack Vector | Attacker Objective | EduSphere Defense Mechanism | Automated Test Proof |
| :--- | :--- | :--- | :--- |
| **Prerequisite Bypass** | Learner attempts to unlock Lesson 10 directly without completing Lesson 1–9. | Backend validates sequential prerequisites by querying completion timestamps. Throws `403 Forbidden`. | `tests/security.test.ts` (Test 1) |
| **Attempt Quota Bypass** | Learner attempts a 4th quiz submission when `maxAttempts = 3`. | Server-side transaction counts prior attempts and blocks 4th submission with `403 Forbidden`. | `tests/security.test.ts` (Test 2) |
| **Grade Tampering** | Learner attempts to grade their own assignment or alter scores. | RBAC middleware restricts grading endpoints strictly to `ASSESSOR`, `INSTRUCTOR`, and `ADMIN`. Throws `403 Forbidden`. | `tests/security.test.ts` (Test 3) |
| **Unearned Certificate** | Learner attempts to issue a certificate for an incomplete course. | Server independently verifies 100% lesson completion and passing quiz grades before issuing certificate. Throws `403 Forbidden`. | `tests/security.test.ts` (Test 4) |
| **Answer Leakage** | Learner inspects API response before quiz submission to read correct answers. | Quiz retrieval endpoint sanitizes questions, omitting `correctAnswers` and `explanation` for learners. | `tests/security.test.ts` (Test 5) |

## 3. General Security Controls
- **JWT Authentication**: Short-lived access tokens (15m) and cryptographically signed refresh tokens (7d).
- **Refresh Token Rotation**: Re-using a previous refresh token immediately invalidates the entire token family.
- **Input Sanitization & Schema Validation**: All payloads validated with Zod schemas.
- **HTTP Security Headers**: Helmet middleware enforcing CSP, Frameguard (Clickjacking defense), and XSS filters.
- **CORS Protection**: Restricted origins and credentialed request validation.
- **Audit Logging**: Sensitive actions (role changes, certificate revocations) recorded in `AuditLog`.
