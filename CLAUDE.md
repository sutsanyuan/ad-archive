# 有趣廣告收藏夾

Tsan 每個月在團隊月會分享有趣廣告，這個 React + Vite 網站把歷次分享整理成可搜尋的收藏，並附上 Claude 每月整理的候選清單。部署在 Vercel，push 到 `main` 就會自動上線。

每月更新的流程寫在 `.claude/commands/monthly-update.md`（`/monthly-update`）。

## 結構

- `src/data/ads.json`：歷次分享，`issues` 由新到舊，每期 `id` = `date`（`YYYY-MM-DD`，月會日期）。
- `src/data/picks.json`：當月候選，每月整份覆寫。
- `src/types.ts`：資料型別，改資料格式時一併更新。
- `scripts/check-data.mjs`：資料驗證，`npm run check-data`。

## Entry 格式

```json
{
  "id": "brand-short-title",          // 小寫英數與 -，全站唯一
  "brand": "KitKat",
  "title": "The KitKat Heist",
  "kind": "campaign",                 // campaign | packaging | web | article | social
  "tags": ["危機變轉機", "互動遊戲"], // 2–4 個，中文為主，專有名詞可用英文
  "note": "作者自己的觀點",            // 只放 Tsan 寫的話；沒有就空字串
  "detail": "背景與數據（選填）",       // 用自己的話寫，不照抄來源
  "links": [{ "label": "Nestlé 新聞稿", "url": "https://..." }]
}
```

候選（picks）多了 `agency`、`market`（選填，查不到就省略）和 `why`（必填）。

## 寫作規則

- 一律繁體中文、台灣用語，全形標點。品牌名、作品名保留原文。
- `note` 是作者的聲音，同步時照抄簡報上的中文評論，不要潤飾。
- `detail` 和 `why` 用平實的說明句，講具體做法和數字，不寫「令人驚艷」這類形容詞。
- 不可大段複製外部文章；引用原文最多一句、少於 15 字。
- 連結只放原始網址，去除追蹤參數。

## 選片口味（挑候選時參考）

從歷次分享看得出偏好：

- 機制巧妙的點子勝過純粹漂亮的影片：KitKat Heist 把竊案變成查批號遊戲、KitKat 斷網包裝。
- 品牌和社群／真實使用者共創：Vaseline Originals、Dove r/eal Reviews、UTS 學生內容。
- 名人用法有反差：De'Longhi × Brad Pitt、LEGO 足球巨星「是不是 AI」。
- 也會收網站、活動頁設計和社群短影音（Duolingo）。
- 偏好近期、有具體成果數字的案例；避免政治廣告。
