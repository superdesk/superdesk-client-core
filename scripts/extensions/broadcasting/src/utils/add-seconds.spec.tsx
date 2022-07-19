import {describe, it} from 'mocha';
import * as assert from 'assert';
import {addSeconds} from './add-seconds';

describe('utils.addSeconds', () => {
    it('adds one hour', () => {
        assert.equal(
            addSeconds('12:31', 3600),
            '13:31:00.000',
        );
    });
});