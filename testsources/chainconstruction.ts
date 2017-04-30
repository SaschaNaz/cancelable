import * as chai from "chai";
import { Cancel, CancelSymbol, CancelableChain } from "../built/commonjs/cancelable.js";

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
        chain(stub).catch(err => { }); // prevent promise unhandled error
        chain.cancel();
        chai.assert(chain.canceled, ".canceled should be true");
    });

    it("should be called", done => {
        const chain = new CancelableChain();
        let canceled = false;
        chai.assert(chain.tillCanceled instanceof Promise, "tillCanceled should exist");
        chain.tillCanceled.then(() => {
            chai.assert(canceled, "tillCanceled should be resolved after cancel() call");
            done();
        });
        setTimeout(() => {
            chain.cancel();
            canceled = true;
        }, 0);
    });

    it("should throw", done => {
        const chain = new CancelableChain();
        setTimeout(() => {
            try {
                chain.throwIfCanceled();
            }
            catch (c) {
                chai.assert(c instanceof Cancel, "A cancel object should be instance of Cancel")
                done();
            }
        })
        chain.cancel();
    });

    it("should not throw", done => {
        const chain = new CancelableChain();
        setTimeout(() => {
            try {
                chain.throwIfCanceled();
                done();
            }
            catch (err) { }
        })
    });

    it("should throw error thrown by chained task", done => {
        (async () => {
            const chain = new CancelableChain();
            try {
                await chain(Promise.reject(new Error("wow")));
            }
            catch (err) {
                chai.assert(err.message === "wow");
                done();
            }
        })();
    })

    it("should throw Cancel after cancelation", done => {
        const chain = new CancelableChain();
        const stub = {
            [CancelSymbol]() { }
        }

        chain.cancel();
        chai.assert(chain.canceled, "status should be 'canceled'");
        (async () => {
            try {
                await chain(stub);
            }
            catch (c) {
                chai.assert(c instanceof Cancel, "The thrown object should be an instance of Cancel");
                done();
            }
        })();
    });

    it("should throw Cancel after cancelation when receiving non-cancelable non-Promise", done => {
        const chain = new CancelableChain();
        chain.cancel();

        (async () => {
            try {
                await chain(3);
            }
            catch (c) {
                chai.assert(c instanceof Cancel, "The thrown object should be an instance of Cancel");
                done();
            }
        })().catch(done);
    });

    it("should throw Cancel after cancelation when receiving Promise", done => {
        const chain = new CancelableChain();
        chain.cancel();
        let foo = 0;

        (async () => {
            try {
                await chain(new Promise(resolve => {
                    foo = 3;
                    resolve();
                }));
            }
            catch (c) {
                chai.assert(foo === 3);
                chai.assert(c instanceof Cancel, "The thrown object should be an instance of Cancel");
                done();
            }
        })().catch(done);
    });

    it("should throw non-Cancel even after cancelation", done => {
        const chain = new CancelableChain();
        chain.cancel();
        let foo = 0;

        (async () => {
            try {
                await chain(new Promise((resolve, reject) => {
                    foo = 3;
                    reject("Gourai");
                }));
            }
            catch (e) {
                chai.assert(foo === 3);
                chai.assert(e === "Gourai")
                done();
            }
        })().catch(done);
    });

    it("should just pass an uncancelable object", done => {
        const chain = new CancelableChain();

        const o = {};
        chain(o).then(pass => {
            chai.assert(pass === o, "should be same object");
            done(); // this line must run
        });
    });

    it("should just pass null", async () => {
        const chain = new CancelableChain();
        chai.assert(await chain(null) === null);
    });

    it("should pass promise wrapped value", async () => {
        const chain = new CancelableChain();
        chai.assert(await chain(Promise.resolve(3)) === 3);
    });
})