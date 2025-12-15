import { addBlacklist } from "../src/dictionary/index.js";
import { extract, leetExtract } from "../src/core/extract.js";

describe("Extract module", () => {
    beforeAll(() => {
        addBlacklist(["asshole", "troll"], "en");
    });

    test("extract normal keywords", () => {
        const result = extract("you are an asshole and a troll");
        expect(result).toHaveLength(2);
        expect(result).toContain("asshole");
        expect(result).toContain("troll");
    });

    test("extract spaced keywords", () => {
        const result = extract("ass hole is here");
        expect(result).toContain("ass hole");
    });

    test("extract multiple occurrences", () => {
        const result = extract("troll troll troll");
        expect(result).toHaveLength(3);
        expect(result.filter(w => w === "troll").length).toBe(3);
    });

    test("extract none", () => {
        const result = extract("hello world");
        expect(result).toEqual([]);
    });

    test("extract leet", () => {
        const result = leetExtract("you are an a$$h0le");
        expect(result).toContain("asshole");
    });
});
