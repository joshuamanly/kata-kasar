export function flag(text: string): boolean {

    return false;
}

export function filter(text: string): string {

    return text;
}

export function censor(text: string, replacement: string = "***"): string {

    return text;
}

export function badwords(text: string): string[] {

    return [];
}

export function addWords(words: string | string[]) {

}

export function removeWords(words: string | string[]) {

}

export function addWhitelist(words: string | string[]) {

}

export function removeWhitelist(words: string | string[]) {

}

export function score(text1: string, text2: string): number {
    return 0;
}

export function scoreAgainstDB(text: string): number {
    return 0;
}

export function findHighestScore(text1: string, text2: string | string[]): string {
    return text1;
}