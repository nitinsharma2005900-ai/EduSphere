# EduSphere Test Execution Report

## Verified baseline (26 November 2026)

[GitHub Actions run 45833781536](https://github.com/nitinsharma2005900-ai/EduSphere/actions/runs/45833781536) at commit d4a70dfd21d2273e22463f977225a7648ba18068 recorded 30 passing Jest tests, 3 PostgreSQL integration tests and 10 passing Python tests (43 total). All eight CI jobs passed, including dependency security audit, frontend production build and three Docker image builds. Python reported 18 warnings. This is a historical baseline, not the result of subsequent code changes; see the latest GitHub Actions run for updated results.

Railway runtime logs recorded course creation, enrollment, sequential lesson completion, quiz and assignment grading, certificate verification and PDF, object storage, notifications and analytics. Expected forbidden actions were rejected. These are observed requests, not an exhaustive new browser test.

## Repeat locally

- `npm run test:api`
- `npm run test:analytics`
- `npm run build:all`

Additional certificate regressions cover a newly registered learner, enrollment and prerequisite checks, duplicate claims, identity passed to the PDF renderer and unknown certificate IDs. The API PDF test mocks the renderer; it does not establish live PDF rendering. Browser and live verification scripts are in `tests/e2e` and `scripts/verify-live.mjs`. Live verification creates synthetic test data and should only be run in a designated test/demo environment.

See [known limitations](KNOWN_LIMITATIONS.md). Passing CI does not prove complete assessment compliance.
