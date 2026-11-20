/**
 * Pure-TS parser for user-selected JSON live channel lists. Accepts an
 * array or an object carrying the array under a common key, and handles
 * common field aliases without a host dependency.
 */
import type { PlaylistEntry } from "./playlist";

const CONTAINER_KEYS = ["channels", "data", "list", "result", "items", "streams"] as const;
const TITLE_KEYS = ["name", "title", "channel_name", "channel", "tv_name"] as const;
const URL_KEYS = ["source", "url", "stream", "link", "stream_url"] as const;
const GROUP_KEYS = ["group", "country", "menu_name", "group_title", "category", "genre"] as const;

const MAX_CHANNELS = 2000;

function firstString(obj: Record<string, unknown>, keys: readonly string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function isTruthy(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true";
}

/** Returns null for invalid JSON or a list with no playable live entries. */
export function parseFeedText(text: string): PlaylistEntry[] | null {
  let data: unknown;
  try {
    data = JSON.parse(text.trimStart());
  } catch {
    return null;
  }

  let arr: unknown[] = [];
  if (Array.isArray(data)) {
    arr = data;
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of CONTAINER_KEYS) {
      if (Array.isArray(obj[key])) {
        arr = obj[key] as unknown[];
        break;
      }
    }
  }
  if (arr.length === 0) return null;

  const out: PlaylistEntry[] = [];
  const seen = new Set<string>();
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (isTruthy(o.is_movie)) continue; // live lineup only
    const title = firstString(o, TITLE_KEYS);
    const url = firstString(o, URL_KEYS);
    if (!title || !url) continue;
    const key = title.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (key && seen.has(key)) continue; // de-dupe by normalized title
    if (key) seen.add(key);
    const group = firstString(o, GROUP_KEYS);
    out.push({ title, url, group, tvgName: null, tvgLogo: null });
    if (out.length >= MAX_CHANNELS) break;
  }
  return out.length > 0 ? out : null;
}
