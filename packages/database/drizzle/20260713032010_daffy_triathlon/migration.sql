CREATE TYPE "species" AS ENUM('BOVINE', 'OVINE', 'CAPRINE', 'PORCINE', 'EQUINE');--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "species" "species" DEFAULT 'BOVINE'::"species" NOT NULL;