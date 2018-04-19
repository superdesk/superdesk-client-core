import {ContentState} from 'draft-js';
import {keyAndOffset, shift} from '../offsets';// CAN OTHERS BE REMOVED?

const blockArrayFromText = (...blocks) =>
    ContentState
        .createFromText(blocks.join('\r\n'))
        .getBlocksAsArray();

describe('editor3.highlights.offsets', () => {
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
            8: [k(2), 1],
        }).forEach(([n, [key, offset]]) => {
            expect(keyAndOffset(contentState, parseInt(n, 10))).toEqual({key, offset});
        });
    });

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

    it('flatComments test method', () => {
        expect(_.isEqual(flatComments('[01][2]3[45]6[789]0[12345]67[890]'), [
            {start: 0, end: 2},
            {start: 2, end: 3},
            {start: 4, end: 6},
            {start: 7, end: 10},
            {start: 11, end: 16},
            {start: 18, end: 21},
        ])).toBeTruthy();
    });

    // shiftTest runs a test of the shift function, using the given expect func (expFn),
    // passing (c1, n, offset) to shift and expecting c2 in return.
    const shiftTest = (msg, expFn, c1, c2, n, offset = 0) => {
        const got = shift(flatComments(c1), n, offset);
        const want = flatComments(c2);
        const isEqual = _.isEqual(got, want);

        expFn(got.length).toEqual(want.length);

        if (!isEqual) {
            // eslint-disable-next-line no-console
            console.log(`${msg} failed (n=${n} offset=${offset}): `, got, want);
        }

        expFn(isEqual).toBeTruthy();
    };

    it('shift additions', () => {
        [
            // middles:
            ['0123[4567]890[123]45', 2, 3, '0123..[4567]890[123]45'],
            ['0123[4567]890[123]45', 2, 8, '0123[4567]8..90[123]45'],
            ['0123[4567]890[123]45', 2, 14, '0123[4567]890[123]4..5'],
            ['0123[4567]890[123]45', 2, 4, '0123..[4567]890[123]45'],
            ['0123[4567]890[123]45', 2, 3, '012..3[4567]890[123]45'],
            ['0123[4567]890[123]45', 3, 8, '0123[4567]...890[123]45'],
            ['0123[4567]890[123]45', 3, 12, '0123[4567]890[1...23]45'],
            // edges:
            ['[012]3[4567]890[123]45', 2, 0, '..[012]3[4567]890[123]45'],
            ['0123[4567]890[12345]', 3, 16, '0123[4567]890[12345]...'],
        ].forEach(([a, n, offset, b]) => shiftTest('additions', expect, a, b, n, offset));
    });

    it('shift deletions', () => {
        [
            // delete outside:
            ['0123[4567]890[123]45', -2, 1, '03[4567]890[123]45'],
            ['0123[4567]890[123]45', -2, 8, '0123[4567]0[123]45'],
            ['0123[4567]890[123]45', -1, 14, '0123[4567]890[123]5'],
            ['0123[4567]890[123]45', -2, 7, '0123[456]90[123]45'],
            ['0123[4567]890[123]45', -3, 7, '0123[456]0[123]45'],
            ['0123[4567]890[123]45', -1, 14, '0123[4567]890[123]5'],
            // chop left:
            ['0123[4567]890[123]45', -2, 3, '012[567]890[123]45'],
            ['0123[4567]890[123]45', -2, 4, '0123[67]890[123]45'],
            ['0123[4567]890[123]45', -2, 5, '0123[47]890[123]45'],
            ['0123[4567]890[123]45', -2, 10, '0123[4567]89[23]45'],
            ['0123[4567]890[123]45', -2, 11, '0123[4567]890[3]45'],
            ['0123[4567]890[123]45', -3, 3, '012[67]890[123]45'],
            // chop right:
            ['[0123]4567890[12345]', -2, 1, '[03]4567890[12345]'],
            ['[0123]4567890[12345]', -3, 1, '[0]4567890[12345]'],
            // full delete:
            ['0123[4567]890[123]45', -4, 4, '0123890[123]45'],
            ['0123[4567]890[123]45', -5, 3, '012890[123]45'],
            // chop ends:
            ['[0123]4567890[12345]', -2, 0, '[23]4567890[12345]'],
            ['[0123]4567890[12345]', -3, 0, '[3]4567890[12345]'],
            ['[0123]4567890[12345]', -4, 0, '4567890[12345]'],
            ['[0123]4567890[12345]', -1, 15, '[0123]4567890[1234]'],
            ['[0123]4567890[12345]', -3, 13, '[0123]4567890[12]'],
            ['[0123]4567890[12345]', -4, 12, '[0123]4567890[1]'],
            ['[0123]4567890[12345]', -5, 11, '[0123]4567890'],
            ['[0123]4567890[12345]', 0, 0, '[0123]4567890[12345]'],
        ].forEach(([a, n, offset, b]) => shiftTest('deletions', expect, a, b, n, offset));
    });
});
