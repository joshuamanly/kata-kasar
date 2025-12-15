import { addBlacklist } from "../src/dictionary/index.js";
import { filter, leetFilter } from "../src/core/filter.js";

describe("Filter module", () => {
    beforeAll(() => {
        addBlacklist(["asshole", "troll"], "en");
    });

    test("filter normal word", () => {
        expect(filter("troll are asshole")).toBe("are");
    });

    test("filter inside bad word", () => {
        expect(filter("introllin")).toBe("inin");
    });

    test("filter spaced bad word", () => {
        expect(filter("troll are ass hole")).toBe("are");
    });

    test("filter leet word", () => {
        expect(leetFilter("tr0ll are a$$ h0le")).toBe("are");
    });

    test("words not in blacklist remain", () => {
        expect(filter("Hello world")).toBe("Hello world");
    });

    test("filter sentence with bad word at end", () => {
        expect(filter("i love troll")).toBe("i love");
    });

    test("filter sentence with bad word at start", () => {
        expect(filter("troll is bad")).toBe("is bad");
    });
});
