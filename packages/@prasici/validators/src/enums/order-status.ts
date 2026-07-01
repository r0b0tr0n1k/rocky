import type { z } from "zod";
import { zEnum } from "./_enum-helper";
import { ORDER_STATUS_VALUES } from "@prasici/database/constants/order-status";

export const orderStatusSchema = zEnum(ORDER_STATUS_VALUES);
export type OrderStatus = z.infer<typeof orderStatusSchema>;
