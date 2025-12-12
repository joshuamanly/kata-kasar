import { addBlacklist } from "../src/dictionary/index.js";
import { censor, leetCensor } from "../src/core/censor.js";

describe("Censor module", () => {
    beforeAll(() => {
        addBlacklist(["asshole", "troll"]);
    });

    test("censor normal word", () => {
        expect(censor("troll are asshole")).toBe("***** are *******");
    });

    test("inside bad word", () => {
        expect(censor("introllin")).toBe("in*****in");
    });

    test("inside bad word", () => {
        expect(censor("introllin")).toBe("in*****in");
    });

    test("space bad word normal", () => {
        expect(censor("troll are ass hole")).toBe("***** are *** ****");
    });

    test("space bad word leet", () => {
        expect(leetCensor("tr0ll are a$$ h0le")).toBe("***** are *** ****");
    });

    test("censor with custom replacement #", () => {
        expect(censor("Troll here", "#")).toBe("##### here");
    });

    test("censor with custom replacement wkwk", () => {
        expect(censor("Troll here", "wkwk")).toBe("wkwk here");
    });

    test("words not in blacklist remain", () => {
        expect(censor("Hello world")).toBe("Hello world");
    });
});