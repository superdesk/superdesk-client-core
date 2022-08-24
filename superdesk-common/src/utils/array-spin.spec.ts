import {describe, it} from 'mocha';
import * as assert from 'assert';
import {arraySpinForward, arraySpinBackwards} from './array-spin';

describe('utils.arraySpinForward', () => {
    it('can spin once', () => {
        assert.deepEqual(
            arraySpinForward(['a', 'b', 'c', 'd'], 1),
            ['b', 'c', 'd', 'a'],
        );
    });

    it('can spin multiple times', () => {
        assert.deepEqual(
            arraySpinForward(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], 4),
            ['e', 'f', 'g', 'h', 'a', 'b', 'c', 'd'],
        );
    });

    it('can spin more times than there are items in the array', () => {
        assert.deepEqual(
            arraySpinForward(['a', 'b', 'c', 'd'], 7),
            ['d', 'a', 'b', 'c'],
        );
    });
});

describe('utils.arraySpinBackwards', () => {
    it('can spin once', () => {
        assert.deepEqual(
            arraySpinBackwards(['a', 'b', 'c', 'd'], 1),
            ['d', 'a', 'b', 'c'],
        );
    });

    it('can spin multiple times', () => {
        assert.deepEqual(
            arraySpinBackwards(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], 4),
            ['e', 'f', 'g', 'h', 'a', 'b', 'c', 'd'],
        );
    });

    it('can spin more times than there are items in the array', () => {
        assert.deepEqual(
            arraySpinBackwards(['a', 'b', 'c', 'd'], 7),
            ['b', 'c', 'd', 'a'],
        );
    });
});
