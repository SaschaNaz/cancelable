export const CancelSymbol = Symbol("cancel");

export class Cancelable { // TS hack to get Cancelable interface
    [CancelSymbol]() { };
}

export interface CancelableChain {
    <T>(cancelable: T | Promise<T>): Promise<T>;
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
                return cancelable; // do nothing for uncancelable objects
            }
            if (cancelableChain._canceled) {
                throw new Cancel();
            }
            const list = cancelableChain._chainedList;
            list.push(cancelable);

            try {
                return await cancelable;
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

    throwIfCanceled(): void {
        if (this._canceled) {
            throw new Cancel();
        }
    }
}

export class CancelablePromise<T> extends Promise<T> implements Cancelable {
    private _chain: CancelableChain;
    private _cancelable: boolean;

    static cancelable<T>(init: (chain: CancelableChain) => T | Promise<T>): CancelablePromise<T> {
        if (!(init instanceof Function)) {
            throw new Error("Input should be a function");
        }

        type Resolver = (value?: T | PromiseLike<T>) => void;
        type Rejector = (error?: any) => void;

        const chain = new CancelableChain();

        const promise = new CancelablePromise<T>((resolve, reject) => {
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
}

export class Cancel {
    public message: string;

    constructor(message?: string) {
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