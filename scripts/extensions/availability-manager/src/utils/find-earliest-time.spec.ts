import {it} from 'mocha';
import * as assert from 'assert';
import {findEarliestTime} from './find-earliest-time';

it('can find earliest time', () => {
    assert.strictEqual(
        findEarliestTime([
            '13:11',
            '14:11',
            '00:11',
            '01:11',
            '22:11',
            '23:11',
        ]),
        '00:11',
    );
});