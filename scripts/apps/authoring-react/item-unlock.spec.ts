import {isUnlockedFromAnotherSession} from './item-unlock';

describe('isUnlockedFromAnotherSession', () => {
    const item = {_id: 'article1'};

    it('is true when another session unlocks the item', () => {
        expect(isUnlockedFromAnotherSession(item, {item: 'article1', lock_session: 'session-2'}, 'session-1'))
            .toBe(true);
    });

    // the current session unlocks when closing the item or taking over someone else's lock
    it('is false when the current session unlocks the item', () => {
        expect(isUnlockedFromAnotherSession(item, {item: 'article1', lock_session: 'session-1'}, 'session-1'))
            .toBe(false);
    });

    it('is false for another item', () => {
        expect(isUnlockedFromAnotherSession(item, {item: 'article2', lock_session: 'session-2'}, 'session-1'))
            .toBe(false);
    });
});
