import {toServerDateFormat} from './utils';

describe('utils', () => {
    describe('toServerDateFormat', () => {
        it('can convert to server format without switching to UTC', () => {
            const d = new Date('2023-11-06T16:00:00');

            expect(d.toISOString()).toEqual('2023-11-06T15:00:00.000Z');
            expect(toServerDateFormat(d)).toEqual('2023-11-06T16:00:00');
        });
    });
});
