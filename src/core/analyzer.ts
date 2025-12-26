import { blacklist, whitelist } from "../dictionary/index.js";
import { transleet } from "../utils/leet.js";
import { distance } from "./fuzzy.js";

export type AnalyzeOptions = {
    type?: 'username' | 'text';
    threshold?: number;
};

export type AnalyzeData = {
    word: string;
    confidence: 'DOUBT' | 'OPTIMIST';
    matches: string[];
    distance: number;
    category: 'BLACKLIST' | 'WHITELIST';
};

export type AnalyzeResult = {
    original: string;
    filtered: string;
    isProfane: boolean;
    decision: 'CENSOR' | 'ALLOW';
    error?: string;
    data: AnalyzeData[];
};

const MAX_LENGTH = 100;
const MIN_LENGTH = 3;
const ALLOWED_REGEX = /^[\s\S]+$/;

export function analyze(text: string, options: AnalyzeOptions = {}): AnalyzeResult {
    const { threshold = 3 } = options;

    // 1. Validation
    if (!ALLOWED_REGEX.test(text)) {
        return { original: text, filtered: text, isProfane: false, decision: 'ALLOW', data: [], error: 'Invalid characters' };
    }
    if (text.length < MIN_LENGTH || text.length > MAX_LENGTH) {
        return { original: text, filtered: text, isProfane: false, decision: 'ALLOW', data: [], error: 'Invalid length' };
    }

    const data: AnalyzeData[] = [];
    const profaneIndices = new Set<number>();
    const safeIndices = new Set<number>();

    // 2. Normalization & Context Mapping
    const lower = text.toLowerCase();
    const leeted = transleet(lower);

    // Create normalized string (only alphanumeric) and map back to original indices
    let normalized = "";
    const indexMap: number[] = [];

    for (let i = 0; i < leeted.length; i++) {
        const char = leeted[i];
        // Keep only alphanumeric characters for the scan
        if (/[a-z0-9]/.test(char)) {
            normalized += char;
            indexMap.push(i);
        }
    }

    // 3. Scan for Whitelists (Safeguard)
    // We do this first to identify characters that should NOT be masked
    for (const goodword of whitelist) {
        let cursor = 0;
        let foundIndex = normalized.indexOf(goodword, cursor);

        while (foundIndex !== -1) {
            // Mark these indices as safe
            for (let k = 0; k < goodword.length; k++) {
                const originalIndex = indexMap[foundIndex + k];
                safeIndices.add(originalIndex);
            }
            cursor = foundIndex + 1;
            foundIndex = normalized.indexOf(goodword, cursor);
        }
    }

    // 4. Scan for Blacklists (Exact & Substring in Normalized)
    for (const badword of blacklist) {
        let cursor = 0;
        let foundIndex = normalized.indexOf(badword, cursor);

        while (foundIndex !== -1) {
            // Check overlaps with safeIndices
            let isSafe = false;
            const currentIndices: number[] = [];

            for (let k = 0; k < badword.length; k++) {
                const originalIndex = indexMap[foundIndex + k];
                currentIndices.push(originalIndex);
            }

            // A match is only "safe" (whitelisted) if ALL its characters are covered by a whitelist entry.
            // This allows overlap (e.g. "hola s5tt" where "hola" is safe, but "ass" extends out) to still be caught.
            if (currentIndices.every(idx => safeIndices.has(idx))) {
                isSafe = true;
            }

            if (!isSafe) {
                // Record Hit
                data.push({
                    word: badword,
                    matches: [badword],
                    distance: 0,
                    confidence: 'OPTIMIST',
                    category: 'BLACKLIST'
                });

                // Mark indices as profane
                // Rule: Protect the first character of the DETECTED PROFANITY
                // Rule: Protect any character immediately preceded by a SPACE ("if it a space, the first char should be visible")
                for (let k = 0; k < currentIndices.length; k++) {
                    const idx = currentIndices[k];

                    // Always protect the very first character of the match
                    if (k === 0) continue;

                    // Check if preceded by space
                    if (idx > 0 && text[idx - 1] === ' ') {
                        continue;
                    }

                    profaneIndices.add(idx);
                }
            }

            cursor = foundIndex + 1;
            foundIndex = normalized.indexOf(badword, cursor);
        }
    }

    // 5. Token-based Fuzzy Fallback
    const tokenRegex = /\S+/g;
    let match;
    while ((match = tokenRegex.exec(text)) !== null) {
        const token = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + token.length;

        // Check if this token is already "touched" by the scanner (has ANY profane char)
        // If the scanner masked PART of this token, we shouldn't overwrite unless we want to extend?
        // Current logic: If touched, we assume scanner handled it better (e.g. nested).
        let touched = false;
        for (let i = startIndex; i < endIndex; i++) {
            if (profaneIndices.has(i)) {
                touched = true;
                break;
            }
        }

        // Also check if the START of this token was the start of a scanner match that was protected?
        // To be safe, if we have a partial match, we skip fuzzy for this token.
        // But what if "f-u-c-k"? indices 2,4,6 masked. 1,3,5 sep. 0 protected.
        // `touched` will be true (u, c, k masked).
        // So we skip fuzzy. Correct.
        if (touched) continue;

        // Normalize token for fuzzy matching
        const pLower = token.toLowerCase();
        const pLeeted = transleet(pLower);
        const pNoHyphen = pLeeted.replace(/-/g, '');
        const nToken = pNoHyphen;

        if (nToken.length < MIN_LENGTH) continue;

        // Verify Whitelist Fuzzy First
        let isWhitelisted = false;
        let bestWhitelistDist = Infinity;
        let bestWhitelistWord: string | null = null;

        // Check exact whitelist (normalized)
        if (whitelist.has(nToken)) {
            isWhitelisted = true;
            data.push({
                word: nToken,
                matches: [nToken],
                distance: 0,
                confidence: 'OPTIMIST',
                category: 'WHITELIST'
            });
            continue;
        }

        // Fuzzy Whitelist
        if (!isWhitelisted) {
            for (const goodword of whitelist) {
                if (Math.abs(nToken.length - goodword.length) > 3) continue;
                const wDist = distance(nToken, goodword);
                if (wDist <= 3 && wDist < bestWhitelistDist) {
                    bestWhitelistDist = wDist;
                    bestWhitelistWord = goodword;
                    isWhitelisted = true;
                }
            }
        }

        if (bestWhitelistWord) {
            data.push({
                word: nToken,
                matches: [bestWhitelistWord],
                distance: bestWhitelistDist,
                confidence: 'OPTIMIST',
                category: 'WHITELIST'
            });
        }

        if (isWhitelisted && bestWhitelistDist === 0) continue;

        // Fuzzy Blacklist
        let bestBadMatch: { word: string, dist: number, confidence: 'DOUBT' | 'OPTIMIST' } | null = null;

        for (const badword of blacklist) {
            if (Math.abs(nToken.length - badword.length) > 3) continue;

            const dist = distance(nToken, badword);

            if (dist <= 3) {
                // Check if whitelist overrides this
                if (isWhitelisted && bestWhitelistDist <= dist) continue;

                // Strictly enforce first character match for short words to prevent false positives
                // e.g. "sss" vs "ass" (dist 1). "bat" vs "cat" (dist 1).
                if (badword.length <= 3 && dist > 0 && nToken[0] !== badword[0]) {
                    continue;
                }

                // Determine confidence
                let confidence: 'DOUBT' | 'OPTIMIST' = 'DOUBT';
                if (dist === 0 || nToken.includes(badword)) {
                    confidence = 'OPTIMIST';
                } else if (nToken[0] === badword[0]) {
                    confidence = 'OPTIMIST';
                }

                if (!bestBadMatch || dist < bestBadMatch.dist) {
                    bestBadMatch = { word: badword, dist, confidence };
                }
            }
        }

        if (bestBadMatch) {
            data.push({
                word: nToken,
                matches: [bestBadMatch.word],
                distance: bestBadMatch.dist,
                confidence: bestBadMatch.confidence,
                category: 'BLACKLIST'
            });

            // Mark token as profane (protect first char)
            for (let i = startIndex + 1; i < endIndex; i++) {
                profaneIndices.add(i);
            }
        }
    }

    // 6. Censorship / Masking Build
    let filtered = "";
    const isProfane = data.some(d => d.category === 'BLACKLIST');

    if (isProfane) {
        const chars = text.split('');
        filtered = chars.map((char, i) => {
            // 1. Keep non-maskable chars
            if (/[ \-_@]/.test(char)) return char;

            // 2. Mask if in profaneIndices
            if (profaneIndices.has(i)) {
                return '*';
            }
            return char;
        }).join('');
    } else {
        filtered = text;
    }

    return {
        original: text,
        filtered,
        isProfane,
        decision: isProfane ? 'CENSOR' : 'ALLOW',
        data
    };
}
