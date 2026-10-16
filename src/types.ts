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
  /** 我自己的觀點：為什麼覺得有趣 */
  note: string
  /** 背景資料、數據 */
  detail?: string
  /** 縮圖網址，直接引用外部圖片（og:image、YouTube 縮圖或網站截圖） */
  image?: string
  /** YouTube 影片 ID（11 碼），有的話以影片取代縮圖 */
  youtube?: string
  links: LinkRef[]
}

export interface Issue {
  id: string
  /** YYYY-MM-DD，月會日期 */
  date: string
  links?: LinkRef[]
  entries: Entry[]
}

export interface Archive {
  source: string
  issues: Issue[]
}

export interface Pick extends Entry {
  agency?: string
  market?: string
  /** Claude 推薦的理由 / 可以怎麼接上之前分享過的東西 */
  why: string
}

export interface Picks {
  month: string
  generatedAt: string
  picks: Pick[]
}

export const KIND_LABEL: Record<Kind, string> = {
  campaign: '廣告活動',
  packaging: '包裝與物件',
  web: '網站',
  article: '文章',
  social: '社群',
}
