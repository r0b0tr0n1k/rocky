import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { NotificationService } from "@rocky/domains-notification/index.js";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type MarkAsReadInput,
  markAsReadSchema,
  confirmDeliverySchema,
  type ConfirmDeliveryInput,
  notificationOutputSchema,
  notificationListRequestSchema,
  type SendNotificationInput,
  type RegisterDeviceInput,
  registerDeviceSchema,
  sendNotificationSchema,
} from "@rocky/validators/api/index.js";
import { NOTIFICATION_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

// Local type aliases for decorator-safe usage
type NotificationOutput = z.infer<typeof notificationOutputSchema>;

const unwrapResult = createResultUnwrapper(NOTIFICATION_TRPC_ERROR_MAP);


// Named output schemas (were inline) — required so Bridge 2b can reference
// `z.output<typeof X>` and prove the declared contract vs the service Result.
const unreadCountSchema = z.object({ count: z.number() });
@Router({ alias: "notification" })
@RegisterPolicy("notification")
@Policy({ authenticated: true })
@Injectable()
export class NotificationRouter {
  constructor(
    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
  ) { }

  @Query({ output: unreadCountSchema })
  async unreadCount(@Ctx() ctx: AppContext): Promise<{ count: number }> {
    const count = unwrapResult(
      await this.notificationService.getUnreadCount(ctx.execution!.principal.id),
    );

    return { count };
  }

  @Query({ input: notificationListRequestSchema, output: z.array(notificationOutputSchema) })
  async list(
    @Input() input: z.infer<typeof notificationListRequestSchema>,
    @Ctx() ctx: AppContext,
  ): Promise<NotificationOutput[]> {
    return unwrapResult(
      await this.notificationService.list({
        userId: ctx.execution!.principal.id,
        status: input.status,
        category: input.category,
        limit: input.limit,
        offset: input.offset,
      }),
    );
  }

  @Mutation({
    input: sendNotificationSchema.omit({ userId: true }),
    output: notificationOutputSchema,
  })
  @Policy({ authenticated: true, roles: ["VD_ADMIN", "VD_STAFF"] })
  async send(@Input() input: SendNotificationInput, @Ctx() ctx: AppContext): Promise<NotificationOutput> {
    const principalId = ctx.execution!.principal.id;
    const normalizedInput = {
      type: input.type || "EMAIL",
      category: input.category || "notification",
      subject: input.subject,
      message: input.message,
      priority: input.priority,
      data: input.data,
    };

    const notification = unwrapResult(
      await this.notificationService.send({
        userId: principalId,
        ...normalizedInput,
      }),
    );

    // Fire-and-forget push (best-effort; respects opt-outs server-side via the
    // device_tokens table). Pull still works if delivery fails.
    void this.notificationService.emitPush({
      userIds: [principalId],
      title: normalizedInput.subject,
      body: normalizedInput.message,
      data: (normalizedInput.data as Record<string, unknown> | undefined) ?? undefined,
    });

    return notification;
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
  @Mutation({ input: confirmDeliverySchema.omit({ userId: true }), output: notificationOutputSchema })
  async confirmDelivery(
    @Input() input: Omit<ConfirmDeliveryInput, "userId">,
    @Ctx() ctx: AppContext,
  ): Promise<NotificationOutput> {
    return unwrapResult(
      await this.notificationService.confirmDelivery({
        ...input,
        userId: ctx.execution!.principal.id,
      }),
    );
  }

  @Mutation({ input: registerDeviceSchema, output: z.object({ ok: z.literal(true) }) })
  async registerDevice(
    @Input() input: RegisterDeviceInput,
    @Ctx() ctx: AppContext,
  ): Promise<{ ok: true }> {
    unwrapResult(
      await this.notificationService.registerDevice(ctx.execution!.principal.id, input),
    );
    return { ok: true };
  }
}

// SubtypeGuillotine (one-directional: schema output ⊆ return type) — response
// schemas are Drizzle-derived projections; the hand-written interface is the
// wider SSOT, so AssertEqual would false-positive. See audit G3.
type _verify_unreadCountOutput = SubtypeGuillotine<
  z.output<typeof unreadCountSchema>,
  Awaited<ReturnType<NotificationRouter["unreadCount"]>>
>;
type _verify_listOutput = SubtypeGuillotine<
  z.output<typeof notificationOutputSchema>[],
  Awaited<ReturnType<NotificationRouter["list"]>>
>;
type _verify_sendOutput = SubtypeGuillotine<
  z.output<typeof notificationOutputSchema>,
  Awaited<ReturnType<NotificationRouter["send"]>>
>;
type _verify_markAsReadOutput = SubtypeGuillotine<
  z.output<typeof notificationOutputSchema>,
  Awaited<ReturnType<NotificationRouter["markAsRead"]>>
>;
type _verify_confirmDeliveryOutput = SubtypeGuillotine<
  z.output<typeof notificationOutputSchema>,
  Awaited<ReturnType<NotificationRouter["confirmDelivery"]>>
>;

export type _NotificationGuillotines = ActivateGuillotines<[
  _verify_unreadCountOutput,
  _verify_listOutput,
  _verify_sendOutput,
  _verify_markAsReadOutput,
  _verify_confirmDeliveryOutput
]>;
