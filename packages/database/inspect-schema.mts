import { geofencesSelectSchema } from "./src/zod/iot.js";
import { diseasesSelectSchema, labTestsSelectSchema } from "./src/zod/health.js";
import { notificationsSelectSchema } from "./src/zod/notification.js";

function dump(name: string, schema: any) {
  const shape = schema.shape;
  console.log(`\n===== ${name} =====`);
  for (const [k, v] of Object.entries<any>(shape)) {
    const undef = v.safeParse(undefined).success;
    const nul = v.safeParse(null).success;
    let t = "?";
    if (v.safeParse("x").success) t = "string";
    else if (v.safeParse(123).success) t = "number";
    else if (v.safeParse(true).success) t = "boolean";
    else if (v.safeParse(new Date()).success) t = "date";
    else if (v.safeParse(["a"]).success) t = "array";
    else if (v.safeParse({}).success) t = "object";
    const req = !undef ? "REQUIRED" : nul ? "nullable" : "optional?";
    console.log(`  ${k.padEnd(24)} type=${t.padEnd(8)} ${req}`);
  }
}
dump("geofences", geofencesSelectSchema);
dump("diseases", diseasesSelectSchema);
dump("labTests", labTestsSelectSchema);
dump("notifications", notificationsSelectSchema);
