import { createPattern, escapeRegExp } from "../src/utils/regex.js";

describe("Utils Regex", () => {
    describe("escapeRegExp", () => {
        test("should escape special regex characters", () => {
            expect(escapeRegExp("a*b.c?")).toBe("a\\*b\\.c\\?");
        });

        test("should return string as remains if no special char", () => {
            expect(escapeRegExp("abc")).toBe("abc");
        });
    });

    describe("createPattern", () => {
        test("should create regex pattern from word", () => {
            const regex = createPattern("test");
            expect(regex).toBeInstanceOf(RegExp);
            expect(regex.flags).toContain("g");
            expect(regex.flags).toContain("i");
            expect("test".match(regex)).toBeTruthy();
        });

        test("should match word with obfuscation characters", () => {
            const regex = createPattern("fuck");
            // Test detection of words with inserted non-alphanumeric characters
            expect("f*u*c*_*_-k".match(regex)).toBeTruthy();
            expect("f.u_c-k".match(regex)).toBeTruthy();
            expect("f_u_c_k".match(regex)).toBeTruthy();
        });

        test("should match word with obfuscation characters", () => {
            const regex = createPattern("kontol");
            // Test detection of words with inserted non-alphanumeric characters
            expect("k*o*n*t*o*l".match(regex)).toBeTruthy();
            expect("k.o_n_t*o_l".match(regex)).toBeTruthy();
            expect("k_o_n_t_o_l".match(regex)).toBeTruthy();
        });

        test("should match word with mixed case", () => {
            const regex = createPattern("troll");
            expect("TrOlL".match(regex)).toBeTruthy();
        });
    });
});
