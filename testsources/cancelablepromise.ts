import * as chai from "chai";
import { Cancel, CancelSymbol, CancelableChain, CancelablePromise } from "../built/commonjs/cancelable";

describe("CancelablePromise", () => {
    it("should be resolved", done => {
        const promise = CancelablePromise.cancelable(async (chain) => {
            
        }).then(done);
    });

    it("should resolve 'tillCanceled'", done => {
        const promise = CancelablePromise.cancelable(async (chain) => {
            chain.tillCanceled.then(done);
            await new Promise(() => {});
        });

        const promise2 = CancelablePromise.cancelable(async (chain) => {
            await chain(promise);
        });

        promise2.cancel();
    });

    it("should return Cancel", done => {
        const promise = CancelablePromise.cancelable(async (chain) => {
            await new Promise(() => {});
        });
        promise.catch(c => {
            chai.assert(c instanceof Cancel);
            done();
        });

        promise.cancel();
    });

    it("should return Cancel", done => {
        const promise = CancelablePromise.cancelable(async (chain) => {
            await new Promise(() => {});
        });
        promise.catch(c => {
            chai.assert(c instanceof Cancel);
            done();
        });

        const promise2 = CancelablePromise.cancelable(async (chain) => {
            await chain(promise);
        });

        promise2.cancel();
    });

    it("should return correct value", done => {
        const promise = CancelablePromise.cancelable(async (chain) => {
            return 3;
        });

        const promise2 = CancelablePromise.cancelable(async (chain) => {
            const value = await chain(promise);
            chai.assert(value === 3);
            done();
        });
    });

    it("should throw chained error", done => {
        const promise = CancelablePromise.cancelable(async (chain) => {
            throw new Error("homu");
        });

        const promise2 = CancelablePromise.cancelable(async (chain) => {
            try {
                const value = await chain(promise);
            }
            catch (err) {
                chai.assert(err.message === "homu");
                done();
            }
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
    });

    it("should be cancelable", () => {
        const promise = CancelablePromise.cancelable(async (chain) => {
            await new Promise(() => {});
        })
        chai.assert(promise.cancelable);
        chai.assert(typeof (promise as any)[CancelSymbol] === "function", "should return cancel function");
    });

    it("should not be cancelable", () => {
        const promise = new CancelablePromise(() => {});
        chai.assert(!promise.cancelable);
        chai.assert(typeof (promise as any)[CancelSymbol] === "undefined");
    });

    it("should throw when .cancel() is called on uncancelable promise", done => {
        const promise = new CancelablePromise(() => {});
        try {
            promise.cancel();
        }
        catch (err) {
            chai.assert(err instanceof Error);
            done();
        }
    });

    it("should cancel remaining tasks when resolved", done => {
        let resolved = false;
        const promise = CancelablePromise.cancelable(async (chain) => {
            chain.tillCanceled.then(() => {
                chai.assert(resolved, "should be called after resolved");
                chai.assert(chain.canceled, "chain status should be 'canceled'");
                done();
            });
            await new Promise(() => {});
        })

        const promise2 = CancelablePromise.cancelable(async (chain) => {
            chain(promise);
            resolved = true;
        });
    })

    it("should cancel remaining tasks when rejected", done => {
        let rejected = false;
        const promise = CancelablePromise.cancelable(async (chain) => {
            chain.tillCanceled.then(() => {
                chai.assert(rejected, "should be called after rejected");
                chai.assert(chain.canceled, "chain status should be 'canceled'");
                done();
            });
            await new Promise(() => {});
        })

        const promise2 = CancelablePromise.cancelable(async (chain) => {
            chain(promise);
            rejected = true;
            throw new Error("This error is a normal testing one");
        });
    })
});
