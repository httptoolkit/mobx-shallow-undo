import * as mobx from 'mobx';

import { expect } from 'chai';

import { trackUndo } from '../src/undo';

// Convenient set-as-an-action
const set = mobx.action(<T>(obsv: mobx.IObservableValue<T>, value: T) => {
    obsv.set(value);
});

describe("Mobx undo", () => {
    it("can undo initial change", () => {
        const obsv = mobx.observable.box<number>(123);
        const undo = trackUndo(() => obsv.get(), (v) => obsv.set(v));

        set(obsv, 456);
        expect(obsv.get()).to.equal(456);

        undo.undo();
        expect(obsv.get()).to.equal(123);
    });

    it("can repeatedly undo changes", () => {
        const obsv = mobx.observable.box<number>(123);
        const undo = trackUndo(() => obsv.get(), (v) => obsv.set(v));

        set(obsv, 456);
        set(obsv, 789);
        expect(obsv.get()).to.equal(789);

        undo.undo();
        expect(obsv.get()).to.equal(456);

        undo.undo();
        expect(obsv.get()).to.equal(123);
    });

    it("can repeatedly undo changes within an action", () => {
        const obsv = mobx.observable.box<number>(123);
        const undo = trackUndo(() => obsv.get(), (v) => obsv.set(v));

        set(obsv, 456);
        set(obsv, 789);
        expect(obsv.get()).to.equal(789);

        mobx.runInAction(() => {
            undo.undo();
            undo.undo();
        });

        expect(obsv.get()).to.equal(123);
    });

    it("can redo changes", () => {
        const obsv = mobx.observable.box<number>(123);
        const undo = trackUndo(() => obsv.get(), (v) => obsv.set(v));

        set(obsv, 456);
        set(obsv, 789);
        expect(obsv.get()).to.equal(789);

        undo.undo();
        expect(obsv.get()).to.equal(456);

        undo.redo();
        expect(obsv.get()).to.equal(789);
    });

    it("can resets redo stack after changes", () => {
        const obsv = mobx.observable.box<number>(123);
        const undo = trackUndo(() => obsv.get(), (v) => obsv.set(v));

        set(obsv, 456);
        set(obsv, 789);
        expect(obsv.get()).to.equal(789);

        undo.undo();
        expect(obsv.get()).to.equal(456);

        set(obsv, 0);
        expect(obsv.get()).to.equal(0);

        undo.redo(); // No-op
        expect(obsv.get()).to.equal(0);
    });

    it("stops observing after dispose", () => {
        const obsv = mobx.observable.box<number>(123);
        const undo = trackUndo(() => obsv.get(), (v) => obsv.set(v));
        undo.dispose();
        expect(mobx.getObserverTree(obsv).observers).to.equal(undefined);
    });
});