-- Drop one-schedule-per-user unique index; add name + isDefault for Cal.com-style schedules
DROP INDEX IF EXISTS "AvailabilitySchedule_userId_key";

ALTER TABLE "AvailabilitySchedule" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Working hours';
ALTER TABLE "AvailabilitySchedule" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

UPDATE "AvailabilitySchedule" SET "isDefault" = true;

CREATE INDEX "AvailabilitySchedule_userId_idx" ON "AvailabilitySchedule"("userId");
