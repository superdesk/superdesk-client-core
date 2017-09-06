import {ContentState} from 'draft-js';
import {keyAndOffset, absoluteOffset, shift} from '../offsets';

const blockArrayFromText = (...blocks) =>
    ContentState
        .createFromText(blocks.join('\r\n'))
        .getBlocksAsArray();

// flatComments returns an array of objects denoting start and end offsets
// marked by opening ([) and closing (]) brackets within the string s.
const flatComments = (s) =>
    Array.prototype.reduce.call(s, (f, c, i) => {
        const len = f.length;

        if (c === '[') {
            f.push({start: i - len * 2});
        }
        if (c === ']') {
            f[len - 1].end = i - len * 2 + 1;
        }
        return f;
    }, []);

// shiftTest runs a test of the shift function, using the given expect func (expFn),
// passing (c1, n, offset) to shift and expecting c2 in return.
const shiftTest = (msg, expFn, c1, c2, n, offset = 0) => {
    const a = shift(flatComments(c1), n, offset);
    const b = flatComments(c2);
    const isEqual = _.isEqual(a, b);

    expFn(a.length).toEqual(b.length);

    if (!isEqual) {
        // eslint-disable-next-line no-console
        console.log(`${msg} failed (n=${n} offset=${offset}): `, a, b);
    }

    expFn(isEqual).toBeTruthy();
};

describe('editor3.comments.offsets', () => {
    it('keyAndOffset', () => {
        const blocks = blockArrayFromText('0123', '456', '78');
        const k = (i) => blocks[i].getKey();
        const contentState = ContentState.createFromBlockArray(blocks);

        // The object below contains test cases for the blocks defined above.
        // The key holds the absolute index, and the value holds the expected
        // return values (block key and the relative index of that character).
        Object.entries({
            0: [k(0), 0],
            1: [k(0), 1],
            2: [k(0), 2],
            3: [k(0), 3],
            4: [k(1), 0], // ie. absolute character 4 maps to block 1 character 0
            5: [k(1), 1],
            6: [k(1), 2],
            7: [k(2), 0],
            8: [k(2), 1]
        }).forEach(([n, [key, offset]]) => {
            expect(keyAndOffset(contentState, parseInt(n, 10))).toEqual({key, offset});
        });
    });

    it('absoluteOffset', () => {
        const blocks = blockArrayFromText('0123', '456', '78');
        const k = (i) => blocks[i].getKey();
        const contentState = ContentState.createFromBlockArray(blocks);

        // The array holds test cases. The first two items are the function input
        // (block key and relative index) and the third item is the expected output
        // (absolute index).
        [
            [k(0), 0, 0],
            [k(0), 1, 1],
            [k(0), 2, 2],
            [k(0), 3, 3],
            [k(1), 0, 4], // ie. on block 1, character 0 has absolute offset 3
            [k(1), 1, 5],
            [k(1), 2, 6],
            [k(2), 0, 7],
            [k(2), 1, 8]
        ].forEach(([key, offset, n]) => {
            expect(absoluteOffset(contentState, key, offset)).toBe(n);
        });
    });

    it('flatComments test method', () => {
        expect(_.isEqual(flatComments('[01][2]3[45]6[789]0[12345]67[890]'), [
            {start: 0, end: 2},
            {start: 2, end: 3},
            {start: 4, end: 6},
            {start: 7, end: 10},
            {start: 11, end: 16},
            {start: 18, end: 21}
        ])).toBeTruthy();
    });

    it('shift additions', () => {
        [
            ['0123[4567]890[123]45', 2, 3, '0123..[4567]890[123]45'],
            ['0123[4567]890[123]45', 2, 8, '0123[4567]8..90[123]45'],
            ['0123[4567]890[123]45', 2, 14, '0123[4567]890[123]4..5'],
            ['0123[4567]890[123]45', 2, 4, '0123[4..567]890[123]45'],
            ['0123[4567]890[123]45', 2, 3, '0123..[4567]890[123]45'],
            ['0123[4567]890[123]45', 3, 7, '0123[4567...]890[123]45'],
            ['0123[4567]890[123]45', 3, 11, '0123[4567]890[1...23]45']
        ].forEach(([a, n, offset, b]) => shiftTest('additions', expect, a, b, n, offset));
    });

    it('shift deletions', () => {
        [
            ['0123[4567]890[123]45', -2, 1, '01[4567]890[123]45'],
            ['0123[4567]890[123]45', -2, 8, '0123[4567]8[123]45'],
            ['0123[4567]890[123]45', -1, 14, '0123[4567]890[123]4'],
            ['0123[4567]890[123]45', -2, 3, '0123[67]890[123]45'],
            ['0123[4567]890[123]45', -2, 4, '0123[47]890[123]45'],
            ['0123[4567]890[123]45', -2, 5, '0123[45]890[123]45'],
            ['0123[4567]890[123]45', -2, 7, '0123[4567]0[123]45'],
            ['0123[4567]890[123]45', -3, 7, '0123[4567][123]45'],
            ['0123[4567]890[123]45', -1, 10, '0123[4567]890[23]45'],
            ['0123[4567]890[123]45', -2, 11, '0123[4567]890[1]45'],
            ['0123[4567]890[123]45', -1, 14, '0123[4567]890[123]4'],
            ['0123[4567]890[123]45', 0, 0, '0123[4567]890[123]45'],
        ].forEach(([a, n, offset, b]) => shiftTest('deletions', expect, a, b, n, offset));
    });
});
