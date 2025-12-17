import bl from "./blacklist.json" with { type: "json" };
import wl from "./whitelist.json" with { type: "json" };

type LangMap = Record<string, string[]>;
type RuntimeLangMap = Record<string, Set<string>>;

export const blacklist = new Set<string>();
export const whitelist = new Set<string>();

export const blacklistByLang: RuntimeLangMap = {};
export const whitelistByLang: RuntimeLangMap = {};

function initData(
    json: LangMap | undefined | null,
    globalSet: Set<string>,
    structuredMap: RuntimeLangMap
) {
    if (!json || typeof json !== "object") return;

    for (const lang in json) {
        const words = json[lang];
        if (!Array.isArray(words)) continue;

        if (!structuredMap[lang]) structuredMap[lang] = new Set();

        for (const word of words) {
            globalSet.add(word);
            structuredMap[lang].add(word);
        }
    }
}

initData(bl, blacklist, blacklistByLang);
initData(wl, whitelist, whitelistByLang);

function existsInOtherLangs(word: string, currentLang: string, map: RuntimeLangMap): boolean {
    for (const lang in map) {
        if (lang === currentLang) continue;
        if (map[lang].has(word)) return true;
    }
    return false;
}

function toArray(words: string | string[]): string[] {
    return Array.isArray(words) ? words : [words];
}

export function addBlacklist(words: string | string[], lang: string) {
    const wordArr = toArray(words);

    if (!blacklistByLang[lang]) {
        blacklistByLang[lang] = new Set();
    }

    wordArr.forEach(w => {
        blacklistByLang[lang].add(w);
        blacklist.add(w);
    });
}

export function removeBlacklist(words: string | string[], lang: string) {
    const wordArr = toArray(words);

    if (!blacklistByLang[lang]) return;

    wordArr.forEach(w => {
        const deleted = blacklistByLang[lang].delete(w);

        if (deleted && !existsInOtherLangs(w, lang, blacklistByLang)) {
            blacklist.delete(w);
        }
    });
}

export function overrideBlacklist(words: string | string[], lang: string) {
    const newWords = toArray(words);

    if (!blacklistByLang[lang]) {
        blacklistByLang[lang] = new Set();
    }
    const oldWords = Array.from(blacklistByLang[lang]);

    oldWords.forEach(w => {
        if (!existsInOtherLangs(w, lang, blacklistByLang)) {
            blacklist.delete(w);
        }
    });

    blacklistByLang[lang].clear();
    newWords.forEach(w => {
        blacklistByLang[lang].add(w);
        blacklist.add(w);
    });
}

export function addWhitelist(words: string | string[], lang: string) {
    const wordArr = toArray(words);
    if (!whitelistByLang[lang]) whitelistByLang[lang] = new Set();

    wordArr.forEach(w => {
        whitelistByLang[lang].add(w);
        whitelist.add(w);
    });
}

export function removeWhitelist(words: string | string[], lang: string) {
    const wordArr = toArray(words);
    if (!whitelistByLang[lang]) return;

    wordArr.forEach(w => {
        const deleted = whitelistByLang[lang].delete(w);
        if (deleted && !existsInOtherLangs(w, lang, whitelistByLang)) {
            whitelist.delete(w);
        }
    });
}

export function overrideWhitelist(words: string | string[], lang: string) {
    const newWords = toArray(words);
    if (!whitelistByLang[lang]) whitelistByLang[lang] = new Set();

    const oldWords = Array.from(whitelistByLang[lang]);
    oldWords.forEach(w => {
        if (!existsInOtherLangs(w, lang, whitelistByLang)) {
            whitelist.delete(w);
        }
    });

    whitelistByLang[lang].clear();
    newWords.forEach(w => {
        whitelistByLang[lang].add(w);
        whitelist.add(w);
    });
}