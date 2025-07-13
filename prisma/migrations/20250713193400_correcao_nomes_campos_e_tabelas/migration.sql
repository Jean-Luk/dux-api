/*
  Warnings:

  - The primary key for the `invite` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `flavor` on the `invite` table. All the data in the column will be lost.
  - The primary key for the `line` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `line_weekday` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `lastname` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `authtoken` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `role` to the `invite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "authtoken" DROP CONSTRAINT "authtoken_login";

-- DropForeignKey
ALTER TABLE "driver" DROP CONSTRAINT "driver_line";

-- DropForeignKey
ALTER TABLE "driver" DROP CONSTRAINT "driver_user";

-- DropForeignKey
ALTER TABLE "invite" DROP CONSTRAINT "invite_email";

-- DropForeignKey
ALTER TABLE "invite" DROP CONSTRAINT "invite_line";

-- DropForeignKey
ALTER TABLE "invite" DROP CONSTRAINT "invitor";

-- DropForeignKey
ALTER TABLE "line_weekday" DROP CONSTRAINT "line_weekday";

-- DropForeignKey
ALTER TABLE "login" DROP CONSTRAINT "user_login";

-- DropForeignKey
ALTER TABLE "manager" DROP CONSTRAINT "manager_user";

-- DropForeignKey
ALTER TABLE "manager_permission" DROP CONSTRAINT "manager_permission";

-- DropForeignKey
ALTER TABLE "manager_permission" DROP CONSTRAINT "permission";

-- DropForeignKey
ALTER TABLE "passenger" DROP CONSTRAINT "passenger_boarding";

-- DropForeignKey
ALTER TABLE "passenger" DROP CONSTRAINT "passenger_destiny";

-- DropForeignKey
ALTER TABLE "passenger" DROP CONSTRAINT "passenger_dropoff";

-- DropForeignKey
ALTER TABLE "passenger" DROP CONSTRAINT "passenger_line";

-- DropForeignKey
ALTER TABLE "passenger" DROP CONSTRAINT "passenger_user";

-- DropForeignKey
ALTER TABLE "passenger_checkin" DROP CONSTRAINT "passenger_checkin";

-- DropForeignKey
ALTER TABLE "passenger_checkin" DROP CONSTRAINT "passenger_checkin_line";

-- DropForeignKey
ALTER TABLE "passenger_document" DROP CONSTRAINT "passenger_document";

-- DropForeignKey
ALTER TABLE "point" DROP CONSTRAINT "line_point";

-- DropIndex
DROP INDEX "user_phone_key";

-- AlterTable
ALTER TABLE "driver" ALTER COLUMN "fk_user" SET DATA TYPE TEXT,
ALTER COLUMN "fk_line" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "invite" DROP CONSTRAINT "invite_pkey",
DROP COLUMN "flavor",
ADD COLUMN     "fk_invited" TEXT,
ADD COLUMN     "role" CHAR(1) NOT NULL,
ALTER COLUMN "pk_invite" DROP DEFAULT,
ALTER COLUMN "pk_invite" SET DATA TYPE TEXT,
ALTER COLUMN "fk_invitor" SET DATA TYPE TEXT,
ALTER COLUMN "fk_line" SET DATA TYPE TEXT,
ADD CONSTRAINT "invite_pkey" PRIMARY KEY ("pk_invite");
DROP SEQUENCE "invite_pk_invite_seq";

-- AlterTable
ALTER TABLE "line" DROP CONSTRAINT "line_pkey",
ALTER COLUMN "pk_line" DROP DEFAULT,
ALTER COLUMN "pk_line" SET DATA TYPE TEXT,
ADD CONSTRAINT "line_pkey" PRIMARY KEY ("pk_line");
DROP SEQUENCE "line_pk_line_seq";

-- AlterTable
ALTER TABLE "line_weekday" DROP CONSTRAINT "line_weekday_pkey",
ALTER COLUMN "fk_line" SET DATA TYPE TEXT,
ADD CONSTRAINT "line_weekday_pkey" PRIMARY KEY ("fk_line", "weekday");

-- AlterTable
ALTER TABLE "login" ALTER COLUMN "fk_user" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "manager" ALTER COLUMN "fk_user" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "passenger" ALTER COLUMN "fk_user" SET DATA TYPE TEXT,
ALTER COLUMN "fk_line" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "passenger_checkin" ALTER COLUMN "fk_line" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "point" ALTER COLUMN "fk_line" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "user" DROP CONSTRAINT "user_pkey",
DROP COLUMN "lastname",
ADD COLUMN     "last_name" VARCHAR NOT NULL,
ALTER COLUMN "pk_user" DROP DEFAULT,
ALTER COLUMN "pk_user" SET DATA TYPE TEXT,
ADD CONSTRAINT "user_pkey" PRIMARY KEY ("pk_user");
DROP SEQUENCE "user_pk_user_seq";

-- DropTable
DROP TABLE "authtoken";

-- CreateTable
CREATE TABLE "session" (
    "pk_authtoken" TEXT NOT NULL,
    "fk_login" INTEGER NOT NULL,
    "auth_token" VARCHAR NOT NULL,
    "ephemeral" BOOLEAN DEFAULT true,
    "last_access" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("pk_authtoken")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_auth_token_key" ON "session"("auth_token");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "authtoken_login" FOREIGN KEY ("fk_login") REFERENCES "login"("pk_login") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_line" FOREIGN KEY ("fk_line") REFERENCES "line"("pk_line") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_user" FOREIGN KEY ("fk_user") REFERENCES "user"("pk_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invite_user" FOREIGN KEY ("fk_invited") REFERENCES "user"("pk_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invite_line" FOREIGN KEY ("fk_line") REFERENCES "line"("pk_line") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invitor_user" FOREIGN KEY ("fk_invitor") REFERENCES "user"("pk_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_weekday" ADD CONSTRAINT "line_weekday" FOREIGN KEY ("fk_line") REFERENCES "line"("pk_line") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login" ADD CONSTRAINT "user_login" FOREIGN KEY ("fk_user") REFERENCES "user"("pk_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager" ADD CONSTRAINT "manager_user" FOREIGN KEY ("fk_user") REFERENCES "user"("pk_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_permission" ADD CONSTRAINT "permission" FOREIGN KEY ("fk_permission") REFERENCES "permission"("pk_permission") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_permission" ADD CONSTRAINT "manager_permission" FOREIGN KEY ("fk_manager") REFERENCES "manager"("pk_manager") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger" ADD CONSTRAINT "passenger_boarding" FOREIGN KEY ("fk_boarding_point") REFERENCES "point"("pk_point") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger" ADD CONSTRAINT "passenger_destiny" FOREIGN KEY ("fk_destiny_point") REFERENCES "point"("pk_point") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger" ADD CONSTRAINT "passenger_dropoff" FOREIGN KEY ("fk_dropoff_point") REFERENCES "point"("pk_point") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger" ADD CONSTRAINT "passenger_line" FOREIGN KEY ("fk_line") REFERENCES "line"("pk_line") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger" ADD CONSTRAINT "passenger_user" FOREIGN KEY ("fk_user") REFERENCES "user"("pk_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger_checkin" ADD CONSTRAINT "passenger_checkin" FOREIGN KEY ("fk_passenger") REFERENCES "passenger"("pk_passenger") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger_checkin" ADD CONSTRAINT "passenger_checkin_line" FOREIGN KEY ("fk_line") REFERENCES "line"("pk_line") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger_document" ADD CONSTRAINT "passenger_document" FOREIGN KEY ("fk_passenger") REFERENCES "passenger"("pk_passenger") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point" ADD CONSTRAINT "line_point" FOREIGN KEY ("fk_line") REFERENCES "line"("pk_line") ON DELETE CASCADE ON UPDATE CASCADE;
