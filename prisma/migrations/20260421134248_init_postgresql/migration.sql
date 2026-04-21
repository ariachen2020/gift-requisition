-- CreateTable
CREATE TABLE "public"."bookings" (
    "id" SERIAL NOT NULL,
    "room_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time_slot" TEXT NOT NULL,
    "title" TEXT,
    "booker" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 1,
    "recurring_group_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."items" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."item_requests" (
    "id" SERIAL NOT NULL,
    "extension" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookings_room_id_date_idx" ON "public"."bookings"("room_id", "date");

-- CreateIndex
CREATE INDEX "bookings_room_id_date_time_slot_idx" ON "public"."bookings"("room_id", "date", "time_slot");

-- CreateIndex
CREATE INDEX "bookings_room_id_date_time_slot_order_index_idx" ON "public"."bookings"("room_id", "date", "time_slot", "order_index");

-- CreateIndex
CREATE INDEX "bookings_recurring_group_id_idx" ON "public"."bookings"("recurring_group_id");

-- CreateIndex
CREATE INDEX "item_requests_extension_idx" ON "public"."item_requests"("extension");

-- CreateIndex
CREATE INDEX "item_requests_department_idx" ON "public"."item_requests"("department");

-- CreateIndex
CREATE INDEX "item_requests_created_at_idx" ON "public"."item_requests"("created_at");
