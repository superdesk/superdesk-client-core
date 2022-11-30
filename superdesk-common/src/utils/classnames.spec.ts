import {describe, it} from 'mocha';
import * as assert from 'assert';
import {classnames} from './classnames';

describe('utils.classnames', () => {
    it('object only', () => {
        assert.deepEqual(
            classnames({one: true, two: true, three: false, four: false, five: true}),
            'one two five',
        );
    });

    it('object with a static value', () => {
        assert.deepEqual(
            classnames('static-1 static-2', {one: true, two: true, three: false, four: false, five: true}),
            'static-1 static-2 one two five',
        );
    });
});
