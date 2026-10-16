// 檢查 src/data/ads.json 的格式，規則在 shared/schema.js。
// 每月更新後、commit 前執行：npm run check-data
import { readFileSync } from 'node:fs'
import { validateArchive } from '../shared/schema.js'

const archive = JSON.parse(readFileSync(new URL('../src/data/ads.json', import.meta.url), 'utf8'))
const errors = validateArchive(archive)

if (errors.length) {
  console.error(`資料有 ${errors.length} 個問題：\n- ` + errors.join('\n- '))
  process.exit(1)
}
const all = archive.issues.flatMap((i) => i.entries)
const byClaude = all.filter((e) => e.by === 'claude').length
console.log(`OK：${archive.issues.length} 期、${all.length} 則（Claude 挑選 ${byClaude} 則）`)
