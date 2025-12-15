import bl from "./blacklist.json" with { type: "json" };
import wl from "./whitelist.json" with { type: "json" };

export const blacklist = new Set<string>(bl.id.concat(bl.en));
export const whitelist = new Set<string>(wl.id.concat(wl.en));

export function addBlacklist(words: string | string[]) {
    if (!Array.isArray(words)) words = [words];
    words.forEach(w => blacklist.add(w));
}

export function removeBlacklist(words: string | string[]) {
    if (!Array.isArray(words)) words = [words];
    words.forEach(w => blacklist.delete(w));
}

export function overrideBlacklist(words: string | string[]) {
    blacklist.clear();
    (Array.isArray(words) ? words : [words]).forEach(w => blacklist.add(w));
}

export function addWhitelist(words: string | string[]) {
    if (!Array.isArray(words)) words = [words];
    words.forEach(w => whitelist.add(w));
}

export function removeWhitelist(words: string | string[]) {
    if (!Array.isArray(words)) words = [words];
    words.forEach(w => whitelist.delete(w));
}

export function overrideWhitelist(words: string | string[]) {
    whitelist.clear();
    (Array.isArray(words) ? words : [words]).forEach(w => whitelist.add(w));
}
