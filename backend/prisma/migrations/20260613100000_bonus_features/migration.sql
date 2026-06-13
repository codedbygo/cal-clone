-- CreateEnum
CREATE TYPE "AvailabilityOverrideType" AS ENUM ('UNAVAILABLE', 'CUSTOM_HOURS');

-- AlterTable
ALTER TABLE "EventType" ADD COLUMN "bufferBeforeMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EventType" ADD COLUMN "bufferAfterMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EventType" ADD COLUMN "customQuestions" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "answers" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "AvailabilityOverride" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" "AvailabilityOverrideType" NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,

    CONSTRAINT "AvailabilityOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityOverride_scheduleId_date_key" ON "AvailabilityOverride"("scheduleId", "date");

-- AddForeignKey
ALTER TABLE "AvailabilityOverride" ADD CONSTRAINT "AvailabilityOverride_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "AvailabilitySchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
