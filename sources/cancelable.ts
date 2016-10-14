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
                // Problem: cancelablePromise.then constructs CancelablePromise -> constructs chain -> promise -> chain -> ...
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
        if (this._canceled) {
            return;
        }
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

export class CancelablePromise<T> extends Promise<T> implements Cancelable {
    private _chain: CancelableChain;
    private _rejectSuper: (error?: any) => void; 

    constructor(init: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void, chain: CancelableChain) => void) {
        type Resolver = (value?: T | PromiseLike<T>) => void;
        type Rejector = (error?: any) => void;
        let resolveSuper: Resolver;
        let rejectSuper: Rejector;

        super((resolve: Resolver, reject: Rejector) => {
            resolveSuper = resolve;
            rejectSuper = reject;
        });

        this._chain = new CancelableChain();
        this._rejectSuper = rejectSuper;

        init(resolveSuper, rejectSuper, this._chain); // TODO: what if chain.cancel() is called after reject()?
    }
    
    [CancelSymbol]() {
        this._chain.cancel();
    }
}