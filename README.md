# cancelable ![Travis-CI build result](https://travis-ci.org/SaschaNaz/cancelable.svg?branch=master)
This proposal keeps the "third state" idea from [cancelable-promise](https://github.com/domenic/cancelable-promise) but tries removing additional argument for cancelation.

###### TODO
- `chain` keyword is easy to confuse with normal promise `then` chain.

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
- `promise[@@cancel]`

New `CancelableChain` object is passed to promise constructor callback. This object can store other promises and cancel them when its underlying promise gets canceled. Its constructor is exposed to make a standalone chain instead of Promise dependant one.

```
interface CancelableChain {
  constructor(): CancelableChain;

  /*
   * `chain()` stores objects that supports `@@cancel` and call it
   * if its underlying promise gets canceled.
   */
  (promise): void;

  cancel(): void; // same as current `cancel` parameter to shorten the parameter list
  
  canceled: boolean; // true when underlying promise is canceled
  whenCanceled: Promise<void>; // resolves when underlying promise gets canceled
  /*
   * throws CancelError when underlying promise gets canceled, otherwise returns nothing
   */
  throwIfCanceled: void;
  
  [[chainedPromises]]: Promise[]; // stored cancelable promises.
  [[basePromise]]: Promise; // underlying promise, undefined when standalone. `cancel()` cancels this if defined.
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
    if (!chain.canceled) {
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
  if (!chain.canceled) { // chain as keyword
    await b();
  }
}
```

## Token style to chain style

`promise.chain(promise)` returns input promise so that promise.then can happen after chaining.

```js
let chain = new CancelableChain();
chain(fetch())
  .then(() => chain(process()));

chain.cancel();
```

This example with `.then()` works basically same as the following example.

```js
let chain = new CancelableChain();
chain(fetchAndProcess());

chain.cancel();

cancelable function fetchAndProcess() {
  chain fetch();
  chain process();
}
```
