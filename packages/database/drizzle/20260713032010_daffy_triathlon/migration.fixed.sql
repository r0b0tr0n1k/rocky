CREATE OR REPLACE FUNCTION public.farm_org_id(p_farm_id uuid)
  RETURNS uuid
  LANGUAGE sql
  SECURITY DEFINER
  AS $function$
    SELECT oa.organization_id
    FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE f.id = p_farm_id
  $function$;

CREATE TYPE "species" AS ENUM('BOVINE', 'OVINE', 'CAPRINE', 'PORCINE', 'EQUINE');--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "species" "species" DEFAULT 'BOVINE'::"species" NOT NULL;