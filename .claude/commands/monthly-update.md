---
description: 每月同步月會簡報到網站，並整理下個月的候選廣告
---

# 每月更新

這個指令做兩件事：(A) 把 Google 簡報裡新的月會分享同步進 `src/data/ads.json`；(B) 重新整理 `src/data/picks.json` 的候選清單。最後驗證、commit、push，Vercel 會自動部署。

先讀 `CLAUDE.md` 了解資料格式與寫作規則。

## A. 同步簡報

1. 用 WebFetch 讀簡報的 HTML 版：
   `https://docs.google.com/presentation/d/14acsOEM59zCAKZ5o9wHiNcw_E5eMd_PMrWcRDndEyq4/htmlpresent`
   請它逐頁列出所有文字與連結，不要摘要。
2. 簡報由新到舊排列，每一期以一張「日期頁」開頭（例如 `0911更新`、`20260612`）。把日期換算成 `YYYY-MM-DD`；沒寫年份時，取「不晚於今天」的最近年份。
3. `ads.json` 裡已經有的期數（以 `date` 判斷）跳過；已有的期數若新增了廣告，只補上新的那幾則，用 brand + title 比對避免重複。
4. 每則新廣告轉成一筆 entry（格式見 `CLAUDE.md`）：
   - 簡報上作者自己寫的中文評論 → 原文放進 `note`，不改寫。
   - 從外部來源貼過來的英文介紹、新聞稿段落 → 用自己的話改寫成中文放進 `detail`，不可整段照抄。
   - 沒有評論的就讓 `note` 為空字串。
   - 連結去掉 `utm_`、`__cf_chl`、`fbclid` 等追蹤參數，Google 轉址（`google.com/url?q=`）要還原成原始網址。
   - 同一個廣告在簡報佔多頁（例如多張截圖）時合併成一筆。
   - 無法判斷屬於哪則廣告的零散連結，放在該期的 `links`。
5. 新期數插在 `issues` 陣列最前面（由新到舊）。
6. 簡報讀不到（權限、頁面錯誤）時，不要猜內容；略過 A，在最後的回報中說明。

## B. 整理候選

1. 若 `picks.json` 裡有候選已經出現在 `ads.json`（使用者挑去分享了），從候選移除。
2. 搜尋最近約 30 天發表的廣告作品，來源至少看這幾個，彼此並行搜尋：
   - AdForum Top 5（https://www.adforum.com/top5/worldwide）
   - Campaigns of the World（https://campaignsoftheworld.com/）
   - System1 Ad of the Week（https://system1group.com/aotw）
   - Ad Age Creativity、動腦 brain.com.tw
3. 挑 5 則，標準參考 `CLAUDE.md` 的「選片口味」。每一則都要 WebFetch 原始文章確認品牌、代理商、市場與具體做法，查不到的欄位就留空，不要編。
4. 不要挑 `ads.json` 已經有的。
5. `why` 寫一兩句：為什麼值得在月會分享，能接上之前哪一則就點名。
6. 覆寫 `picks.json`：`month` 為本月 `YYYY-MM`，`generatedAt` 為今天。

## C. 驗證與發佈

1. `npm run check-data`，有錯就修到通過。
2. 若可以安裝套件，再跑 `npm install && npm run build` 確認能建置。
3. 有變更才 commit，訊息格式：`data: YYYY-MM 月同步（新增 N 則、候選 5 則）`，push 到 `main`。
4. 最後回報：新增了哪幾期、哪幾則，以及這個月的 5 則候選（品牌 + 一句話），讓使用者可以直接拿去準備月會。
