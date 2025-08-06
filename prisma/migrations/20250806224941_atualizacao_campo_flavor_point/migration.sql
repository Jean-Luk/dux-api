/*
  Warnings:

  - Made the column `flavor` on table `point` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."point" ALTER COLUMN "flavor" SET NOT NULL,
ALTER COLUMN "flavor" SET DATA TYPE CHAR(2);
