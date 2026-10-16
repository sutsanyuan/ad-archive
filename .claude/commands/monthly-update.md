---
description: 每月挑 5 則新廣告直接加成新的一期，並同步月會簡報（如果有更新）
---

# 每月更新

這個指令做兩件事：

- (A) 挑選本月 5 則廣告，在 `src/data/ads.json` 最前面新增一期，每則標 `"by": "claude"`。
- (B) 如果 Google 簡報有新內容，把它同步進來。

做完後驗證、commit、push，Vercel 會自動部署。

開始前先讀 `CLAUDE.md`，了解資料格式與寫作規則。Tsan 也會從網站上直接編輯（commit 訊息以 `edit:` 開頭），所以一定要先 `git pull`，並且遵守以下幾點：

- 不改動、不刪除任何現有的 entry。
- 不覆蓋 Tsan 寫的 `note`。
- 不把被 Tsan 刪掉的廣告加回來。用 `git log -p -- src/data/ads.json` 查最近的 `edit: 刪除` commit。

## A. 本月 5 則

1. 搜尋最近約 30 天發表的廣告作品。以下幾個來源都要看，搜尋要並行發出：
   - AdForum Top 5（https://www.adforum.com/top5/worldwide）
   - Campaigns of the World（https://campaignsoftheworld.com/）
   - System1 Ad of the Week（https://system1group.com/aotw）
   - Ad Age Creativity、動腦 brain.com.tw
2. 挑 5 則，標準參考 `CLAUDE.md` 的「選片口味」。
   - 每一則都要 WebFetch 原始文章，確認品牌、代理商、市場和具體做法。查不到的欄位直接省略，不要自己編。
   - WebFetch 時順便逐字複製 og:image 和內嵌的 YouTube 網址。
3. 不要挑 `ads.json` 裡已經有的（用品牌 + 作品名稱比對），也不要挑之前被刪掉的。
4. 每則的欄位：
   - `by: "claude"`
   - `note: ""`：留給 Tsan 寫
   - `detail`：這支廣告具體怎麼做、有什麼數字
   - `why`：一兩句話說明為什麼值得在月會分享，能接上之前哪一則就點名
   - 依 `CLAUDE.md` 的「影片」與「縮圖」規則附上 `youtube` 或 `image`
5. 新增一期：`id` 和 `date` 都設為今天（`YYYY-MM-DD`），插在 `issues` 陣列最前面。如果今天已經有一期（例如重跑），就把新的幾則加進那一期，不要另開一期。

## B. 同步簡報（有更新才做）

1. 用 WebFetch 讀簡報的 HTML 版：
   `https://docs.google.com/presentation/d/14acsOEM59zCAKZ5o9wHiNcw_E5eMd_PMrWcRDndEyq4/htmlpresent`
   請它逐頁列出所有文字與連結，不要摘要。
2. 簡報由新到舊排列，每一期開頭是一張「日期頁」（例如 `0911更新`、`20260612`）。把日期換算成 `YYYY-MM-DD`；沒寫年份時，取不晚於今天的最近年份。
3. `ads.json` 裡已經有的期數（以 `date` 判斷）就跳過。如果已有的期數在簡報上新增了廣告，只補上新的那幾則，用品牌 + 作品名稱比對避免重複。
4. 每則新廣告轉成一筆 entry（不加 `by`，因為這是 Tsan 自己分享的）：
   - 簡報上作者自己寫的中文評論：原文放進 `note`，不改寫。
   - 從外部來源貼過來的英文介紹、新聞稿段落：用自己的話改寫成中文，放進 `detail`，不可整段照抄。
   - 連結要去掉追蹤參數；Google 轉址（`google.com/url?q=`）要還原成原始網址。
   - 同一個廣告在簡報上佔了好幾頁，合併成一筆。
   - 依「影片」與「縮圖」規則找 `youtube` 或 `image`。簡報上沒附連結的廣告，先搜尋一篇可靠的報導加進 `links`。
5. 簡報讀不到，或沒有新內容，就跳過 B，在最後回報時說明。

## C. 驗證與發佈

1. 執行 `npm run check-data`，有錯就修到通過。
2. 如果可以安裝套件，再執行 `npm install && npm run build`，確認能建置。
3. 有變更才 commit，訊息格式：`data: YYYY-MM 月更新（Claude 挑選 5 則[、簡報新增 N 則]）`，push 到 `main`。push 被拒絕時，先 `git pull --rebase` 再試。
4. 最後用繁體中文回報本月 5 則：每則寫品牌加一句話。簡報有同步的話，也列出新增了哪幾則。讓 Tsan 可以直接拿去準備月會。
