import * as mobx from 'mobx';

export function trackUndo<T>(
    readObservable: () => T,
    setObservable: (value: T) => void
) {
    let isDisposed = false;

    const undoStack: T[] = [readObservable()];
    let undoPointer = mobx.observable.box(undoStack.length - 1); // Always points to the current value

    let stopTrackingChanges: () => void;
    const trackChanges = () => {
        stopTrackingChanges = mobx.reaction(readObservable, (newValue) => {
            if (isDisposed) throw new Error('Undo already disposed');

            undoPointer.set(undoPointer.get() + 1);
            undoStack[undoPointer.get()] = newValue;
            undoStack.length = undoPointer.get() + 1; // On change, trim any trailing redo's
        });
    };

    trackChanges();

    return mobx.observable({
        undo: mobx.action(() => {
            if (isDisposed) throw new Error('Undo already disposed');
            if (undoPointer.get() === 0) return; // No undos available

            undoPointer.set(undoPointer.get() - 1);

            // We have to make this change without our undo stack including it, but
            // whilst still letting other external viewers observe this as normal.
            stopTrackingChanges();
            setObservable(undoStack[undoPointer.get()]);
            trackChanges();
        }),
        redo: mobx.action(() => {
            if (isDisposed) throw new Error('Undo already disposed');
            if (undoPointer.get() >= undoStack.length - 1) return; // No redos available
            undoPointer.set(undoPointer.get() + 1);

            stopTrackingChanges();
            setObservable(undoStack[undoPointer.get()]);
            trackChanges();
        }),
        get hasUndo() {
            return undoPointer.get() !== 0;
        },
        get hasRedo() {
            return undoPointer.get() < undoStack.length - 1;
        },
        dispose: () => {
            stopTrackingChanges();
            isDisposed = true;
        }
    }
)}
