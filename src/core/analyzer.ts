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
// Allowed chars: letters, numbers, -, _, @, space
const ALLOWED_REGEX = /^[a-zA-Z0-9\-_@ ]+$/;

export function analyze(text: string, options: AnalyzeOptions = {}): AnalyzeResult {
    const { type = 'text', threshold = 3 } = options; // Threshold default 3

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
    // Treat hyphen as obfuscation (remove), underscore as space
    const noHyphen = leeted.replace(/-/g, '');
    const withSpace = noHyphen.replace(/_/g, ' ');
    const normalized = withSpace.replace(/\s+/g, ' ').trim();

    // 3. Tokenization
    const tokens = normalized.split(' ');
    if (tokens.length > 2) {
        return { original: text, filtered: text, isProfane: false, decision: 'ALLOW', data: [], error: 'Too many tokens' };
    }

    // Use Set to avoid duplicate candidates (e.g. single word "asshole" -> ["asshole", "asshole"])
    const candidates = [...tokens, tokens.join("")];
    const uniqueCandidates = [...new Set(candidates)];

    const data: AnalyzeData[] = [];
    let isProfane = false;

    // 4. Detection
    for (const candidate of uniqueCandidates) {
        if (whitelist.has(candidate)) continue;

        let candidateMatches: string[] = [];
        let candidateMinDist = Infinity;
        let candidateConfidence: 'DOUBT' | 'OPTIMIST' | null = null;
        let foundMatch = false;

        // Exact match
        if (blacklist.has(candidate)) {
            foundMatch = true;
            candidateMatches.push(candidate);
            candidateMinDist = 0;
            candidateConfidence = 'OPTIMIST';
        } else {
            // Fuzzy / Substring Loop
            for (const badword of blacklist) {
                // Substring Check (>3)
                if (candidate.includes(badword) && badword.length > 3) {
                    foundMatch = true;
                    candidateMatches.push(badword);
                    candidateMinDist = 0;
                    candidateConfidence = 'OPTIMIST';
                    // Collect all matches
                    continue;
                }

                // Strict Pre-filter
                if (Math.abs(candidate.length - badword.length) > 3) continue;

                const dist = distance(candidate, badword);

                // "any distance that is <= 3, is auto censor"
                if (dist <= 3) {
                    // Fuzzy Whitelist Check
                    // If candidate is closer (or equal) to a whitelist word, ignore this badword match.
                    let isWhitelistedFuzzy = false;
                    for (const goodword of whitelist) {
                        // Optimization: Skip if length diff is too big to possibly beat 'dist'
                        if (Math.abs(candidate.length - goodword.length) > dist) continue;

                        const wDist = distance(candidate, goodword);
                        if (wDist <= dist) {
                            isWhitelistedFuzzy = true;
                            break;
                        }
                    }
                    if (isWhitelistedFuzzy) continue;

                    foundMatch = true;
                    candidateMatches.push(badword);
                    if (dist < candidateMinDist) candidateMinDist = dist;

                    // Confidence Logic
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
                confidence: candidateConfidence || 'DOUBT'
            });
        }
    }

    // 5. Decision & Censorship
    let decision: 'CENSOR' | 'ALLOW' = 'ALLOW';
    let filtered = text;

    if (isProfane) {
        decision = 'CENSOR';
        // Masking logic
        filtered = text.split('').map((c, i) => {
            if (i === 0) return c;
            if (/[ \-_@]/.test(c)) return c;
            return '*';
        }).join('');
    }

    return {
        original: text,
        filtered,
        isProfane,
        decision,
        data
    };
}
