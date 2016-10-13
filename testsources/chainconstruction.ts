import * as chai from "chai";
import { CancelSymbol, CancelableChain, CancelablePromise } from "../built/commonjs/cancelable";

describe("CancelableChain", () => {
    it("should be constructed successfully", () => {
        chai.assert(new CancelableChain() instanceof CancelableChain, "new CancelableChain() is instance of CancelableChain");
    });
    it("should use cancel symbol", (done) => {
        const stub = {
            [CancelSymbol]() {
                done();
            }
        }
        const chain = new CancelableChain();
        chain(stub);
        chain.cancel();
        chai.assert(chain.canceled, ".canceled should be true");
    });
    it("should error", async (done) => {
        const chain = new CancelableChain();
        try {
            await chain({}); // not cancelable without [CancelSymbol]
        }
        catch (err) {
            done();
        }
    })
})