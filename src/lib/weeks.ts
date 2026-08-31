import { getCollection, type CollectionEntry } from 'astro:content';

export type WeekEntry = CollectionEntry<'weeks'>;

export interface MonthGroup {
  key: string;         // "2026-08"
  label: string;       // "2026 年 8 月"
  entries: WeekEntry[];
}

/** Return published weeks, newest first. */
export async function getWeeks(): Promise<WeekEntry[]> {
  const entries = await getCollection('weeks', ({ data }) => !data.draft);
  return entries.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Group weeks by year-month, newest month first. */
export function groupByMonth(entries: WeekEntry[]): MonthGroup[] {
  const map = new Map<string, WeekEntry[]>();
  for (const e of entries) {
    const d = e.data.date;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  }
  const groups: MonthGroup[] = Array.from(map.entries()).map(([key, list]) => {
    const [y, m] = key.split('-');
    return {
      key,
      label: `${y} 年 ${Number(m)} 月`,
      entries: list.sort((a, b) => b.data.date.getTime() - a.data.date.getTime()),
    };
  });
  return groups.sort((a, b) => (a.key < b.key ? 1 : -1));
}

/** Build the URL for a week entry. */
export function weekHref(entry: WeekEntry, base: string): string {
  const slug = entry.id.replace(/\.mdx?$/, '');
  return `${base}weeks/${slug}/`;
}
