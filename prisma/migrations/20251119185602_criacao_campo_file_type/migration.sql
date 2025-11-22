/*
  Warnings:

  - You are about to drop the column `document_title` on the `passenger_document` table. All the data in the column will be lost.
  - Added the required column `file_type` to the `passenger_document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `passenger_document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."passenger_document" DROP COLUMN "document_title",
ADD COLUMN     "file_type" VARCHAR NOT NULL,
ADD COLUMN     "title" VARCHAR NOT NULL;
