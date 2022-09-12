import * as mobx from 'mobx';

import { expect } from 'chai';

import { trackUndo } from '../src/undo';
import { reaction } from "mobx";

// Convenient set-as-an-action
const set = mobx.action(<T>(obsv: mobx.IObservableValue<T>, value: T) => {
    obsv.set(value);
});

describe("Mobx undo", () => {
    it("can undo initial change", () => {
        const obsv = mobx.observable.box<number>(123);
        const undo = trackUndo(() => obsv.get(), (v) => obsv.set(v));

        set(obsv, 456);
        expect(undo.hasUndo).to.equal(true);
        expect(undo.hasRedo).to.equal(false);
        expect(obsv.get()).to.equal(456);

        undo.undo();
        expect(undo.hasUndo).to.equal(false);
        expect(undo.hasRedo).to.equal(true);
        expect(obsv.get()).to.equal(123);
    });

    it("can repeatedly undo changes", () => {
        const obsv = mobx.observable.box<number>(123);
        const undo = trackUndo(() => obsv.get(), (v) => obsv.set(v));

        set(obsv, 456);
        set(obsv, 789);
        expect(undo.hasUndo).to.equal(true);
        expect(undo.hasRedo).to.equal(false);
        expect(obsv.get()).to.equal(789);

        undo.undo();
        expect(undo.hasUndo).to.equal(true);
        expect(undo.hasRedo).to.equal(true);
        expect(obsv.get()).to.equal(456);

        undo.undo();
        expect(undo.hasUndo).to.equal(false);
        expect(undo.hasRedo).to.equal(true);
        expect(obsv.get()).to.equal(123);
    });

    it("can repeatedly undo changes within an action", () => {
        const obsv = mobx.observable.box<number>(123);
        const undo = trackUndo(() => obsv.get(), (v) => obsv.set(v));

        set(obsv, 456);
        set(obsv, 789);
        expect(undo.hasUndo).to.equal(true);
        expect(undo.hasRedo).to.equal(false);
        expect(obsv.get()).to.equal(789);

        mobx.runInAction(() => {
            undo.undo();
            undo.undo();
        });
    
        expect(undo.hasUndo).to.equal(false);
        expect(undo.hasRedo).to.equal(true);
        expect(obsv.get()).to.equal(123);
    });

    it("does nothing if no undo is available", () => {
        const obsv = mobx.observable.box<number>(123);
        const undo = trackUndo(() => obsv.get(), (v) => obsv.set(v));

        set(obsv, 456);
        expect(obsv.get()).to.equal(456);

        undo.undo();
        expect(obsv.get()).to.equal(123);

        undo.undo();
        expect(obsv.get()).to.equal(123);
    });

    it("can redo changes", () => {
        const obsv = mobx.observable.box<number>(123);
        const undo = trackUndo(() => obsv.get(), (v) => obsv.set(v));

        set(obsv, 456);
        set(obsv, 789);
        expect(undo.hasUndo).to.equal(true);
        expect(undo.hasRedo).to.equal(false);
        expect(obsv.get()).to.equal(789);

        undo.undo();
        expect(undo.hasUndo).to.equal(true);
        expect(undo.hasRedo).to.equal(true);
        expect(obsv.get()).to.equal(456);

        undo.redo();
        expect(undo.hasUndo).to.equal(true);
        expect(undo.hasRedo).to.equal(false);
        expect(obsv.get()).to.equal(789);
    });

    it("does nothing if no redo is available", () => {
        const obsv = mobx.observable.box<number>(123);
        const undo = trackUndo(() => obsv.get(), (v) => obsv.set(v));

        set(obsv, 456);
        expect(obsv.get()).to.equal(456);

        undo.redo();
        expect(obsv.get()).to.equal(456);
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

    it("can track a property of an observable objects", () => {
        const myObservable = mobx.observable({ a: 1 });

        const myUndoer = trackUndo(
            () => myObservable.a,
            (value) => { myObservable.a = value }
        );

        myObservable.a = 2;
        myObservable.a = 3;
        myObservable.a = 1000;

        myUndoer.undo();
        myUndoer.undo();
        expect(myObservable.a).to.equal(2);

        myUndoer.redo();
        expect(myObservable.a).to.equal(3);
    });

    it("stops observing after dispose", () => {
        const obsv = mobx.observable.box<number>(123);
        const undo = trackUndo(() => obsv.get(), (v) => obsv.set(v));
        undo.dispose();
        expect(mobx.getObserverTree(obsv).observers).to.equal(undefined);
    });
    
    it("check reaction for hasUndo", (done) => {
        const obsv = mobx.observable.box<number>(123);
        const undo = trackUndo(() => obsv.get(), (v) => obsv.set(v));
    
        reaction(()=>undo.hasUndo,(hasUndo)=>{
            expect(hasUndo).to.equal(true);
            done()
        })
        set(obsv, 789);
        expect(undo.hasUndo).to.equal(true);
        expect(undo.hasRedo).to.equal(false);
        
    });
  
  it("check reaction for hasRedo", (done) => {
    const obsv = mobx.observable.box<number>(123);
    const undo = trackUndo(() => obsv.get(), (v) => obsv.set(v));
    
    reaction(()=>undo.hasRedo,(hasRedo)=>{
      expect(hasRedo).to.equal(true);
      done()
    })
    
    set(obsv, 789);
    expect(undo.hasUndo).to.equal(true);
    expect(undo.hasRedo).to.equal(false);
    undo.undo()
  
    expect(undo.hasUndo).to.equal(false);
    expect(undo.hasRedo).to.equal(true);
  });
  
});
