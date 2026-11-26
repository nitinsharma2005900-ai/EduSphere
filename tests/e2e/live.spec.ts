import { test, expect } from '@playwright/test';

const roles = [
  ['learner', 'LEARNER', 'learner', 'Learning'],
  ['instructor', 'INSTRUCTOR', 'instructor', 'Cohort'],
  ['author', 'COURSE_AUTHOR', 'author', 'Course Authoring'],
  ['assessor', 'ASSESSOR', 'assessor', 'Grading'],
  ['admin', 'ADMIN', 'admin', 'Admin'],
];
for (const [email, role, path] of roles) {
  test(`${role} live dashboard and API`, async ({ page, request }) => {
    const response = await request.post('/api/v1/auth/login', { data: { email: `${email}@edusphere.demo`, password: 'EduSphere2026!' } });
    expect(response.ok()).toBeTruthy();
    const { data } = await response.json();
    const errors: string[] = [];
    const localhost: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', req => { if (/https?:\/\/(localhost|127\.0\.0\.1)/.test(req.url()) && !process.env.BASE_URL?.includes('localhost')) localhost.push(req.url()); });
    await page.addInitScript(({ user, tokens }) => {
      localStorage.setItem('edusphere_user', JSON.stringify(user));
      localStorage.setItem('edusphere_token', tokens.accessToken);
      localStorage.setItem('edusphere_refresh', tokens.refreshToken);
    }, data);
    await page.goto(`/dashboard/${path}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Access restricted')).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
    expect(localhost).toEqual([]);
  });
}
test('catalog, public verification, Swagger, responsive layout and role switch', async ({ page, request }) => {
  await page.goto('/courses');
  await expect(page.locator('a[href^="/courses/crs-"]').first()).toBeVisible();
  await page.getByRole('button', { name: /^Author/ }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('edusphere_user') || '{}').role)).toBe('COURSE_AUTHOR');
  await page.goto('/dashboard/author');
  await expect(page.getByRole('button', { name: 'Create New Course' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/verify/EDU-2026-PYT-7892');
  await expect(page.getByText('Alex Rivera').first()).toBeVisible();
  expect((await request.get('/api/docs.json')).ok()).toBeTruthy();
  expect((await request.get('/api/v1/certificates/verify/EDU-2026-PYT-7892/pdf')).headers()['content-type']).toContain('application/pdf');
});
