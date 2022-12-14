import {describe, it} from 'mocha';
import {strict as assert} from 'assert';
import {arrayInsertAtIndex} from './array-insert-at-index';

describe('data-structures.arrayInsertAtIndex', () => {
    it('inserts at the start', () => {
        assert.deepEqual(
            arrayInsertAtIndex(['a', 'b', 'c'], '3', 0),
            ['3', 'a', 'b', 'c'],
        );
    });

    it('inserts at the end', () => {
        assert.deepEqual(
            arrayInsertAtIndex(['a', 'b', 'c'], '3', 3),
            ['a', 'b', 'c', '3'],
        );
    });

    it('inserts in the middle', () => {
        assert.deepEqual(
            arrayInsertAtIndex(['a', 'b', 'c'], '3', 1),
            ['a', '3', 'b', 'c'],
        );
    });
});
