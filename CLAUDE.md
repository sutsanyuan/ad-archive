# 有趣廣告收藏夾

Tsan 每個月在團隊月會分享有趣廣告，這個 React + Vite 網站把歷次分享整理成可以搜尋的收藏。

- Claude 每月挑 5 則，直接新增成一期，標「Claude 挑選」。
- Tsan 可以登入網站新增、編輯或刪除。
- 部署在 Vercel，push 到 `main` 就會自動上線。

每月更新的流程寫在 `.claude/commands/monthly-update.md`（`/monthly-update`）。

## 結構

- `src/data/ads.json`：所有資料。`issues` 由新到舊排列，每期的 `id` = `date`（`YYYY-MM-DD`）。
- `shared/schema.js`：資料格式與驗證規則，前端表單、API 和 `npm run check-data` 共用這一份。改格式時這裡、`shared/schema.d.ts`、`src/types.ts` 要一起改。
- `api/`：Vercel serverless functions，負責登入和網站編輯，把修改 commit 回 GitHub。
- `src/`：React 前端。

## Entry 格式

```json
{
  "id": "brand-short-title",          // 小寫英數與 -，全站唯一
  "brand": "KitKat",
  "title": "The KitKat Heist",
  "kind": "campaign",                 // campaign | packaging | web | article | social
  "tags": ["危機變轉機", "互動遊戲"], // 2–4 個，中文為主，專有名詞可用英文
  "by": "claude",                     // 只有 Claude 挑的才加；Tsan 自己分享的不加
  "note": "",                         // 只放 Tsan 寫的話；Claude 一律留空字串
  "detail": "背景與數據",              // 用自己的話寫，不照抄來源
  "why": "為什麼值得分享",              // by 為 claude 時必填
  "agency": "VML UK",                 // 選填，查不到就省略
  "market": "英國",                    // 選填
  "image": "https://...",             // 縮圖（選填），規則見下
  "youtube": "FT0-4wSIMj0",           // YouTube 影片 ID（選填），有的話網站會內嵌播放並取代 image
  "links": [{ "label": "Nestlé 新聞稿", "url": "https://..." }]
}
```

網站顯示時，有 `note` 就顯示 Tsan 的觀點；Claude 挑的還沒寫觀點時，改顯示 `detail`。

### 影片（`youtube`）

網站會先顯示影片縮圖，點了才載入 YouTube 播放器。每則都先用 WebSearch（`allowed_domains: ["youtube.com"]`）找影片，只收以下兩種：

- 品牌或代理商發布的正式廣告片。
- 參賽用的案例影片（標題常見「(Case Study)」）。

新聞台報導、反應影片、教學影片或標題對不上的影片都不收。拿不準就不填，改用 `image`。欄位只填 11 碼 ID，不填完整網址。

### 縮圖（`image`）

沒有 `youtube` 時才會顯示。網站直接引用外部圖片，不下載到 repo。圖片載入失敗時，前端會自動隱藏，所以找不到就省略這個欄位，不要填猜的網址。依序選擇：

1. 來源報導的 `og:image`：WebFetch 時請它「逐字複製 meta og:image」，不可自行組網址。品牌官網、Campaigns of the World、LBB、Ads of the World 通常都有。
2. `kind` 為 `web` 的網站作品：用網站即時截圖 `https://s.wordpress.com/mshots/v1/<URL encode 後的網址>?w=800&h=500`。
3. 以下幾種跳過：站台 logo、通用分享圖（例如 D&AD 的 `social.jpg`）、Instagram／TikTok／Facebook 的 CDN 圖（網址會過期）。

縮圖會連到 `links` 的第一個連結，所以第一個連結要放最主要的來源。

## 網站編輯

- Tsan 登入後的每次修改，都是一個以 `edit:` 開頭的 commit。改資料前先 `git pull`，避免蓋掉這些修改。
- 不要動 Tsan 寫的 `note`，也不要把他刪掉的廣告加回來。
- 登入用的環境變數在 Vercel 上設定：`ADMIN_PASSWORD`、`SESSION_SECRET`、`GITHUB_TOKEN`，可選 `GITHUB_REPO`、`GITHUB_BRANCH`。
- 本機 `npm run dev` 沒有 API，所以網站上不會出現登入入口。要在本機測登入，用 `npx vercel dev`。

## 寫作規則

- 一律繁體中文、台灣用語，全形標點。品牌名、作品名保留原文。
- `note` 是作者的聲音。同步簡報時，照抄簡報上的中文評論，不要潤飾。
- `detail` 和 `why` 用平實的說明句，講具體做法和數字，不寫「令人驚艷」這類形容詞。
- 不可大段複製外部文章；引用原文最多一句、少於 15 字。
- 連結只放原始網址，去除追蹤參數。

## 選片口味（挑選時參考）

從歷次分享看得出這些偏好：

- 機制巧妙的點子，勝過純粹漂亮的影片：KitKat Heist 把竊案變成查批號遊戲、KitKat 斷網包裝。
- 品牌和社群或真實使用者共創：Vaseline Originals、Dove r/eal Reviews、UTS 學生內容。
- 名人用法有反差：De'Longhi × Brad Pitt、LEGO 足球巨星「是不是 AI」。
- 也會收網站、活動頁設計和社群短影音（Duolingo）。
- 偏好近期、有具體成果數字的案例；避免政治廣告。
- 被 Tsan 刪掉的 Claude 挑選，代表不合他的口味，挑選時可以參考 `git log` 裡的 `edit: 刪除` 紀錄。
