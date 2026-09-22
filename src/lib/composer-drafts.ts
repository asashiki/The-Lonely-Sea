/** Unsubmitted text stays on this device, isolated by article/game context. */
const KEY = "lonely-sea:composer-drafts:v1";
type Draft = Record<string, string>;
function readAll(): Record<string, Draft> {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}
export function readComposerDraft(key: string): Draft {
  const value = readAll()[key];
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}
export function writeComposerDraft(key: string, value: Draft): boolean {
  try {
    const all = readAll();
    delete all[key];
    if (Object.values(value).some((text) => text.trim())) {
      all[key] = Object.fromEntries(Object.entries(value).map(([name, text]) => [name, text.slice(0, 1000)]));
    }
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(Object.entries(all).slice(-30))));
    return true;
  } catch { return false; }
}
