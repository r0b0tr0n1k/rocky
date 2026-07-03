/**
 * PostGIS custom types for Drizzle ORM
 *
 * Drizzle doesn't have native PostGIS support, so we create custom column types
 * that use PostGIS geometry columns. The actual PostGIS type is set via migration SQL.
 */

import { geometry as geometryColumn } from "drizzle-orm/pg-core";

export function geometry(columnName: string) {
  return geometryColumn(columnName, { mode: "xy", type: "point", srid: 4326 });
}
