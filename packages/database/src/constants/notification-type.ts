import { createEnumValues } from "./_brand.js"

export const NOTIFICATION_TYPE = {
	EMAIL: "email",
	SMS: "sms",
	PUSH: "push",
	IN_APP: "in_app",
	WEBHOOK: "webhook",
} as const;

export const NOTIFICATION_TYPE_VALUES = createEnumValues([
	NOTIFICATION_TYPE.EMAIL,
	NOTIFICATION_TYPE.SMS,
	NOTIFICATION_TYPE.PUSH,
	NOTIFICATION_TYPE.IN_APP,
	NOTIFICATION_TYPE.WEBHOOK,
] as const);
