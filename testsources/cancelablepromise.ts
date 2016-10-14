import * as chai from "chai";
import { Cancel, CancelSymbol, CancelableChain, CancelablePromise } from "../built/commonjs/cancelable";

describe("CancelablePromise", () => {
    it("should be resolved", done => {
        const promise = new CancelablePromise((resolve, reject) => {
            resolve();
        }).then(done);
    });
    it("should be resolved", done => {
        const promise = new CancelablePromise((resolve, reject, chain) => {
            chain.tillCanceled.then(done);
        });

        const promise2 = new CancelablePromise(async (resolve, reject, chain) => {
            await chain(promise);
        });

        promise2.cancel();
    });
    it("should return Cancel", done => {
        const promise = new CancelablePromise((resolve, reject, chain) => {
            
        });
        promise.catch(c => {
            chai.assert(c instanceof Cancel);
            done();
        });

        promise.cancel();
    });

    it("should return Cancel", done => {
        const promise = new CancelablePromise((resolve, reject, chain) => {
            
        });
        promise.catch(c => {
            chai.assert(c instanceof Cancel);
            done();
        });

        const promise2 = new CancelablePromise(async (resolve, reject, chain) => {
            await chain(promise);
        });

        promise2.cancel();
    });
});
