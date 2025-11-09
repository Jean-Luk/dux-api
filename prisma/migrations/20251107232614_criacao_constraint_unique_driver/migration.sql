/*
  Warnings:

  - A unique constraint covering the columns `[fk_user,fk_line]` on the table `driver` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "driver_fk_user_fk_line_key" ON "public"."driver"("fk_user", "fk_line");
