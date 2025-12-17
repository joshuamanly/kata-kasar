import { blacklist } from "../dictionary/index.js";
import { createPattern } from "../utils/regex.js";
import { transleet } from "../utils/leet.js";


export function censor(text: string, replacement: string = "***"): string {
    let result = text;

    for (const word of blacklist) {
        const regex = createPattern(word);

        result = result.replace(regex, (match) => {
            if (replacement === "***" || replacement.length === 1) {
                const charToUse = replacement === "***" ? "*" : replacement;
                return match
                    .split("")
                    .map((c, index) => {
                        if (index === 0) return c;
                        return /\s/.test(c) ? c : charToUse;
                    })
                    .join("");
            } else {
                return replacement;
            }
        });
    }

    return result;
}


export function leetCensor(text: string, replacement: string = "***"): string {
    const leetText = transleet(text);
    return censor(leetText, replacement);
}