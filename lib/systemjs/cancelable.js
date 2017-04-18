System.register([], function (exports_1, context_1) {
    "use strict";
    var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __moduleName = context_1 && context_1.id;
    var CancelSymbol, Cancelable, CancelableChain, CancelablePromise, Cancel;
    return {
        setters: [],
        execute: function () {
            exports_1("CancelSymbol", CancelSymbol = Symbol("cancel"));
            Cancelable = class Cancelable {
                [CancelSymbol]() { }
                ;
            };
            exports_1("Cancelable", Cancelable);
            CancelableChain = class CancelableChain extends Function {
                constructor() {
                    super();
                    const cancelableChain = ((cancelable) => __awaiter(this, void 0, void 0, function* () {
                        if (!cancelable || typeof cancelable[CancelSymbol] !== "function") {
                            return cancelable; // do nothing for uncancelable objects
                        }
                        if (cancelableChain._canceled) {
                            throw new Cancel();
                        }
                        const list = cancelableChain._chainedList;
                        list.push(cancelable);
                        try {
                            return yield cancelable;
                        }
                        finally {
                            const index = list.indexOf(cancelable);
                            if (index === -1) {
                                // may be already removed by cancel()
                                return;
                            }
                            list.splice(index, 1);
                        }
                    }));
                    Object.setPrototypeOf(cancelableChain, CancelableChain.prototype);
                    cancelableChain._chainedList = [];
                    cancelableChain._canceled = false;
                    cancelableChain._tillCanceled = new Promise(resolve => {
                        cancelableChain._resolveTillCanceled = resolve;
                    });
                    return cancelableChain;
                }
                cancel() {
                    if (this._canceled) {
                        return;
                    }
                    this._canceled = true;
                    this._resolveTillCanceled();
                    while (this._chainedList.length) {
                        const cancelable = this._chainedList.shift();
                        setTimeout(() => {
                            cancelable[CancelSymbol]();
                        }, 0);
                    }
                }
                get canceled() {
                    return this._canceled;
                }
                get tillCanceled() {
                    return this._tillCanceled;
                }
                throwIfCanceled() {
                    if (this._canceled) {
                        throw new Cancel();
                    }
                }
            };
            exports_1("CancelableChain", CancelableChain);
            CancelablePromise = class CancelablePromise extends Promise {
                static cancelable(init) {
                    if (!(init instanceof Function)) {
                        throw new Error("Input should be a function");
                    }
                    const chain = new CancelableChain();
                    const promise = new CancelablePromise((resolve, reject) => {
                        Promise.resolve(init(chain)).then(value => {
                            chain.cancel();
                            resolve(value);
                        }, error => {
                            chain.cancel();
                            reject(error);
                        });
                    });
                    promise._cancelable = true;
                    promise._chain = chain;
                    return promise;
                }
                get [CancelSymbol]() {
                    if (this._cancelable) {
                        return this.cancel;
                    }
                }
                get cancelable() {
                    return !!this._cancelable;
                }
                cancel() {
                    this._chain.cancel();
                }
            };
            exports_1("CancelablePromise", CancelablePromise);
            Cancel = class Cancel {
                constructor(message) {
                    this.message = message;
                }
                toString() {
                    if (!this.message || !this.message.length) {
                        return "Cancel";
                    }
                    else {
                        return `Cancel: ${this.message}`;
                    }
                }
            };
            exports_1("Cancel", Cancel);
        }
    };
});
//# sourceMappingURL=cancelable.js.map