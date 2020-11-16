# mobx-shallow-undo [![Build Status](https://github.com/httptoolkit/mobx-shallow-undo/workflows/CI/badge.svg)](https://github.com/httptoolkit/mobx-shallow-undo/actions) [![Available on NPM](https://img.shields.io/npm/v/mobx-shallow-undo.svg)](https://npmjs.com/package/mobx-shallow-undo)

> _Part of [HTTP Toolkit](https://httptoolkit.tech): powerful tools for building, testing & debugging HTTP(S)_

**Drop-in undo &amp; redo for shallow changes in Mobx**

Mobx-shallow-undo is a tiny zero-dependency library for shallow undo/redo on any mobx observable value.

This is designed for simple cases, where a single observable value (or a single property of an observable object) is changing between immutable values. It does _not_ handle mutations inside the value or track undo states recursively, it just tracks the shallow undo/redo state of an observable.

That means you can do this:

```javascript
import * as mobx from 'mobx';
import { trackUndo } from 'mobx-shallow-undo';

const myObservable = mobx.observable({ a: 1 });

const myUndoer = trackUndo(
    // Getter, this will be observed:
    () => myObservable.a,
    // Setter, to reset the value on undo/redo:
    (value) => { myObservable.a = value }
);

myObservable.a = 2;
myObservable.a = 3;
myObservable.a = 1000;

myUndoer.undo();
myUndoer.undo();

// myObservable = { a: 2 };

myUndoer.redo();
// myObservable = { a: 3 };
```

## Getting Started

```bash
npm install mobx-shallow-undo
```

```javascript
import { trackUndo } from 'mobx-shallow-undo';

const undoer = trackUndo(
    () => /* Read the undoable observable */,
    (value) => { /* Update the undoable observable */ }
);

undoer.undo(); // Undo the last change, if possible
undoer.redo(); // Redo the last undo, if possible
```

## API

### `trackUndo(getter, setter)`

Creates an undoer. `getter` and `setter` must be synchronous functions to get and set an observable value.

The getter takes no arguments, whilst the setter takes one argument: the new value.

This returns an `undoer`.

### `undoer.undo()`

Undoes the latest change. If the undo stack is empty this does nothing.

### `undoer.redo()`

Redoes the latest undo. If we're already on the latest change this does nothing.

Changes to the observed value after an undo clear the redo stack, just like undo in every other application.

### `undoer.dispose()`

Stops observing the observable and throws away all historical data.

Any future calls to `undo()` or `redo()` will throw an error.