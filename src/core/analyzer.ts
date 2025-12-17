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
    const { type = 'text', threshold = 3 } = options;

    // 1. Validation
    if (!ALLOWED_REGEX.test(text)) {
        return { original: text, filtered: text, isProfane: false, decision: 'ALLOW', data: [], error: 'Invalid characters' };
    }
    if (text.length < MIN_LENGTH || text.length > MAX_LENGTH) {
        return { original: text, filtered: text, isProfane: false, decision: 'ALLOW', data: [], error: 'Invalid length' };
    }

    // 2. Normalization
    const lower = text.toLowerCase();
    const leeted = transleet(lower);
    const noHyphen = leeted.replace(/-/g, '');
    const withSpace = noHyphen.replace(/_/g, ' ');
    const normalized = withSpace.replace(/\s+/g, ' ').trim();

    // 3. Tokenization
    const tokens = normalized.split(' ');
    if (tokens.length > 2) {
        return { original: text, filtered: text, isProfane: false, decision: 'ALLOW', data: [], error: 'Too many tokens' };
    }

    const candidates = [...tokens, tokens.join("")];
    const uniqueCandidates = [...new Set(candidates)];

    const data: AnalyzeData[] = [];
    let isProfane = false;

    // 4. Detection
    for (const candidate of uniqueCandidates) {
        let isWhitelisted = false;

        if (whitelist.has(candidate)) {
            data.push({
                word: candidate,
                matches: [candidate],
                distance: 0,
                confidence: 'OPTIMIST',
                category: 'WHITELIST'
            });
            continue;
        }

        let bestWhitelistDist = Infinity;
        let bestWhitelistWord: string | null = null;

        for (const goodword of whitelist) {
            if (Math.abs(candidate.length - goodword.length) > 3) continue;
            const wDist = distance(candidate, goodword);
            if (wDist <= 3) {
                if (wDist < bestWhitelistDist) {
                    bestWhitelistDist = wDist;
                    bestWhitelistWord = goodword;
                }
            }
        }

        if (bestWhitelistWord) {
            isWhitelisted = true;
            data.push({
                word: candidate,
                matches: [bestWhitelistWord],
                distance: bestWhitelistDist,
                confidence: 'OPTIMIST',
                category: 'WHITELIST'
            });
        }

        let candidateMatches: string[] = [];
        let candidateMinDist = Infinity;
        let candidateConfidence: 'DOUBT' | 'OPTIMIST' | null = null;
        let foundMatch = false;

        if (blacklist.has(candidate)) {
            foundMatch = true;
            candidateMatches.push(candidate);
            candidateMinDist = 0;
            candidateConfidence = 'OPTIMIST';
        } else {
            for (const badword of blacklist) {
                if (candidate.includes(badword) && badword.length > 3) {
                    foundMatch = true;
                    candidateMatches.push(badword);
                    candidateMinDist = 0;
                    candidateConfidence = 'OPTIMIST';
                    continue;
                }

                if (Math.abs(candidate.length - badword.length) > 3) continue;

                const dist = distance(candidate, badword);

                if (dist <= 3) {
                    if (isWhitelisted && bestWhitelistDist <= dist) {
                        continue;
                    }

                    foundMatch = true;
                    candidateMatches.push(badword);
                    if (dist < candidateMinDist) candidateMinDist = dist;

                    if (candidateConfidence !== 'OPTIMIST') {
                        if (candidate[0].toLowerCase() === badword[0].toLowerCase()) {
                            candidateConfidence = 'OPTIMIST';
                        } else {
                            candidateConfidence = 'DOUBT';
                        }
                    }
                }
            }
        }

        if (foundMatch) {
            isProfane = true;
            data.push({
                word: candidate,
                matches: candidateMatches,
                distance: candidateMinDist === Infinity ? -1 : candidateMinDist,
                confidence: candidateConfidence || 'DOUBT',
                category: 'BLACKLIST'
            });
        }
    }

    // 5. Decision & Censorship
    let decision: 'CENSOR' | 'ALLOW' = 'ALLOW';
    let filtered = text;

    if (isProfane) {
        decision = 'CENSOR';

        const maskString = (s: string) => s.split('').map((c, i) => {
            if (i === 0) return c;
            if (/[ \-_@]/.test(c)) return c;
            if (i > 0 && s[i - 1] === ' ') return c;
            return '*';
        }).join('');

        const parts = text.split(/([ _]+)/);
        let anyTokenMasked = false;

        filtered = parts.map(part => {
            if (/^[ _]+$/.test(part)) return part;

            const pLower = part.toLowerCase();
            const pLeeted = transleet(pLower);
            const pNoHyphen = pLeeted.replace(/-/g, '');
            const pNorm = pNoHyphen.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

            const matchedData = data.find(d => d.word === pNorm && d.category === 'BLACKLIST');

            if (matchedData) {
                anyTokenMasked = true;
                return maskString(part);
            }
            return part;
        }).join('');

        if (!anyTokenMasked) {
            filtered = maskString(text);
        }
    }

    return {
        original: text,
        filtered,
        isProfane,
        decision,
        data
    };
}
