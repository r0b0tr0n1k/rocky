import { Inject, Injectable } from "@nestjs/common";
import {
  NotificationService,
} from "@rocky/domains-notification";
import { createResultUnwrapper } from "@rocky/trpc";
import {
  markAsReadSchema,
  notificationOutputSchema,
  sendNotificationSchema,
  type MarkAsReadInput,
  type SendNotificationInput,
} from "@rocky/validators/api";
import { NOTIFICATION_TRPC_ERROR_MAP } from "@rocky/validators/errors";
import { TRPCError } from "@trpc/server";
import {
  Ctx,
  Input,
  Mutation,
  Query,
  Router,
  UseMiddlewares,
} from "nestjs-trpc";
import { z } from "zod";
import {
  ProtectedMiddleware,
  type ProtectedMiddlewareContext,
} from "../trpc/middlewares/protected.middleware.js";

// Local type aliases for decorator-safe usage
type NotificationOutput = z.infer<typeof notificationOutputSchema>;

const unwrapResult = createResultUnwrapper(NOTIFICATION_TRPC_ERROR_MAP);

@Router({ alias: "notification" })
@UseMiddlewares(ProtectedMiddleware)
@Injectable()
export class NotificationRouter {
  constructor(
    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
  ) { }

  @Query({ output: z.object({ count: z.number() }) })
  async unreadCount(
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<{ count: number }> {
    const result = await this.notificationService.list({
      userId: ctx.auth.userId,
      status: "delivered",
      limit: 1000,
      offset: 0,
    });

    if (result.isErr()) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: result.error.message,
      });
    }

    return { count: result.value.length };
  }

  @Mutation({
    input: sendNotificationSchema.omit({ userId: true }),
    output: notificationOutputSchema,
  })
  async send(
    @Input() input: SendNotificationInput,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<NotificationOutput> {
    const normalizedInput = {
      type: input.type || "EMAIL",
      category: input.category || "notification",
      subject: input.subject,
      message: input.message,
      priority: input.priority,
      data: input.data,
    };

    // Role-based authorization check
    if (ctx.auth.role !== "VD_ADMIN" && ctx.auth.role !== "VD_STAFF") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only VD staff can send notifications",
      });
    }

    return unwrapResult(
      await this.notificationService.send({
        userId: ctx.auth.userId,
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
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<NotificationOutput> {
    return unwrapResult(
      await this.notificationService.markAsRead({
        ...input,
        userId: ctx.auth.userId,
      }),
    );
  }
}
