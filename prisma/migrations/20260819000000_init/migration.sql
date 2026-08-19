-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

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
CREATE INDEX "item_requests_extension_idx" ON "public"."item_requests"("extension");

-- CreateIndex
CREATE INDEX "item_requests_department_idx" ON "public"."item_requests"("department");

-- CreateIndex
CREATE INDEX "item_requests_created_at_idx" ON "public"."item_requests"("created_at");

