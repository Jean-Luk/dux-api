/*
  Warnings:

  - The `bill_due_date` column on the `line` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `line_weekday` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `weekday` on the `line_weekday` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."invite" ADD COLUMN     "accepted_at" TIMESTAMP(6),
ALTER COLUMN "fk_line" DROP NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."line" ALTER COLUMN "departure_time" SET DATA TYPE TIME,
DROP COLUMN "bill_due_date",
ADD COLUMN     "bill_due_date" SMALLINT;

-- AlterTable
ALTER TABLE "public"."line_weekday" DROP CONSTRAINT "line_weekday_pkey",
DROP COLUMN "weekday",
ADD COLUMN     "weekday" SMALLINT NOT NULL,
ADD CONSTRAINT "line_weekday_pkey" PRIMARY KEY ("fk_line", "weekday");
