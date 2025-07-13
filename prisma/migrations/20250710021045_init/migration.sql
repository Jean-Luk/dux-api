-- CreateTable
CREATE TABLE "authtoken" (
    "pk_authtoken" SERIAL NOT NULL,
    "fk_login" INTEGER NOT NULL,
    "authtoken" VARCHAR NOT NULL,
    "ephemeral" BOOLEAN DEFAULT true,
    "last_access" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "authtoken_pkey" PRIMARY KEY ("pk_authtoken")
);

-- CreateTable
CREATE TABLE "driver" (
    "pk_driver" SERIAL NOT NULL,
    "fk_user" INTEGER NOT NULL,
    "fk_line" INTEGER NOT NULL,
    "status" CHAR(1) NOT NULL,
    "sharing_location" BOOLEAN DEFAULT false,
    "latitude" INTEGER,
    "longitude" INTEGER,

    CONSTRAINT "driver_pkey" PRIMARY KEY ("pk_driver")
);

-- CreateTable
CREATE TABLE "invite" (
    "pk_invite" SERIAL NOT NULL,
    "fk_invitor" INTEGER NOT NULL,
    "fk_line" INTEGER NOT NULL,
    "invited_email" VARCHAR NOT NULL,
    "flavor" CHAR(1) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "invite_pkey" PRIMARY KEY ("pk_invite")
);

-- CreateTable
CREATE TABLE "line" (
    "pk_line" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "departure_time" TIMESTAMP(6),
    "active" BOOLEAN DEFAULT true,
    "bill_due_date" DATE,

    CONSTRAINT "line_pkey" PRIMARY KEY ("pk_line")
);

-- CreateTable
CREATE TABLE "line_weekday" (
    "fk_line" INTEGER NOT NULL,
    "weekday" CHAR(1) NOT NULL,

    CONSTRAINT "line_weekday_pkey" PRIMARY KEY ("fk_line","weekday")
);

-- CreateTable
CREATE TABLE "login" (
    "pk_login" SERIAL NOT NULL,
    "fk_user" INTEGER NOT NULL,
    "password" VARCHAR NOT NULL,
    "salt" VARCHAR NOT NULL,

    CONSTRAINT "login_pkey" PRIMARY KEY ("pk_login")
);

-- CreateTable
CREATE TABLE "manager" (
    "pk_manager" SERIAL NOT NULL,
    "fk_user" INTEGER NOT NULL,
    "status" CHAR(1) NOT NULL,

    CONSTRAINT "manager_pkey" PRIMARY KEY ("pk_manager")
);

-- CreateTable
CREATE TABLE "manager_permission" (
    "fk_permission" INTEGER NOT NULL,
    "fk_manager" INTEGER NOT NULL,
    "active" BOOLEAN DEFAULT false,

    CONSTRAINT "manager_permission_pkey" PRIMARY KEY ("fk_permission","fk_manager")
);

-- CreateTable
CREATE TABLE "passenger" (
    "pk_passenger" SERIAL NOT NULL,
    "fk_user" INTEGER NOT NULL,
    "fk_line" INTEGER NOT NULL,
    "status" CHAR(1) NOT NULL,
    "fk_boarding_point" INTEGER,
    "fk_destiny_point" INTEGER,
    "fk_dropoff_point" INTEGER,
    "card_status" CHAR(1),

    CONSTRAINT "passenger_pkey" PRIMARY KEY ("pk_passenger")
);

-- CreateTable
CREATE TABLE "passenger_checkin" (
    "pk_checkin" SERIAL NOT NULL,
    "fk_line" INTEGER NOT NULL,
    "fk_passenger" INTEGER NOT NULL,
    "checkin_date" DATE NOT NULL,
    "checked" BOOLEAN DEFAULT true,

    CONSTRAINT "passenger_checkin_pkey" PRIMARY KEY ("pk_checkin")
);

-- CreateTable
CREATE TABLE "passenger_document" (
    "pk_document" SERIAL NOT NULL,
    "fk_passenger" INTEGER NOT NULL,
    "document" BYTEA NOT NULL,

    CONSTRAINT "passenger_document_pkey" PRIMARY KEY ("pk_document")
);

