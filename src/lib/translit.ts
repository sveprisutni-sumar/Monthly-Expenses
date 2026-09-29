const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'đ', е: 'e', ж: 'ž', з: 'z', и: 'i', ј: 'j',
  к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  ћ: 'ć', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'č', џ: 'dž', ш: 'š',
};

/** Serbian Cyrillic → Latin. Latin text passes through unchanged. */
export function toLatin(text: string): string {
  return text.replace(/[Ѐ-ӿ]/g, (ch) => {
    const lower = ch.toLowerCase();
    const latin = MAP[lower];
    if (latin === undefined) return ch;
    if (ch === lower) return latin;
    // Uppercase: "Љ" → "Lj"; inside all-caps words it becomes "LJ" via the neighbour check below.
    return latin.charAt(0).toUpperCase() + latin.slice(1);
  }).replace(/(Lj|Nj|Dž)(?=[A-ZČĆŽŠĐ])/g, (m) => m.toUpperCase());
}
