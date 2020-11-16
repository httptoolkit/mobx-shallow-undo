import * as mobx from 'mobx';

export function trackUndo<T>(
    readObservable: () => T,
    setObservable: (value: T) => void
) {
    let isDisposed = false;

    const undoStack: T[] = [readObservable()];
    let undoPointer = undoStack.length - 1; // Always points to the current value

    let stopTrackingChanges: () => void;
    const trackChanges = () => {
        stopTrackingChanges = mobx.reaction(readObservable, (newValue) => {
            if (isDisposed) throw new Error('Undo already disposed');

            undoPointer += 1;
            undoStack[undoPointer] = newValue;
            undoStack.length = undoPointer + 1; // On change, trim any trailing redo's
        });
    };

    trackChanges();

    return {
        undo: mobx.action(() => {
            if (isDisposed) throw new Error('Undo already disposed');
            if (undoPointer === 0) return; // No undos available

            undoPointer -= 1;

            // We have to make this change without our undo stack including it, but
            // whilst still letting other external viewers observe this as normal.
            stopTrackingChanges();
            setObservable(undoStack[undoPointer]);
            trackChanges();
        }),
        redo: mobx.action(() => {
            if (isDisposed) throw new Error('Undo already disposed');
            if (undoPointer >= undoStack.length - 1) return; // No redos available
            undoPointer += 1;

            stopTrackingChanges();
            setObservable(undoStack[undoPointer]);
            trackChanges();
        }),
        dispose: () => {
            stopTrackingChanges();
            isDisposed = true;
        }
    }
}