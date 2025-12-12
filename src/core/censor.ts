import { blacklist } from "../dictionary/index.js";
import { escapeRegExp } from "../utils/regex.js";
import { transleet } from "../utils/leet.js";


export function censor(text: string, replacement: string = "***"): string {
    let result = text;

    for (const word of blacklist) {
        const chars = word.split("");
        const pattern = chars.map((c) => escapeRegExp(c)).join("\\s*");
        const regex = new RegExp(pattern, "gi");

        result = result.replace(regex, (match) => {
            if (replacement === "***" || replacement.length === 1) {
                const charToUse = replacement === "***" ? "*" : replacement;
                return match
                    .split("")
                    .map((c) => (/\s/.test(c) ? c : charToUse))
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