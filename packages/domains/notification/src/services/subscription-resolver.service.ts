import {
  notificationErr,
  NOTIFICATION_ERRORS,
} from "../errors/notification.errors.js";
import type { NotificationRepository } from "../repositories/notification.repository.js";
import type { NotificationService } from "./notification.service.js";
import { db } from "@rocky/database";
import {
  eventSubscriptions,
  reminders,
  notificationDeliveries,
} from "@rocky/database";
import { users } from "@rocky/database/schema/sm";
import { eq, and } from "drizzle-orm";
import type {
  notificationTypeType,
  notificationCategoryType,
  notificationPriorityType,
} from "@rocky/validators/enums";

export interface ResolveAndNotifyInput {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  data: Record<string, unknown>;
  outboxEventId: string;
}

export class SubscriptionResolver {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly repo: NotificationRepository,
  ) {}

  async resolveAndNotify(input: ResolveAndNotifyInput): Promise<void> {
    const subs = await db
      .select()
      .from(eventSubscriptions)
      .where(
        and(
          eq(eventSubscriptions.eventType, input.eventType),
          eq(eventSubscriptions.isActive, true),
        ),
      );

    for (const sub of subs) {
      if (!this.matchesConditions(input.data, sub.conditions as any[]))
        continue;

      const users = await this.resolveTargetUsers(sub.targetType, sub.targetId);
      for (const user of users) {
        const key = `${input.outboxEventId}:${sub.id}:${user.id}`;

        const alreadyDelivered = await db
          .select({ id: notificationDeliveries.id })
          .from(notificationDeliveries)
          .where(eq(notificationDeliveries.deliveryKey, key))
          .limit(1);

        if (alreadyDelivered.length > 0) continue;

        const [delivery] = await db
          .insert(notificationDeliveries)
          .values({
            outboxEventId: input.outboxEventId,
            subscriptionId: sub.id,
            userId: user.id,
            deliveryKey: key,
            status: "pending",
          })
          .onConflictDoNothing({ target: notificationDeliveries.deliveryKey })
          .returning();

        if (!delivery) continue;

        const template = await this.repo.findTemplateByCode(input.eventType);
        const title = this.formatTitle(template, input.eventType);
        const message = this.formatMessage(template, input.data);

        const result = await this.notificationService.send({
          userId: user.id,
          type: this.resolveChannel(sub.channels as any),
          category:
            (template as { category?: notificationCategoryType })?.category ??
            (input.eventType as notificationCategoryType),
          subject: title,
          message,
          priority: this.resolvePriority(input.data),
        });

        if (result.isOk()) {
          await db
            .update(notificationDeliveries)
            .set({
              notificationId: result.value.id,
              status: "sent",
              deliveredAt: new Date(),
            })
            .where(eq(notificationDeliveries.id, delivery.id));
        }

        if (sub.reminderEnabled) {
          await this.createReminder(sub, user.id, input);
        }
      }
    }
  }

  private async resolveTargetUsers(
    targetType: string,
    targetId: string,
  ): Promise<Array<{ id: string }>> {
    switch (targetType) {
      case "user":
        return db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, targetId as any));
      case "role":
        return db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, targetId as any));
      case "org":
        return db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.organizationId, targetId as any));
      default:
        return [];
    }
  }

  private matchesConditions(
    data: Record<string, unknown>,
    conditions: Array<{ field: string; operator: string; value: unknown }>,
  ): boolean {
    if (!conditions?.length) return true;
    return conditions.every((c) => {
      const value = data[c.field];
      switch (c.operator) {
        case "=":
          return value == c.value;
        case "!=":
          return value != c.value;
        case ">":
          return Number(value) > Number(c.value);
        case "<":
          return Number(value) < Number(c.value);
        case "in":
          return Array.isArray(c.value) && c.value.includes(value);
        default:
          return true;
      }
    });
  }

  private resolveChannel(
    channels: Record<string, boolean>,
  ): notificationTypeType {
    if (channels.push) return "push";
    if (channels.email) return "email";
    return "in_app";
  }

  private resolvePriority(
    data: Record<string, unknown>,
  ): notificationPriorityType {
    const p = data.priority as string;
    if (
      p === "low" ||
      p === "normal" ||
      p === "high" ||
      p === "urgent" ||
      p === "critical"
    )
      return p;
    return "normal";
  }

  private formatTitle(template: unknown, eventType: string): string {
    if (template && typeof template === "object" && "subject" in template) {
      return (template as any).subject;
    }
    return `Event: ${eventType}`;
  }

  private formatMessage(
    template: unknown,
    data: Record<string, unknown>,
  ): string {
    if (template && typeof template === "object" && "message" in template) {
      return (template as any).message;
    }
    return JSON.stringify(data);
  }

  private async createReminder(
    sub: typeof eventSubscriptions.$inferSelect,
    userId: string,
    input: ResolveAndNotifyInput,
  ): Promise<void> {
    await db.insert(reminders).values({
      outboxEventId: input.outboxEventId,
      entityType: input.aggregateType,
      entityId: input.aggregateId,
      userId: userId,
      title: `Follow-up: ${input.eventType}`,
      dueAt: new Date(
        Date.now() + sub.reminderOffsetDays * 24 * 60 * 60 * 1000,
      ),
      priority: "normal",
    });
  }
}
