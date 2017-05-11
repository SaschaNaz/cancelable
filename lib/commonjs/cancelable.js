"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelSymbol = Symbol("cancel");
class Cancelable {
    [exports.CancelSymbol]() { }
    ;
}
exports.Cancelable = Cancelable;
class CancelableChain extends Function {
    constructor() {
        super();
        const cancelableChain = ((input) => __awaiter(this, void 0, void 0, function* () {
            function checkPromiseLike(x) {
                return x != null && typeof x.then === "function";
            }
            function checkCancelable(x) {
                return x != null && typeof x[exports.CancelSymbol] === "function";
            }
            const isCancelable = checkCancelable(input);
            if (!checkPromiseLike(input)) {
                cancelableChain.throwIfCanceled();
                if (!isCancelable) {
                    return input; // do nothing for uncancelable objects
                }
            }
            const list = cancelableChain._chainedList;
            if (isCancelable) {
                list.push(input);
            }
            try {
                const result = yield input;
                cancelableChain.throwIfCanceled();
                return result;
            }
            finally {
                if (isCancelable) {
                    const index = list.indexOf(input);
                    // may be already removed by cancel() if -1
                    if (index !== -1) {
                        list.splice(index, 1);
                    }
                }
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
                cancelable[exports.CancelSymbol]();
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
}
exports.CancelableChain = CancelableChain;
class CancelablePromise extends Promise {
    static cancelable(init, options = {}) {
        if (!(init instanceof Function)) {
            throw new Error("Input should be a function");
        }
        const chain = new CancelableChain();
        const promise = new CancelablePromise((resolve, reject) => {
            if (!options.manual) {
                Promise.resolve(init(chain)).then(value => {
                    chain.cancel();
                    resolve(value);
                }, error => {
                    chain.cancel();
                    reject(error);
                });
            }
            else {
                Promise.resolve(init(chain, { resolve, reject })).catch(reject);
            }
        });
        promise._cancelable = true;
        promise._chain = chain;
        return promise;
    }
    get [exports.CancelSymbol]() {
        if (this._cancelable) {
            return this.cancel;
        }
    }
    get cancelable() {
        return !!this._cancelable;
    }
}
exports.CancelablePromise = CancelablePromise;
Object.defineProperty(CancelablePromise.prototype, "cancel", {
    writable: false,
    value: function () { this._chain.cancel(); }
});
class Cancel {
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
}
exports.Cancel = Cancel;
//# sourceMappingURL=cancelable.js.map