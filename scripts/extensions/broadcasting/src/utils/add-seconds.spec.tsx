import {describe, it} from 'mocha';
import {equal} from 'assert';
import {addSeconds} from './add-seconds';

describe('utils.addSeconds', () => {
    it('adds one hour', () => {
        equal(addSeconds('12:31', 3600), '13:31:00.000');
    });
});