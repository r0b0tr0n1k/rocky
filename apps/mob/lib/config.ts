import Constants from "expo-constants";
import { z } from "zod";

const ConfigSchema = z.object({
  apiUrl: z.url("API URL must be a valid URL"),
  // ISO-style country/state code for the deployment (North Macedonia). A farm
  // selection overrides this at runtime via the active-farm context.
  stateCode: z.string().default("MK"),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export function getConfig(): AppConfig {
  const config = {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? Constants.expoConfig?.extra?.apiUrl ?? "",
    stateCode: process.env.EXPO_PUBLIC_STATE_CODE ?? Constants.expoConfig?.extra?.stateCode ?? "MK",
  };

  const result = ConfigSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
    throw new Error(
      `Invalid configuration. Please check your .env file or app.json:\n${errors}\n\n`
    );
  }

  return config;
}
