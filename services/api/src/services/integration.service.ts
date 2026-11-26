import { MemoryDataStore } from '../database/store';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { EnrollmentStatus } from '@edusphere/shared';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { createHmac, timingSafeEqual } from 'crypto';

export class IntegrationService {
  private db = MemoryDataStore.getInstance();

  // 1. Sandbox Payments
  public async createPaymentOrder(userId: string, courseId: string) {
    const course = this.db.courses.find(c => c.id === courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const orderId = `order_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
    const idempotencyKey = `idemp_${uuidv4().substring(0, 12)}`;

    const payment = {
      id: `pay-${uuidv4().substring(0, 8)}`,
      orderId,
      userId,
      courseId,
      amount: course.price,
      currency: 'USD',
      status: 'PENDING',
      provider: 'STRIPE_SANDBOX',
      idempotencyKey,
      createdAt: new Date().toISOString(),
    };

    this.db.payments.push(payment);

    return {
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      courseTitle: course.title,
      sandboxCheckoutUrl: `/checkout/sandbox?orderId=${orderId}`,
    };
  }

  public async processSandboxWebhook(payload: {
    eventId: string;
    eventType: string;
    orderId: string;
    signature: string;
  }) {
    // 1. Check Idempotency - prevent duplicate event execution
    const existingEvent = this.db.webhookEvents.find(
      e => e.provider === 'STRIPE_SANDBOX' && e.eventId === payload.eventId
    );
    if (existingEvent) {
      return { status: 'IGNORED_DUPLICATE', message: 'Webhook event already processed' };
    }

    // 2. Validate signature (sandbox format verification)
    const expected = createHmac('sha256', config.payment.webhookSecret).update(`${payload.eventId}.${payload.eventType}.${payload.orderId}`).digest('hex');
    if (typeof payload.signature !== 'string' || payload.signature.length !== expected.length || !timingSafeEqual(Buffer.from(payload.signature), Buffer.from(expected))) {
      throw new ValidationError('Invalid webhook signature verification failed');
    }

    const payment = this.db.payments.find(p => p.orderId === payload.orderId);
    if (!payment) {
      throw new NotFoundError('Payment order not found');
    }

    // Record webhook event for idempotency
    this.db.webhookEvents.push({
      id: uuidv4(),
      provider: 'STRIPE_SANDBOX',
      eventId: payload.eventId,
      processed: true,
      createdAt: new Date().toISOString(),
    });

    if (payload.eventType === 'payment_intent.succeeded') {
      payment.status = 'COMPLETED';
      payment.paymentId = `pi_${uuidv4().replace(/-/g, '').substring(0, 16)}`;

      // Activate Enrollment
      let enrollment = this.db.enrollments.find(
        e => e.userId === payment.userId && e.courseId === payment.courseId
      );
      const now = new Date().toISOString();

      if (!enrollment) {
        enrollment = {
          id: `enr-${uuidv4().substring(0, 8)}`,
          userId: payment.userId,
          courseId: payment.courseId,
          status: EnrollmentStatus.ACTIVE,
          enrolledAt: now,
          progressPercentage: 0.0,
          lastAccessedAt: now,
        };
        this.db.enrollments.push(enrollment);
      } else {
        enrollment.status = EnrollmentStatus.ACTIVE;
      }

      // Send email / notification
      this.db.notifications.push({
        id: uuidv4(),
        userId: payment.userId,
        title: 'Payment Successful',
        message: `Your payment of $${payment.amount} has been verified. You now have full access to your course.`,
        type: 'ENROLLMENT',
        isRead: false,
        linkUrl: `/courses/${payment.courseId}/learn`,
        createdAt: now,
      });

      return { status: 'SUCCESS', enrollmentId: enrollment.id };
    }

    return { status: 'UNHANDLED_EVENT_TYPE' };
  }

  // 2. ICS Calendar Event Export
  public generateIcsCalendar(courseId: string) {
    const course = this.db.courses.find(c => c.id === courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const now = new Date();
    const deadline = new Date(Date.now() + 14 * 86400000);
    const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EduSphere LMS//Learning Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:edusphere-course-${course.id}@edusphere.demo`,
      `DTSTAMP:${formatDate(now)}`,
      `DTSTART:${formatDate(now)}`,
      `DTEND:${formatDate(deadline)}`,
      `SUMMARY:EduSphere: ${course.title} Milestone Deadline`,
      `DESCRIPTION:Study milestone and assessment submission deadline for ${course.title}. Access curriculum at ${config.appUrl}/courses/${course.id}/learn`,
      `URL:${config.appUrl}/courses/${course.id}/learn`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return icsContent;
  }
}
