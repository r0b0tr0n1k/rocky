"use client";

import { Badge } from "@rocky/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rocky/ui/components/card";
import { markAsReadSchema, sendNotificationSchema } from "@rocky/validators/api";
import { NOTIFICATION_CATEGORY, NOTIFICATION_PRIORITY, NOTIFICATION_TYPE } from "@rocky/validators/enums";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActionDialog } from "#components/shared/action-dialog";
import { SelectField, TextareaField, TextField } from "#components/shared/form-fields";
import { PageHeader } from "#components/shared/page-header";
import { enumToOptions } from "#lib/options";
import { useTRPC } from "#lib/trpc";

export default function NotificationsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const unread = useQuery(trpc.notification.unreadCount.queryOptions());

  const invalidate = (key: unknown) => queryClient.invalidateQueries({ queryKey: key as never });
  const send = useMutation(
    trpc.notification.send.mutationOptions({ onSuccess: () => invalidate(trpc.notification.unreadCount.queryKey()) }),
  );
  const markAsRead = useMutation(
    trpc.notification.markAsRead.mutationOptions({
      onSuccess: () => invalidate(trpc.notification.unreadCount.queryKey()),
    }),
  );

  const count = unread.data?.count ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Notifications" description="Dispatch and acknowledge system notifications." />
      <Card>
        <CardHeader>
          <CardTitle>Unread</CardTitle>
          <CardDescription>Notifications awaiting acknowledgement for the current user.</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant={count > 0 ? "destructive" : "secondary"} className="text-base">
            {count} unread
          </Badge>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <ActionDialog
          triggerLabel="Send notification"
          schema={sendNotificationSchema.omit({ userId: true })}
          mutation={send}
          title="Send notification"
          description="Dispatch a notification to the current user's channels."
          fields={(form) => (
            <>
              <SelectField
                control={form.control}
                name="type"
                label="Type"
                options={enumToOptions(Object.values(NOTIFICATION_TYPE))}
              />
              <SelectField
                control={form.control}
                name="category"
                label="Category"
                options={enumToOptions(Object.values(NOTIFICATION_CATEGORY))}
              />
              <TextField control={form.control} name="subject" label="Subject" placeholder="e.g. Inspection overdue" />
              <TextareaField
                control={form.control}
                name="message"
                label="Message"
                placeholder="Body of the notification"
              />
              <SelectField
                control={form.control}
                name="priority"
                label="Priority"
                options={enumToOptions(Object.values(NOTIFICATION_PRIORITY))}
              />
            </>
          )}
        />
        <ActionDialog
          triggerLabel="Mark as read"
          schema={markAsReadSchema.omit({ userId: true })}
          mutation={markAsRead}
          title="Mark notification as read"
          description="Acknowledge a notification by its ID."
          fields={(form) => (
            <TextField
              control={form.control}
              name="id"
              label="Notification ID (UUID)"
              placeholder="notification uuid"
            />
          )}
        />
      </div>
    </div>
  );
}
