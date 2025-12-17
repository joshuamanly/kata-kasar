export function distance(source: string, target: string): number {
    const m = source.length;
    const n = target.length;
    const d: number[][] = [];

    for (let i = 0; i <= m; i++) {
        d[i] = [];
        d[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
        d[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = source[i - 1] === target[j - 1] ? 0 : 1;
            d[i][j] = Math.min(
                d[i - 1][j] + 1,
                d[i][j - 1] + 1,
                d[i - 1][j - 1] + cost
            );

            if (i > 1 && j > 1 && source[i - 1] === target[j - 2] && source[i - 2] === target[j - 1]) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
            }
        }
    }
    return d[m][n];
}

export function similarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const freq1 = getCharFrequency(str1);
    const freq2 = getCharFrequency(str2);

    const uniqueChars = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    uniqueChars.forEach((char) => {
        const val1 = freq1[char] || 0;
        const val2 = freq2[char] || 0;

        dotProduct += val1 * val2;
        mag1 += val1 * val1;
        mag2 += val2 * val2;
    });

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (mag1 * mag2);
}

function getCharFrequency(str: string): Record<string, number> {
    const freq: Record<string, number> = {};
    for (const char of str) {
        freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
}