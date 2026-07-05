import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { NotificationService } from "@rocky/domains-notification/index.js";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type MarkAsReadInput,
  markAsReadSchema,
  notificationOutputSchema,
  type SendNotificationInput,
  sendNotificationSchema,
} from "@rocky/validators/api/index.js";
import { NOTIFICATION_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

// Local type aliases for decorator-safe usage
type NotificationOutput = z.infer<typeof notificationOutputSchema>;

const unwrapResult = createResultUnwrapper(NOTIFICATION_TRPC_ERROR_MAP);

@Router({ alias: "notification" })
@RegisterPolicy("notification")
@Policy({ authenticated: true })
@Injectable()
export class NotificationRouter {
  constructor(
    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
  ) { }

  @Query({ output: z.object({ count: z.number() }) })
  async unreadCount(@Ctx() ctx: AppContext): Promise<{ count: number }> {
    const notifications = unwrapResult(
      await this.notificationService.list({
        userId: ctx.execution!.principal.id,
        status: "delivered",
        limit: 1000,
        offset: 0,
      }),
    );

    return { count: notifications.length };
  }

  @Mutation({
    input: sendNotificationSchema.omit({ userId: true }),
    output: notificationOutputSchema,
  })
  @Policy({ authenticated: true, roles: ["VD_ADMIN", "VD_STAFF"] })
  async send(@Input() input: SendNotificationInput, @Ctx() ctx: AppContext): Promise<NotificationOutput> {
    const normalizedInput = {
      type: input.type || "EMAIL",
      category: input.category || "notification",
      subject: input.subject,
      message: input.message,
      priority: input.priority,
      data: input.data,
    };

    return unwrapResult(
      await this.notificationService.send({
        userId: ctx.execution!.principal.id,
        ...normalizedInput,
      }),
    );
  }

  @Mutation({
    input: markAsReadSchema.omit({ userId: true }),
    output: notificationOutputSchema,
  })
  async markAsRead(
    @Input() input: Omit<MarkAsReadInput, "userId">,
    @Ctx() ctx: AppContext,
  ): Promise<NotificationOutput> {
    return unwrapResult(
      await this.notificationService.markAsRead({
        ...input,
        userId: ctx.execution!.principal.id,
      }),
    );
  }
}
