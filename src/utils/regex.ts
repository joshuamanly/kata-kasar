export function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createPattern(word: string): RegExp {
    const chars = word.split("");
    const pattern = chars.map((c) => escapeRegExp(c)).join("[^a-zA-Z0-9]*");
    return new RegExp(pattern, "gi");
}