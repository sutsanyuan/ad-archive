export type Kind = 'campaign' | 'packaging' | 'web' | 'article' | 'social'

export interface LinkRef {
  label: string
  url: string
}

export interface Entry {
  id: string
  brand: string
  title: string
  kind: Kind
  tags: string[]
  /** 'claude' 表示由 Claude 每月挑選；沒有這個欄位就是 Tsan 自己分享的 */
  by?: 'claude'
  /** Tsan 自己的觀點；空字串代表還沒寫 */
  note: string
  /** 背景資料、做法與數據 */
  detail?: string
  /** Claude 推薦的理由，可以怎麼接上之前分享過的東西 */
  why?: string
  agency?: string
  market?: string
  /** 縮圖網址，直接引用外部圖片（og:image 或網站截圖） */
  image?: string
  /** YouTube 影片 ID（11 碼），有的話以影片取代縮圖 */
  youtube?: string
  links: LinkRef[]
}

export interface Issue {
  id: string
  /** YYYY-MM-DD */
  date: string
  links?: LinkRef[]
  entries: Entry[]
}

export interface Archive {
  source: string
  issues: Issue[]
}

export const KIND_LABEL: Record<Kind, string> = {
  campaign: '廣告活動',
  packaging: '包裝與物件',
  web: '網站',
  article: '文章',
  social: '社群',
}
