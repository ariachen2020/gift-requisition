# 禮品領用系統（gift-requisition）

Next.js 14 + Prisma + PostgreSQL，公司內部系統。注意：meetingroom 專案裡也有一套舊版禮品功能，兩套同時使用中，互不相干——改這套就只動這個資料夾。

## 部署（2026-10-17 起在 Railway，Zeabur 已停運遷出）

- 正式網址：https://bbgift.up.railway.app
- 部署方式：push 到 GitHub main 分支即自動部署（Railway 專案 gift-requisition，帳號 airblue2002@gmail.com）
- 舊的 Zeabur 網址（bbgift.zeabur.app）只營運到正式切換日，Zeabur 平台 2026 年底全面關閉，不要再部署到那邊
- Next.js 版本需 >= 14.2.35（Railway 安檢會擋有漏洞的舊版）

## 資料庫、圖片與備份

- 正式資料庫是 Railway Postgres（連線資訊在 Railway 後台，或 /Users/aria/railway-backups/databases.env）
- 商品圖片存在 Railway volume（/app/data/uploads），不在 git 裡；進容器用 railway ssh -i ~/.ssh/railway_ed25519
- 備份雙保險：Railway PITR 連續備份（已啟用）＋ 本機每週自動備份（launchd，存 /Users/aria/railway-backups/gift-requisition/）
- backups/ 資料夾是本機備份，已被 .gitignore 排除，內含機密連線資訊，絕不能 commit
- 改動資料庫前先確認最近一次備份存在，並主動告知備份狀態

## 其他

- 遷移細節與切換待辦記錄在 meetingroom 專案的對話記憶與本專案 CHANGELOG.md
