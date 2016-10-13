import * as chai from "chai";
import { CancelableChain, CancelablePromise } from "../built/commonjs/cancelable";

describe("CancelableChain", () => {
    it("should be constructed successfully", () => {
        chai.assert(new CancelableChain() instanceof CancelableChain, "new CancelableChain() is instance of CancelableChain");
    })
})