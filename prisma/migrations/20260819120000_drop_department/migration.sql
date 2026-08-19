-- 系統為單一部門內使用，移除領取部門欄位
DROP INDEX IF EXISTS "public"."item_requests_department_idx";
ALTER TABLE "public"."item_requests" DROP COLUMN IF EXISTS "department";
