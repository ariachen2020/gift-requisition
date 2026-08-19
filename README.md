# 公務禮品領用系統

從會議室預約系統獨立出來的公務禮品領用系統，提供禮品瀏覽、領用單填寫、庫存管理與自動備份功能。

## 功能

- 前台（/inventory）：輸入分機號碼後瀏覽禮品、加入清單、送出領用單
- 後台（/admin/inventory）：管理員管理品項、庫存數量、商品照片，並可下載領用紀錄
- 備份管理（/admin/backups）：管理員檢視、手動建立、下載、刪除資料庫備份（系統每 12 小時自動備份一次）

## 權限

分機白名單設定在 src/config/allowed-extensions.ts（共 7 個分機）。
管理員分機設定在 src/config/admin-extensions.ts（8548）。
要增減人員時，直接修改這兩個檔案後重新部署即可。

## 技術架構

- Next.js 14（App Router）+ TypeScript + Tailwind CSS
- Prisma + PostgreSQL
- 部署於 Zeabur（Dockerfile），商品照片存在 volume（/app/data/uploads），備份存在 volume（/app/backups）

## 本機開發

1. 複製 .env.example 為 .env，填入本機 PostgreSQL 連線字串
2. npm install
3. npm run db:push（建立資料表）
4. npm run dev

## 部署（Zeabur）

1. 推送到 GitHub repo
2. 在 Zeabur 建立新專案，加入 PostgreSQL 服務
3. 加入此 repo 為服務，設定環境變數 DATABASE_URL 指向該 PostgreSQL
4. 掛載 volume：/app/data/uploads（照片）與 /app/backups（備份）
