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
    private _canceled: boolean;
    private _tillCanceled: Promise<void>;
    private _resolveTillCanceled: () => void;

    constructor() {
        super();

        const cancelableChain = (async (cancelable: Cancelable) => {
            if (!cancelable || typeof (cancelable as any)[CancelSymbol] !== "function") {
                throw new Error("")
            }
            const list = cancelableChain._chainedList;
            list.push(cancelable);
            
            try {
                await cancelable;
            }
            finally {
                const index = list.indexOf(cancelable);
                if (index === -1) {
                    // may be already removed by cancel()
                    return;
                }
                list.splice(index, 1);
            }
        }) as any as CancelableChain;

        Object.setPrototypeOf(cancelableChain, CancelableChain.prototype);

        cancelableChain._chainedList = [];
        cancelableChain._canceled = false;
        cancelableChain._tillCanceled = new Promise<void>(resolve => {
            cancelableChain._resolveTillCanceled = resolve;
        });

        return cancelableChain;
    }

    cancel() {
        this._canceled = true;
        this._resolveTillCanceled();
        while (this._chainedList.length) {
            const cancelable = this._chainedList.shift();
            setTimeout(() => {
                (cancelable as any)[CancelSymbol]();
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