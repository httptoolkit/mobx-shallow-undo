import { expect } from 'chai';

import { undo } from '../src/undo';

describe("Mobx shallo wundo", () => {
    it("can run a test", () => {
        expect(undo).to.equal(undefined);
        expect(1 + 1).to.equal(2);
    });
});