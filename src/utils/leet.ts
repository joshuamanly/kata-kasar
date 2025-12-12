const leetMap: Record<string, string> = {
    "4": "a",
    "@": "a",
    "8": "b",
    "3": "e",
    "1": "i",
    "!": "i",
    "0": "o",
    "5": "s",
    "$": "s",
    "7": "t",
    "+": "t",
};

export function transleet(text: string): string {
    return text.split("").map(c => leetMap[c.toLowerCase()] || c).join("");
}