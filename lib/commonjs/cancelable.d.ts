export declare const CancelSymbol: symbol;
export declare class Cancelable {
}
export interface CancelableChain {
    <T>(cancelable: T | Promise<T>): Promise<T>;
}
export declare class CancelableChain extends Function {
    private _chainedList;
    private _base;
    private _canceled;
    private _tillCanceled;
    private _resolveTillCanceled;
    constructor();
    cancel(): void;
    readonly canceled: boolean;
    readonly tillCanceled: Promise<void>;
    throwIfCanceled(): void;
}
export interface CancelablePromiseManualController<T> {
    resolve: (value?: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
}
export declare class CancelablePromise<T> extends Promise<T> implements Cancelable {
    private _chain;
    private _cancelable;
    static cancelable<T>(init: (chain: CancelableChain) => T | Promise<T>): CancelablePromise<T>;
    static cancelable<T>(init: (chain: CancelableChain, manual: CancelablePromiseManualController<T>) => void, options: {
        manual: true;
    }): CancelablePromise<T>;
    readonly cancelable: boolean;
    cancel: () => void;
}
export declare class Cancel {
    message: string;
    constructor(message?: string);
    toString(): string;
}
