-- 新增管理員商品異動紀錄表（純新增表格，不動現有資料）
CREATE TABLE "public"."item_logs" (
    "id" SERIAL NOT NULL,
    "extension" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "item_id" INTEGER,
    "item_name" TEXT NOT NULL,
    "category" TEXT,
    "quantity_from" INTEGER,
    "quantity_to" INTEGER,
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_logs_created_at_idx" ON "public"."item_logs"("created_at");

-- CreateIndex
CREATE INDEX "item_logs_item_id_idx" ON "public"."item_logs"("item_id");
