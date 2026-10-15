# 有趣廣告收藏夾

我每個月在團隊月會分享的有趣廣告，整理成一個可以搜尋、篩選的網站。

- **歷次分享**：按月會日期分期，每則有我當時的觀點、背景數據和原始連結。
- **本月候選**：每月由 Claude 自動從 AdForum、Campaigns of the World、System1 等來源挑出 5 則近期作品，作為下次月會的素材。

## 技術

- React 19 + TypeScript + Vite
- 資料放在 `src/data/*.json`，網站在建置時直接引入，不需要後端
- 部署：Vercel（push 到 `main` 自動部署）

```bash
npm install
npm run dev          # 本機開發
npm run check-data   # 驗證資料格式
npm run build        # 建置
```

## 自動更新

每月由 Claude Code 排程執行 `/monthly-update`（見 `.claude/commands/monthly-update.md`）：

1. 讀取月會 Google 簡報，把新的分享轉成 `ads.json`
2. 搜尋近期廣告作品，覆寫 `picks.json`
3. 驗證資料後 commit 並 push，Vercel 自動上線
