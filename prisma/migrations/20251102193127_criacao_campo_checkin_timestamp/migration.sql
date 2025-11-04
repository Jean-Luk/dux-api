-- AlterTable
ALTER TABLE "public"."passenger_checkin" ADD COLUMN     "checkin_timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
