import {OrderedMap} from 'immutable';
import {IDesk} from 'superdesk-api';
import {resolveDesks} from '../helper';

function desk(id: string, name: string): IDesk {
    return {_id: id, name} as IDesk;
}

describe('resolveDesks', () => {
    const allDesks = OrderedMap<IDesk['_id'], IDesk>([
        ['desk-1', desk('desk-1', 'Sports')],
        ['desk-2', desk('desk-2', 'Finance')],
    ]);

    it('resolves ids to desk objects, preserving order', () => {
        expect(resolveDesks(['desk-2', 'desk-1'], allDesks).map((d) => d.name)).toEqual(['Finance', 'Sports']);
    });

    it('drops ids that no longer exist instead of returning undefined entries', () => {
        const result = resolveDesks(['desk-1', 'deleted-desk', 'desk-2'], allDesks);

        expect(result.map((d) => d.name)).toEqual(['Sports', 'Finance']);
        expect(result.every((d) => d != null)).toBe(true);
    });

    it('returns an empty array when nothing matches', () => {
        expect(resolveDesks(['gone'], allDesks)).toEqual([]);
        expect(resolveDesks([], allDesks)).toEqual([]);
    });
});
