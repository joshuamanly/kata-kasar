import { transleet } from "../utils/leet.js";
import { blacklist } from "../dictionary/index.js";
import { createPattern } from "../utils/regex.js";

export function flag(text: string): boolean {
    for (const word of blacklist) {
        const regex = createPattern(word);

        if (regex.test(text)) {
            return true;
        }
    }
    return false;
}

export function leetFlag(text: string): boolean {
    const leetText = transleet(text);
    return flag(leetText);
}