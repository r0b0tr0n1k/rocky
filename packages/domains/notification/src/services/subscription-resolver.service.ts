import { notificationErr, NOTIFICATION_ERRORS } from "../errors/notification.errors.js";
import type { NotificationRepository } from "../repositories/notification.repository.js";
import type { NotificationService } from "./notification.service.js";
import { fromAsyncThrowable, toAppError, type Result } from "@rocky/domains-shared";
import type { UserRepository } from "@rocky/domains-user";
import type { notificationTypeType, notificationCategoryType, notificationPriorityType } from "@rocky/validators/enums";

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
    private readonly userRepo: UserRepository,
  ) {}

  async resolveAndNotify(input: ResolveAndNotifyInput): Promise<Result<void, Error>> {
    return fromAsyncThrowable(async () => {
      const subs = await this.repo.findActiveSubscriptionsByEventType(input.eventType);

      for (const sub of subs) {
        if (!this.matchesConditions(input.data, sub.conditions as any[])) continue;

        const users = await this.resolveTargetUsers(sub.targetType, sub.targetId);
        for (const user of users) {
          const key = `${input.outboxEventId}:${sub.id}:${user.id}`;

          const existing = await this.repo.findDeliveryByKey(key);
          if (existing) continue;

          const delivery = await this.repo.insertDelivery({
            outboxEventId: input.outboxEventId,
            subscriptionId: sub.id,
            userId: user.id,
            deliveryKey: key,
            status: "pending",
          });
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
            await this.repo.markDeliverySent(delivery.id, result.value.id);
          }

          if (sub.reminderEnabled) {
            await this.createReminder(sub, user.id, input);
          }
        }
      }
    }, toAppError)();
  }

  private async resolveTargetUsers(targetType: string, targetId: string): Promise<Array<{ id: string }>> {
    switch (targetType) {
      case "user": {
        const u = await this.userRepo.findById(targetId);
        return u ? [{ id: u.id }] : [];
      }
      case "role":
        return (await this.userRepo.findByRole(targetId)).map((u: { id: string }) => ({ id: u.id }));
      case "org":
        return (
          await this.userRepo.list({
            organizationId: targetId,
            sortBy: "createdAt",
            sortOrder: "asc",
            limit: 1000,
            offset: 0,
          })
        ).data.map((u: { id: string }) => ({ id: u.id }));
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

  private resolveChannel(channels: Record<string, boolean>): notificationTypeType {
    if (channels.push) return "push";
    if (channels.email) return "email";
    return "in_app";
  }

  private resolvePriority(data: Record<string, unknown>): notificationPriorityType {
    const p = data.priority as string;
    if (p === "low" || p === "normal" || p === "high" || p === "urgent" || p === "critical") return p;
    return "normal";
  }

  private formatTitle(template: unknown, eventType: string): string {
    if (template && typeof template === "object" && "subject" in template) {
      return (template as any).subject;
    }
    return `Event: ${eventType}`;
  }

  private formatMessage(template: unknown, data: Record<string, unknown>): string {
    if (template && typeof template === "object" && "message" in template) {
      return (template as any).message;
    }
    return JSON.stringify(data);
  }

  private async createReminder(
    sub: Awaited<ReturnType<NotificationRepository["findActiveSubscriptionsByEventType"]>>[number],
    userId: string,
    input: ResolveAndNotifyInput,
  ): Promise<void> {
    await this.repo.insertReminder({
      outboxEventId: input.outboxEventId,
      entityType: input.aggregateType,
      entityId: input.aggregateId,
      userId: userId,
      title: `Follow-up: ${input.eventType}`,
      dueAt: new Date(Date.now() + sub.reminderOffsetDays * 24 * 60 * 60 * 1000),
      priority: "normal",
    });
  }
}
