import * as chai from "chai";
import { Cancel, CancelSymbol, CancelableChain, CancelablePromise } from "../built/commonjs/cancelable.js";

describe("CancelablePromise", () => {
    it("should be resolved", done => {
        const promise = CancelablePromise.cancelable(async (chain) => {

        }).then(done);
    });

    it("should resolve 'tillCanceled'", done => {
        const promise = CancelablePromise.cancelable(async (chain) => {
            chain.tillCanceled.then(done);
            await new Promise(() => { });
        });

        const promise2 = CancelablePromise.cancelable(async (chain) => {
            await chain(promise);
        });

        promise2.cancel();
    });

    it("should return error thrown after cancellation", done => {
        const message = "Custom error";
        const promise = CancelablePromise.cancelable(async (chain) => {
            await new Promise(resolve => setTimeout(resolve, 10));
            if (chain.canceled) {
                throw new Error(message)
            }
        });
        promise.catch(c => {
            chai.assert(c.message === message);
            done();
        });

        promise.cancel();
    });

    it("should return error thrown after chained cancellation", done => {
        const message = "Custom error";
        const promise = CancelablePromise.cancelable(async (chain) => {
            await new Promise(resolve => setTimeout(resolve, 10));
            if (chain.canceled) {
                throw new Error(message)
            }
        });
        promise.catch(c => {
            chai.assert(c.message === message);
            done();
        });

        const promise2 = CancelablePromise.cancelable(async (chain) => {
            await chain(promise);
        });
        promise2.catch(err => { }); // prevent promise unhandled error

        promise2.cancel();
    });

    it("should return Cancel after cancellation", done => {
        const promise = CancelablePromise.cancelable(async (chain) => {
            await new Promise(resolve => setTimeout(resolve, 10));
            chain.throwIfCanceled();
        });
        promise.catch(c => {
            chai.assert(c instanceof Cancel);
            done();
        });

        promise.cancel();
    });

    it("should return Cancel after chained cancellation", done => {
        const promise = CancelablePromise.cancelable(async (chain) => {
            await new Promise(resolve => setTimeout(resolve, 10));
            chain.throwIfCanceled();
        });
        promise.catch(c => {
            chai.assert(c instanceof Cancel);
            done();
        });

        const promise2 = CancelablePromise.cancelable(async (chain) => {
            await chain(promise);
        });
        promise2.catch(err => { }); // prevent promise unhandled error

        promise2.cancel();
    });

    it("should not return Cancel when no cancellation process", done => {
        const promise = CancelablePromise.cancelable(async (chain) => {
            await new Promise(resolve => setTimeout(resolve, 10));
        });
        promise.then(done);

        promise.cancel();
    });

    it("should return correct value", done => {
        const promise = CancelablePromise.cancelable(() => 3);

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
        });

        chain(promise).catch(err => { }); // prevent promise unhandled error
        chain.cancel();
        canceled = true;
    });

    it("should be cancelable", () => {
        const promise = CancelablePromise.cancelable(async (chain) => {
            await new Promise(() => { });
        })
        chai.assert(promise.cancelable);
        chai.assert(typeof (promise as any)[CancelSymbol] === "function", "should return cancel function");
    });

    it("should not be cancelable", () => {
        const promise = new CancelablePromise(() => { });
        chai.assert(!promise.cancelable);
        chai.assert(typeof (promise as any)[CancelSymbol] === "undefined");
    });

    it("should throw when .cancel() is called on uncancelable promise", done => {
        const promise = new CancelablePromise(() => { });
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
            await new Promise(() => { });
        })

        CancelablePromise.cancelable(async (chain) => {
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
            await new Promise(() => { });
        })

        CancelablePromise.cancelable(async (chain) => {
            chain(promise);
            rejected = true;
            throw new Error("This error is a normal testing one");
        }).catch(err => { }); // prevent promise unhandled error
    })

    it("should not allow assigning on .cancel()", done => {
        // promise receiver should not be allowed to modify .cancel()
        // as it may cause unexpected result on other receivers
        const promise = CancelablePromise.cancelable(async (chain) => { });
        try {
            promise.cancel = () => { };
            done(new Error("should not allow changing .cancel()"))
        }
        catch (e) {
            done();
        }
    })

    it("should resolve with proper value", () => CancelablePromise.cancelable<number>((chain, manual) => {
        setTimeout(() => manual.resolve(765), 0);
        return 961;
    }, { manual: true }).then(value => {
        chai.assert.strictEqual(value, 765);
    }));

    it("should reject with proper value", () => CancelablePromise.cancelable<number>((chain, manual) => {
        setTimeout(() => manual.reject(346), 0);
    }, { manual: true }).then(() => {
        throw new Error("Unexpectedly resolved");
    }, value => {
        chai.assert.strictEqual(value, 346);
    }));

    it("should throw Cancel", () => {
        const promise = CancelablePromise.cancelable((chain, manual) => {
            chain.tillCanceled.then(() => manual.reject(new Cancel()));
        }, { manual: true });
        promise.cancel();
        return promise.then(() => {
            throw new Error("Unexpectedly resolved");
        }, err => {
            chai.assert(err instanceof Cancel, "error should be instanceof Cancel")
        })
    });

    it("should throw with proper value", () => CancelablePromise.cancelable((chain, manual) => {
        throw "Architect";
    }, { manual: true }).then(() => {
        throw new Error("Unexpectedly resolved");
    }, value => {
        chai.assert.strictEqual(value, "Architect");
    }));
});
