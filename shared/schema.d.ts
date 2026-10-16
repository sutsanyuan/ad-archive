import type { Archive, Entry, Issue, Kind } from '../src/types'

export declare const KINDS: Kind[]
export declare function parseYouTubeId(input: unknown): string | null
export declare function cleanUrl(input: unknown): string | null
export declare function slugify(...parts: string[]): string
export declare function normalizeEntry(input: unknown): { entry: Entry; errors: string[] }
export declare function validateArchive(archive: unknown): string[]
export declare function upsertEntry(archive: Archive, issueDate: string, entry: Entry): Archive
export declare function uniqueId(archive: Archive, base: string): string
export declare function deleteEntry(archive: Archive, id: string): Archive | null
export declare function findEntry(archive: Archive, id: string): { issue: Issue; entry: Entry } | null
