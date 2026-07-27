# 營隊計分平台（Camp Score Platform)

依照需求討論產出的完整可運作網站架構：Next.js 14（App Router + TypeScript）+ Prisma + SQLite + Tailwind CSS。


## 本機執行方式

```bash
# 1. 安裝套件
npm install

# 2. 產生 Prisma Client（需要網路連線下載引擎檔案，這是 Prisma 的標準流程）
npm run db:generate

# 3. 建立資料庫（本機用 SQLite，檔案會生成在 prisma/dev.db）
npm run db:migrate

# 4. 建立管理員帳號、六個小隊、預設按鈕
npm run seed

# 5. 啟動開發伺服器
npm run dev
```

打開 http://localhost:3000 就會看到公開排行榜；右上角「登入」進入後台，
用上面的管理員帳號登入即可開始使用。

## 部署到正式環境（讓其他人能用網址連進來）

這個專案是標準 Next.js 全端專案，可以直接部署到：

### 方案 A：Vercel（最簡單）
1. 把整個專案上傳到 GitHub
2. 到 [vercel.com](https://vercel.com) 用「Import Project」匯入這個 repo
3. 在 Vercel 專案設定的 Environment Variables 加入：
   - `DATABASE_URL`：建議改用 Vercel Postgres 或 Supabase 提供的 Postgres 連線字串（SQLite 檔案在 Vercel 的無伺服器環境中不會持久保存）
   - `JWT_SECRET`：換成一串隨機字串
4. 把 `prisma/schema.prisma` 裡 `datasource db` 的 `provider` 從 `sqlite` 改成 `postgresql`
5. 部署後，在 Vercel 專案的 Deployment 裡執行一次 `npx prisma migrate deploy` 與 `npm run seed`（或用 Vercel 的 CLI / Postgres 主控台跑一次）

### 方案 B：Railway / Render
這兩個平台都支援「一鍵部署 Node.js 專案＋內建 Postgres 資料庫」，步驟大同小異：
連接 GitHub repo → 新增一個 Postgres 服務 → 把它的連線字串填入 `DATABASE_URL` → 部署。

> 為什麼建議正式環境用 Postgres 而不是 SQLite？
> SQLite 是存在單一檔案裡的資料庫，在大部分「無伺服器（serverless）」的雲端平台上，
> 檔案系統不會被永久保留，重新部署或閒置一段時間後檔案可能被清空。
> Postgres 是獨立運作的資料庫服務，資料會持續保存，符合您「關掉重開都要看到資料」的需求。
> 本機測試或您自己有一台一直開著的伺服器（VPS）時，SQLite 也可以直接長期使用。

## 目前已完整實作的功能

- 帳號系統：多重身分勾選（管理員／老師／實驗助理隊輔／值星官／總值星），密碼 bcrypt 加密
- 帳號管理：後台手動新增＋Excel批次上傳（姓名、帳號、密碼、各身分1/0欄位）
- 學生／小隊管理：後台手動新增、修改小隊、刪除＋Excel批次上傳（姓名、小隊代號）
- 六個小隊（A1/A2/A3/B4/B5/B6）已套用您提供的正式角色SVG圖示與代表色
- 計分機制：個人勾選／全班／小組（GROUP）三種模式，共用一套按鈕設定
- 管理員專屬：任意數值輸入加扣分、按鈕新增/刪除/調整（全帳號同步）
- 多重身分執行前的「選擇執行身分」彈窗（依規格：留紀錄的操作前必須選擇身分）
- 加扣分紀錄：查看、復原（依身分權限限制範圍）、刪除（僅管理員）
- 公開排行榜：免登入、姓名自動遮蔽（保留首尾字）、每 2.5 秒輪詢達到即時同步效果、前三名放大+小隊底色
- 視覺規範：背景 #FAFAFA、主色 #ff5f8a / #ffe436、文字色 #03030d、思源黑體、圓角設計、Material Symbols 圖示、無emoji

## 還可以再迭代加強的部分（架構已預留擴充空間）

- 加分/扣分時角色頭像的旋轉／垂頭喪氣動作動畫（目前已有星星/彩帶噴射與紅色漸層跳出框，角色動作可在 `SquadAvatar.tsx` 加上 CSS class 觸發）
- 管理員「暫時停權」目前是整體開關，可再擴充成逐項權限停用
- 排行榜可再換成 WebSocket / Server-Sent Events 做到真正推播（目前是輪詢，體感已接近即時）
- 帳號登入為系統帳號＋密碼；如需要用真實姓名或Email登入可再調整

## 專案結構

```
src/
  app/
    page.tsx              公開排行榜首頁
    login/page.tsx         登入頁
    dashboard/             後台（需登入）
      page.tsx              計分操作主頁
      students/page.tsx     學生／小隊管理
      accounts/page.tsx     帳號管理（管理員）
      buttons/page.tsx      按鈕設定（管理員）
      logs/page.tsx         加扣分紀錄
    api/                   所有後端 API Route Handlers
  components/               共用元件（頭像、彈窗、動畫提示）
  lib/                      認證、權限規則、姓名遮蔽、資料庫連線
prisma/
  schema.prisma             資料庫架構
  seed.ts                   初始資料（管理員帳號、小隊、按鈕）
public/icons/                六個小隊角色SVG素材
```
