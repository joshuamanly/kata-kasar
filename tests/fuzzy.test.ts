import { distance, similarity } from '../src/core/fuzzy.js';

describe('Fuzzy module', () => {
    describe('distance (OSA Damerau-Levenshtein)', () => {
        test('returns 0 for identical strings', () => {
            expect(distance('test', 'test')).toBe(0);
        });

        test('returns correct distance for insertion', () => {
            expect(distance('test', 'tests')).toBe(1);
        });

        test('returns correct distance for deletion', () => {
            expect(distance('test', 'est')).toBe(1);
        });

        test('returns correct distance for substitution', () => {
            expect(distance('test', 'tent')).toBe(1);
        });

        test('returns correct distance for transposition', () => {
            expect(distance('test', 'tset')).toBe(1);
        });

        test('calculates complex distance', () => {
            expect(distance('kitten', 'sitting')).toBe(3);
        });
    });

    describe('similarity (Cosine)', () => {
        test('returns 1 for identical strings', () => {
            expect(similarity('test', 'test')).toBe(1);
        });

        test('returns 0 for completely different strings', () => {
            expect(similarity('abc', 'def')).toBe(0);
        });

        test('calculates similarity for partial match', () => {
            const sim = similarity('test', 'testy');
            expect(sim).toBeCloseTo(0.9258, 4);
        });

        test('calculates similarity for anagrams', () => {
            expect(similarity('listen', 'silent')).toBeCloseTo(1);
        });

        test('is symmetric', () => {
            expect(similarity('apple', 'pear')).toBe(similarity('pear', 'apple'));
        });

        test('handles empty strings', () => {
            expect(similarity('', 'a')).toBe(0);
            expect(similarity('a', '')).toBe(0);
            expect(similarity('', '')).toBe(1);
        });
    });
});
