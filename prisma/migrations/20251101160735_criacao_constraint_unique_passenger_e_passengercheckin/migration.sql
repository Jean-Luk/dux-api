/*
  Warnings:

  - A unique constraint covering the columns `[fk_user,fk_line]` on the table `passenger` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fk_line,fk_passenger,checkin_date]` on the table `passenger_checkin` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "passenger_fk_user_fk_line_key" ON "public"."passenger"("fk_user", "fk_line");

-- CreateIndex
CREATE UNIQUE INDEX "passenger_checkin_fk_line_fk_passenger_checkin_date_key" ON "public"."passenger_checkin"("fk_line", "fk_passenger", "checkin_date");