-- CreateTable
CREATE TABLE "permission" (
    "pk_permission" SERIAL NOT NULL,
    "description" VARCHAR,
    "default_value" BOOLEAN DEFAULT false,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("pk_permission")
);

-- CreateTable
CREATE TABLE "point" (
    "pk_point" SERIAL NOT NULL,
    "fk_line" INTEGER NOT NULL,
    "address" VARCHAR NOT NULL,
    "sequence_position" INTEGER NOT NULL,
    "latitude" INTEGER NOT NULL,
    "longitude" INTEGER NOT NULL,
    "flavor" CHAR(1),

    CONSTRAINT "point_pkey" PRIMARY KEY ("pk_point")
);

-- CreateTable
CREATE TABLE "user" (
    "pk_user" SERIAL NOT NULL,
    "email" VARCHAR NOT NULL,
    "cpf" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "lastname" VARCHAR NOT NULL,
    "phone" CHAR(11),

    CONSTRAINT "user_pkey" PRIMARY KEY ("pk_user")
);

-- CreateIndex
CREATE UNIQUE INDEX "authtoken_authtoken_key" ON "authtoken"("authtoken");

-- CreateIndex
CREATE UNIQUE INDEX "login_fk_user_key" ON "login"("fk_user");

-- CreateIndex
CREATE UNIQUE INDEX "manager_fk_user_key" ON "manager"("fk_user");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_cpf_key" ON "user"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_key" ON "user"("phone");

-- AddForeignKey
ALTER TABLE "authtoken" ADD CONSTRAINT "authtoken_login" FOREIGN KEY ("fk_login") REFERENCES "login"("pk_login") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_line" FOREIGN KEY ("fk_line") REFERENCES "line"("pk_line") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_user" FOREIGN KEY ("fk_user") REFERENCES "user"("pk_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invite_email" FOREIGN KEY ("invited_email") REFERENCES "user"("email") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invite_line" FOREIGN KEY ("fk_line") REFERENCES "line"("pk_line") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invitor" FOREIGN KEY ("fk_invitor") REFERENCES "user"("pk_user") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "line_weekday" ADD CONSTRAINT "line_weekday" FOREIGN KEY ("fk_line") REFERENCES "line"("pk_line") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "login" ADD CONSTRAINT "user_login" FOREIGN KEY ("fk_user") REFERENCES "user"("pk_user") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "manager" ADD CONSTRAINT "manager_user" FOREIGN KEY ("fk_user") REFERENCES "user"("pk_user") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "manager_permission" ADD CONSTRAINT "manager_permission" FOREIGN KEY ("fk_manager") REFERENCES "manager"("pk_manager") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "manager_permission" ADD CONSTRAINT "permission" FOREIGN KEY ("fk_permission") REFERENCES "permission"("pk_permission") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "passenger" ADD CONSTRAINT "passenger_boarding" FOREIGN KEY ("fk_boarding_point") REFERENCES "point"("pk_point") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "passenger" ADD CONSTRAINT "passenger_destiny" FOREIGN KEY ("fk_destiny_point") REFERENCES "point"("pk_point") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "passenger" ADD CONSTRAINT "passenger_dropoff" FOREIGN KEY ("fk_dropoff_point") REFERENCES "point"("pk_point") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "passenger" ADD CONSTRAINT "passenger_line" FOREIGN KEY ("fk_line") REFERENCES "line"("pk_line") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "passenger" ADD CONSTRAINT "passenger_user" FOREIGN KEY ("fk_user") REFERENCES "user"("pk_user") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "passenger_checkin" ADD CONSTRAINT "passenger_checkin" FOREIGN KEY ("fk_passenger") REFERENCES "passenger"("pk_passenger") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "passenger_checkin" ADD CONSTRAINT "passenger_checkin_line" FOREIGN KEY ("fk_line") REFERENCES "line"("pk_line") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "passenger_document" ADD CONSTRAINT "passenger_document" FOREIGN KEY ("fk_passenger") REFERENCES "passenger"("pk_passenger") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "point" ADD CONSTRAINT "line_point" FOREIGN KEY ("fk_line") REFERENCES "line"("pk_line") ON DELETE NO ACTION ON UPDATE NO ACTION;
