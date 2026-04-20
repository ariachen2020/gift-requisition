-- CreateTable
CREATE TABLE IF NOT EXISTS "items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "item_requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "extension" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "item_requests_extension_idx" ON "item_requests"("extension");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "item_requests_department_idx" ON "item_requests"("department");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "item_requests_created_at_idx" ON "item_requests"("created_at");
