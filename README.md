# 有趣廣告收藏夾

我每個月在團隊月會分享的有趣廣告，整理成一個可以搜尋、篩選的網站。

- 依日期分期，每則有縮圖或可直接播放的 YouTube 影片、我的觀點、背景數據和原始連結。
- 每月由 Claude 自動挑 5 則近期作品，新增成一期，標「Claude 挑選」。
- 我登入後可以直接在網站上新增、編輯或刪除，修改會自動 commit 回這個 repo。

## 技術

- React 19 + TypeScript + Vite
- 資料是 `src/data/ads.json`，建置時打包進網站，不需要資料庫
- Vercel serverless functions（`api/`）處理登入，並透過 GitHub Contents API 寫回資料；每次修改都是一個 commit，Vercel 收到後自動重新部署
- 登入用 HMAC 簽章的 HttpOnly cookie；寫入的 API 會檢查 Origin、驗證所有欄位
- 前端、API 和資料檢查共用 `shared/schema.js` 的驗證規則

```bash
npm install
npm run dev          # 本機開發（沒有登入功能）
npx vercel dev       # 本機開發，含 API 與登入
npm run check-data   # 驗證資料格式
npm run build        # 建置
```

## 設定登入

在 Vercel → Settings → Environment Variables 加上：

| 名稱 | 內容 |
| --- | --- |
| `ADMIN_PASSWORD` | 登入密碼，至少 12 個字元 |
| `SESSION_SECRET` | 至少 32 個字元的隨機字串，例如 `openssl rand -base64 48` 的結果 |
| `GITHUB_TOKEN` | Fine-grained personal access token，只開放這個 repo 的 Contents: Read and write |

## 自動更新

每月由 Claude 排程執行 `/monthly-update`（見 `.claude/commands/monthly-update.md`），挑選 5 則廣告新增成一期，驗證後 push，Vercel 自動上線。
