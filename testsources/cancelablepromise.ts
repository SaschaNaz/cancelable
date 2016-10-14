import * as chai from "chai";
import { CancelSymbol, CancelableChain, CancelablePromise } from "../built/commonjs/cancelable";

describe("CancelablePromise", () => {
    it("should be resolved", done => {
        const promise = new CancelablePromise((resolve, reject) => {
            resolve();
        }).then(done);
        console.log("wow");
    });
});
