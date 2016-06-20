# cancelable
This proposal keeps the "third state" idea from [cancelable-promise](https://github.com/domenic/cancelable-promise) but tries removing additional argument for cancelation.

###### TODO
- `chain` keyword is easy to confuse with normal promise `then` chain.
- No `promise.cancel()` there while I thought there is. Chaining behavior on `CancelableChain` may be exposed to support this.

## API that kept

>- Promise additions:
  - ~~`new Promise((resolve, reject, cancel) => { ... })`~~
  - `Promise.cancel(cancelation)`
  - `promise.then(onFulfilled, onRejected, onCanceled)`
  - `promise.cancelCatch(cancelation => { ... })`
- Promise behavior changes:
  - `Promise.all` will cancel its result upon the first canceled promise in the passed iterable.
  - `Promise.race` will ignore canceled promises in the passed iterable, unless all of the promises become canceled, in which case it will return a promise canceled with an array of cancelations.
- Language additions:
  - `try { ... } cancel catch (cancelation) { ... }`
  - `cancel throw cancelation`
  - `generator.cancelThrow(cancelation)`

## Differences from [cancelable-promise](https://github.com/domenic/cancelable-promise)

- `new Promise((resolve, reject, chain) => { /* ... */ });`
- `promise.chain(promise)`

The following is the structure of `chain` object. 

```
interface CancelableChain {
  /*
   * `chain()` stores cancelable promises and cancel them all
   * if its underlying promise gets canceled.
   */
  (promise): void;

  cancel(): void; // same as current `cancel` parameter to shorten the parameter list
  
  isCanceled: boolean; // true when underlying promise is canceled
  whenCanceled: Promise<void>; // resolves when underlying promise gets canceled
  /*
   * throws CancelError when underlying promise gets canceled, otherwise returns nothing
   */
  throwIfCanceled: void;
}
```

## Use

```js
function inner() {
  return new Promise(async (resolve, reject, chain) => {
    await a();
    chain.throwIfCanceled();
    await b();
    resolve();
  });
}

function outer() {
  return new Promise(async (resolve, reject, chain) => {
    await chain(inner()); // cancels inner() when parent promise gets canceled
    resolve();
  });
}
```

```js
function inner() {
  return new Promise(async (resolve, reject, chain) => {
    await a();
    if (!chain.isCanceled) {
      await b();
    }
    resolve();
  });
}
```

```js
function inner() {
  return new Promise(async (resolve, reject, chain) => {
    chain.whenCanceled.then(() => reject());
    await a();
    resolve();
  });
}
```

## Syntax sugar

A `cancelable function` has a new `chain` keyword in its function scope.

```js
cancelable function inner() {
  await a();
  chain.throwIfCanceled(); // chain as keyword, a form like `new.target`
  await b();
}

cancelable function outer() {
  chain inner(); // store inner() promise to cancellation chain
}
```

```js
cancelable function inner() {
  await a();
  if (!chain.isCanceled) { // chain as keyword
    await b();
  }
}
```

## Token style to chain style

`promise.chain(promise)` returns input promise so that promise.then can happen after chaining.

```js
let c = new Promise();
c.chain(fetch())
  .then(() => c.chain(process()));

c.cancel();
```

This example with `.then()` works basically same as the following example.

```
let c = new Promise();
c.chain(fetchAndProcess());

c.cancel();

cancelable function fetchAndProcess() {
  chain fetch();
  chain process();
}
```
