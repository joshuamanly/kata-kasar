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

        test("should accept special characters", () => {
            const result = analyze("hello!");
            expect(result.error).toBeUndefined();
            expect(result.decision).toBe("ALLOW");
            expect(result.filtered).toBe("hello!");
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
            expect(result.data[0].distance).toBe(0);
            expect(result.filtered).toBe("a******");
        });

        test("should return DOUBT for fuzzy match with diff start char (Denis vs penis)", () => {
            const result = analyze("Denis");
            expect(result.isProfane).toBe(true);
            expect(result.data.length).toBeGreaterThanOrEqual(1);
            const blackData = result.data.find(d => d.category === "BLACKLIST");
            expect(blackData).toBeDefined();
            expect(blackData?.confidence).toBe("DOUBT");
            expect(blackData?.distance).toBe(1);
            expect(result.filtered).toBe("D****");
        });

        test("should return OPTIMIST for exact match (penis)", () => {
            const result = analyze("penis");
            expect(result.isProfane).toBe(true);
            expect(result.data.length).toBeGreaterThanOrEqual(1);
            expect(result.data.some(d => d.category === "BLACKLIST")).toBe(true);
            expect(result.filtered).toBe("p****");
        });

        test("should return DOUBT for lowercase fuzzy mismatch (denis vs penis)", () => {
            const result = analyze("denis");
            expect(result.isProfane).toBe(true);
            expect(result.data.length).toBeGreaterThanOrEqual(1);
            expect(result.filtered).toBe("d****");
        });

        test("should return correct data for mixed confidence (den1s fuck)", () => {
            const result = analyze("den1s fuck");
            expect(result.isProfane).toBe(true);
            expect(result.data.length).toBeGreaterThanOrEqual(3);

            const denisData = result.data.find(d => d.word === "denis" && d.category === "BLACKLIST");
            const fuckData = result.data.find(d => d.word === "fuck" && d.category === "BLACKLIST");

            expect(denisData).toBeDefined();
            expect(denisData?.confidence).toBe("DOUBT");
            expect(denisData?.distance).toBe(1);

            expect(fuckData).toBeDefined();
            expect(fuckData?.confidence).toBe("OPTIMIST");
            expect(fuckData?.distance).toBe(0);

            expect(result.filtered).toBe("d**** f***");
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
            const result = analyze("adinis");
            expect(result.isProfane).toBe(false);
            expect(result.decision).toBe("ALLOW");
            expect(result.filtered).toBe("adinis");
        });

        test("should allow whitelist match when significantly closer (cllss vs class)", () => {
            const result = analyze("cllss");
            expect(result.isProfane).toBe(false);
            expect(result.decision).toBe("ALLOW");
            expect(result.data.some(d => d.category === "WHITELIST")).toBe(true);
            expect(result.filtered).toBe("cllss");
        });

        test("should handle mixed case with whitelist (c11ls fuck)", () => {
            const result = analyze("c11ls fuck");
            expect(result.isProfane).toBe(true);
            expect(result.data).toHaveLength(3);

            const ciilsData = result.data.find(d => d.word === "ciils" && d.category === "WHITELIST");
            expect(ciilsData).toBeDefined();
            expect(ciilsData?.matches).toContain("class");

            const fuckData = result.data.find(d => d.word === "fuck" && d.category === "BLACKLIST");
            expect(fuckData).toBeDefined();

            expect(result.filtered).toBe("c11ls f***");
        });

        test("should return DOUBT for multiple tokens (Denis 8enis)", () => {
            const result = analyze("Denis 8enis");
            expect(result.isProfane).toBe(true);
            expect(result.data).toHaveLength(4);

            const d1_found = result.data.find(d => d.word === "denis" && d.category === "BLACKLIST");
            expect(d1_found).toBeDefined();
            expect(d1_found?.confidence).toBe("DOUBT");

            expect(result.filtered).toBe("D**** 8****");
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
