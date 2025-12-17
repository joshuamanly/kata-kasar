import { addBlacklist } from "../src/dictionary/index.js";
import { censor, leetCensor } from "../src/core/censor.js";

describe("Censor module", () => {
    beforeAll(() => {
        addBlacklist(["asshole", "troll"], "en");
    });

    test("censor normal word", () => {
        expect(censor("troll are as*shole")).toBe("t**** are a*******");
    });

    test("inside bad word", () => {
        expect(censor("introllin")).toBe("int****in");
    });

    test("inside bad word leet", () => {
        expect(leetCensor("introllin")).toBe("int****in");
    });

    test("space bad word normal", () => {
        expect(censor("troll are ass hole")).toBe("t**** are a** ****");
    });

    test("space bad word leet", () => {
        expect(leetCensor("tr0ll are a$$ h0le")).toBe("t**** are a** ****");
    });

    test("censor with custom replacement #", () => {
        expect(censor("Troll here", "#")).toBe("T#### here");
    });

    test("censor with custom replacement wkwk", () => {
        expect(censor("Troll here", "wkwk")).toBe("wkwk here");
    });

    test("words not in blacklist remain", () => {
        expect(censor("Hello world")).toBe("Hello world");
    });
});