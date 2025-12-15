import { addBlacklist } from "../src/dictionary/index.js";
import { flag, leetFlag } from "../src/core/flag.js";

describe("Flag module", () => {
    beforeAll(() => {
        addBlacklist(["asshole", "troll"]);
    });

    test("flag normal word", () => {
        expect(flag("hello world")).toBe(false);
    });

    test("flag bad word", () => {
        expect(flag("you are an asshole")).toBe(true);
    });

    test("flag bad word inside other chars", () => {
        expect(flag("introllin")).toBe(true);
    });

    test("flag spaced bad word", () => {
        expect(flag("ass hole")).toBe(true);
    });

    test("flag leet word", () => {
        expect(leetFlag("a$$h0le")).toBe(true);
    });

    test("flag normal word with weird spacing (regression test)", () => {
        expect(flag("hello   world")).toBe(false);
    });

    test("flag clean word", () => {
        expect(flag("class")).toBe(false);
    });
});
