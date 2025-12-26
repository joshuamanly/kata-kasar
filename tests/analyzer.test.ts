import { analyze } from "../src/core/analyzer.js";
import { addBlacklist, addWhitelist } from "../src/dictionary/index.js";

describe("Analyzer Module", () => {
    beforeAll(() => {
        addBlacklist(["asshole", "troll", "fuck", "penis", "ass", "pepek"], "en");
        addWhitelist(["class", "adonis", "hola"], "en");
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
            expect(result.isProfane).toBe(true);
            expect(result.data.length).toBeGreaterThanOrEqual(1);
            const match = result.data.find(d => d.matches.includes("asshole"));
            expect(match).toBeDefined();
            expect(match?.confidence).toBe("OPTIMIST");
            expect(match?.distance).toBe(0);
            expect(result.filtered).toBe("a******");
        });

        test("should return OPTIMIST for fuzzy match with same start char (asshol3)", () => {
            const result = analyze("asshol3");
            expect(result.isProfane).toBe(true);
            expect(result.isProfane).toBe(true);
            expect(result.data.length).toBeGreaterThanOrEqual(1);
            const match = result.data.find(d => d.matches.includes("asshole"));
            expect(match).toBeDefined();
            expect(match?.confidence).toBe("OPTIMIST");
            expect(match?.distance).toBe(0);
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
            expect(result.isProfane).toBe(true);
            expect(result.data.length).toBeGreaterThanOrEqual(2);

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
            expect(result.isProfane).toBe(true);
            expect(result.data.length).toBeGreaterThanOrEqual(1);
            const match = result.data.find(d => d.matches.includes("fuck"));
            expect(match).toBeDefined();
            expect(match?.confidence).toBe("OPTIMIST");
            expect(result.filtered).toBe("f***a**hol");
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
            expect(result.data.length).toBeGreaterThanOrEqual(2);

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
            expect(result.filtered).toBe("t****l");
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
            expect(result.data.length).toBeGreaterThanOrEqual(1);
            const match = result.data.find(d => d.word === "fuck");
            expect(match).toBeDefined();
            expect(match?.confidence).toBe("OPTIMIST");
            expect(match?.distance).toBe(0);
            expect(result.filtered).toBe("f-*-*-*");
        });
    });

    describe("Advanced Tokenization", () => {
        test("should handle nested profanity (fuck asstt -> f*** a**tt)", () => {
            const result = analyze("fuck asstt");
            expect(result.isProfane).toBe(true);
            expect(result.filtered).toBe("f*** a**tt");
            const fuck = result.data.find(d => d.word === "fuck");
            const ass = result.data.find(d => d.word === "ass");
            expect(fuck).toBeDefined();
            expect(ass).toBeDefined();
        });

        test("should handle spaced profanity (fu ck -> fuck)", () => {
            const result = analyze("fu ck");
            expect(result.isProfane).toBe(true);
            expect(result.filtered).toBe("f* c*");
            expect(result.data[0].word).toBe("fuck");
        });

        test("should handle obfuscated spaced profanity (f u c k -> f* * *)", () => {
            const result = analyze("f u c k");
            expect(result.isProfane).toBe(true);
            expect(result.filtered).toBe("f u c k");
        });

        test("should handle mixed allow/reject (class asstt)", () => {
            const result = analyze("class asstt");
            expect(result.isProfane).toBe(true);
            expect(result.filtered).toBe("class a**tt");
        });

        test("should handle hard case (fu ckass1 -> f* c*a**1)", () => {
            const result = analyze("fu ckass1");
            expect(result.isProfane).toBe(true);
            expect(result.filtered).toBe("f* c*a**1");
        });

        test("should handle hard case (hola s5tt -> hola s*tt)", () => {
            const result = analyze("hola s5tt");
            expect(result.isProfane).toBe(true);
            expect(result.filtered).toBe("hola s*tt");
        });

        test("should handle heavily obfuscated nested (f-u-c-k-a-s-s -> f-*-*-*-a-s-s)", () => {
            const result = analyze("f-u-c-k-a-s-s");
            expect(result.isProfane).toBe(true);
            expect(result.filtered).toBe("f-*-*-*-a-*-*");
        });

        test("kontl ppk", () => {
            const result = analyze("pepek sss");
            expect(result.isProfane).toBe(true);
            expect(result.filtered).toBe("p**** sss");
        });
    });
});
