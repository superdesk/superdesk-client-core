import {describe, it} from 'mocha';
import {strict as assert} from 'assert';
import {arrayMove} from './array-move';

describe('data-structures.arrayMove', () => {
    it('moves the item at index 1 to index 3', () => {
        assert.deepEqual(
            arrayMove(['q', 'w', 'e', 'r', 't', 'y'], 1, 3),
            ['q', 'e', 'r', 'w', 't', 'y'],
        );
    });
});
