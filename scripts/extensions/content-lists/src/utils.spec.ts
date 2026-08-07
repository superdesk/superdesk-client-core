import {describe, it} from 'mocha';
import * as assert from 'assert';

import {IItemChange, IListEntry} from './interfaces';
import {recordChange} from './utils';

function entry(contentId: string): IListEntry {
    return {
        uid: contentId,
        contentId,
        title: contentId,
        state: 'published',
        category: null,
        updated: null,
        created: null,
        publishSchedule: null,
        thumbnailUrl: null,
        sticky: false,
        stickyPosition: null,
        dangling: false,
    };
}

describe('recordChange', () => {
    it('appends a delete for an entry that exists on the server', () => {
        assert.deepStrictEqual(
            recordChange([], 'delete', 'a', []),
            [{action: 'delete', contentId: 'a'}],
        );
    });

    it('cancels a pending add when the added entry is removed again', () => {
        const changes: Array<IItemChange> = [{action: 'add', contentId: 'a', position: 0}];

        assert.deepStrictEqual(recordChange(changes, 'delete', 'a', []), []);
    });

    it('cancels follow-up moves of the pending add as well', () => {
        const changes: Array<IItemChange> = [
            {action: 'add', contentId: 'a', position: 0},
            {action: 'move', contentId: 'b', position: 1},
            {action: 'move', contentId: 'a', position: 2},
        ];

        assert.deepStrictEqual(
            recordChange(changes, 'delete', 'a', [entry('b')]),
            [{action: 'move', contentId: 'b', position: 0}],
        );
    });

    it('keeps an earlier delete when a re-added entry is removed again', () => {
        // server has "a"; user deleted it, re-added it, then removed the
        // re-added row: the original delete must survive
        const changes: Array<IItemChange> = [
            {action: 'delete', contentId: 'a'},
            {action: 'add', contentId: 'a', position: 0},
        ];

        assert.deepStrictEqual(
            recordChange(changes, 'delete', 'a', []),
            [{action: 'delete', contentId: 'a'}],
        );
    });

    it('rewrites positions of remaining changes from current entries', () => {
        const changes: Array<IItemChange> = [
            {action: 'add', contentId: 'a', position: 0},
            {action: 'add', contentId: 'c', position: 2},
        ];

        assert.deepStrictEqual(
            recordChange(changes, 'delete', 'a', [entry('b'), entry('c')]),
            [{action: 'add', contentId: 'c', position: 1}],
        );
    });
});
