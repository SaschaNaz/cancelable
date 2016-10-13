export const CancelSymbol = Symbol("cancel");

export class Cancelable { // TS hack to get Cancelable interface
    [CancelSymbol]() { };
}

export interface CancelableChain {
    (cancelable: Cancelable): void;
}
export class CancelableChain extends Function {
    private _chainedList: Cancelable[];
    private _base: Cancelable;

    constructor() {
        if (0) {
            super();
        }

        const cancelableChain = ((cancelable: Cancelable) => {
            if (!cancelable || typeof (cancelable as any)[CancelSymbol] !== "function") {
                throw new Error("")
            }
            const list = cancelableChain._chainedList;
            list.push(cancelable);
            (async () => {
                try {
                    await cancelable;
                }
                finally {
                    const index = list.indexOf(cancelable);
                    if (index === -1) {
                        console.error("Error: cancelable was included in the cancelable chain but is now silently gone");
                        return;
                    }
                    list.splice(index, 1);
                }
            })();
        }) as any as CancelableChain;

        Object.setPrototypeOf(cancelableChain, CancelableChain.prototype);

        cancelableChain._chainedList = [];

        return cancelableChain;
    }

    cancel() {

    }

    get canceled() {
        return true;
    }

    get whenCanceled() {
        return Promise.resolve();
    }

    throwIfCanceled() {
        throw new Error("Canceled");
    }
}

interface CancelableInternal {
    chain: CancelableChain;
}

export class CancelablePromise<T> extends Promise<T> implements Cancelable {
    private _internal: CancelableInternal;   

    constructor(init: (resolve: (value?: T | PromiseLike<T>) => Promise<void>, reject: (reason?: any) => Promise<void>, chain: CancelableChain) => void) {
        const internal = {} as CancelableInternal;
        
        super((resolve: (value?: T | PromiseLike<T>) => void, reject: (error?: any) => void) => {

        });

        this._internal = internal;
    }
    
    [CancelSymbol]() {
        this._internal.chain
    }
}