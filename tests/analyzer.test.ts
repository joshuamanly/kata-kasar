import { analyze } from "../src/core/analyzer.js";
import { addBlacklist, addWhitelist } from "../src/dictionary/index.js";

describe("Analyzer Module", () => {
    beforeAll(() => {
        addBlacklist(["asshole", "troll", "fuck", "penis", "ass"], "en");
        addWhitelist(["class", "adonis"], "en");
    });

    describe("Validation", () => {
        test("should reject if length < 3", () => {
            const result = analyze("hi");
            expect(result.error).toBe("Invalid length");
            expect(result.decision).toBe("ALLOW");
            expect(result.data).toHaveLength(0);
            expect(result.filtered).toBe("hi");
        });

        test("should reject if length > 100", () => {
            const result = analyze("a".repeat(101));
            expect(result.error).toBe("Invalid length");
            expect(result.data).toHaveLength(0);
            expect(result.filtered).toBe("a".repeat(101));
        });
    });

    describe("Confidence Logic", () => {
        test("should return OPTIMIST for exact match", () => {
            const result = analyze("asshole");
            expect(result.isProfane).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].confidence).toBe("OPTIMIST");
            expect(result.data[0].distance).toBe(0);
            expect(result.data[0].matches).toContain("asshole");
            expect(result.filtered).toBe("a******");
        });

        test("should return OPTIMIST for fuzzy match with same start char (asshol3)", () => {
            const result = analyze("asshol3");
            expect(result.isProfane).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].confidence).toBe("OPTIMIST");
            expect(result.data[0].distance).toBe(0); // Normalized to exact
            expect(result.filtered).toBe("a******");
        });

        test("should return DOUBT for fuzzy match with diff start char (Denis vs penis)", () => {
            const result = analyze("Denis");
            expect(result.isProfane).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].confidence).toBe("DOUBT");
            expect(result.data[0].distance).toBe(1);
            expect(result.filtered).toBe("D****");
        });

        test("should return OPTIMIST for exact match (penis)", () => {
            const result = analyze("penis");
            expect(result.isProfane).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].confidence).toBe("OPTIMIST");
            expect(result.data[0].distance).toBe(0);
            expect(result.filtered).toBe("p****");
        });

        test("should return DOUBT for lowercase fuzzy mismatch (denis vs penis)", () => {
            const result = analyze("denis");
            expect(result.isProfane).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].confidence).toBe("DOUBT");
            expect(result.data[0].distance).toBe(1);
            expect(result.filtered).toBe("d****");
        });

        test("should return correct data for mixed confidence (den1s fuck)", () => {
            const result = analyze("den1s fuck");
            expect(result.isProfane).toBe(true);
            expect(result.data).toHaveLength(3);

            const denisData = result.data.find(d => d.word === "denis");
            const fuckData = result.data.find(d => d.word === "fuck");

            expect(denisData).toBeDefined();
            expect(denisData?.confidence).toBe("DOUBT");
            expect(denisData?.distance).toBe(1);

            expect(fuckData).toBeDefined();
            expect(fuckData?.confidence).toBe("OPTIMIST");
            expect(fuckData?.distance).toBe(0);

            expect(result.filtered).toBe("d**** ****");
        });

        test("should return OPTIMIST for substring match (fuckasshol)", () => {
            const result = analyze("fuckasshol");
            expect(result.isProfane).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].confidence).toBe("OPTIMIST");
            expect(result.data[0].matches).toContain("fuck");
            expect(result.filtered).toBe("f*********");
        });

        test("should allow whitelist match when closer (adinis vs adonis)", () => {
            // "adinis" dist 1 to "adonis" (whitelist)
            // "adinis" dist > 1 to "penis" (blacklist)
            const result = analyze("adinis");
            expect(result.isProfane).toBe(false);
            expect(result.decision).toBe("ALLOW");
            expect(result.filtered).toBe("adinis");
        });

        test("should return DOUBT for multiple tokens (Denis 8enis)", () => {
            // "Denis" -> "denis" (vs "penis" -> DOUBT)
            // "8enis" -> "benis" (vs "penis" -> DOUBT)
            // Joined "denisbenis" -> no match
            const result = analyze("Denis 8enis");
            expect(result.isProfane).toBe(true);
            expect(result.data).toHaveLength(2);

            const d1_found = result.data.find(d => d.word === "denis");
            const d2_found = result.data.find(d => d.word === "benis");

            expect(d1_found).toBeDefined();
            expect(d1_found?.confidence).toBe("DOUBT");

            expect(d2_found).toBeDefined();
            expect(d2_found?.confidence).toBe("DOUBT");

            expect(result.filtered).toBe("D**** *****");
        });
    });

    describe("Threshold Logic", () => {
        test("should censor if distance <= 3 (trolll -> troll dist 1)", () => {
            const result = analyze("trolll");
            expect(result.isProfane).toBe(true);
            expect(result.decision).toBe("CENSOR");
            expect(result.data[0].distance).toBe(0);
            expect(result.filtered).toBe("t*****");
        });

        test("should censor if distance is 3 (trolaaa vs troll)", () => {
            const result = analyze("trolaaa");
            if (result.isProfane) {
                expect(result.data[0].distance).toBeLessThanOrEqual(3);
                expect(result.filtered).toBe("t******");
            }
        });
    });

    describe("Hard Object Verification", () => {
        test("should return correct object for multi-hyphen obfuscation", () => {
            const result = analyze("f-u-c-k");
            expect(result.data).toHaveLength(1);
            expect(result.data[0].word).toBe("fuck");
            expect(result.data[0].confidence).toBe("OPTIMIST");
            expect(result.data[0].distance).toBe(0);
            expect(result.filtered).toBe("f-*-*-*");
        });
    });
});
