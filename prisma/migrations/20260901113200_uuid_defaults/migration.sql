-- Prisma @default(uuid()) is client-side only; RPCs insert without id.
ALTER TABLE "organizations" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "memberships" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
