/*
  Warnings:

  - You are about to drop the column `document` on the `passenger_document` table. All the data in the column will be lost.
  - Added the required column `document_title` to the `passenger_document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_name` to the `passenger_document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."passenger_document" DROP COLUMN "document",
ADD COLUMN     "document_title" VARCHAR NOT NULL,
ADD COLUMN     "file_name" VARCHAR NOT NULL;
