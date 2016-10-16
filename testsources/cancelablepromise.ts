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

    it("should return correct value", done => {
        const promise = new CancelablePromise<number>((resolve, reject, chain) => {
            resolve(3);
        });

        const promise2 = new CancelablePromise(async (resolve, reject, chain) => {
            const value = await chain(promise);
            chai.assert(value === 3);
            done();
        });
    });

    it("should resolve tillCanceled by standalone cancellation chain", done => {
        const chain = new CancelableChain();
        let canceled = false;

        const promise = CancelablePromise.cancelable(async (chain) => {
            chain.tillCanceled.then(() => {
                chai.assert(canceled, "'canceled' value should be true");
                chai.assert(chain.canceled, "chain status should be 'canceled'");
                done();
            });
        })

        chain(promise);
        chain.cancel();
        canceled = true;
    })
});
