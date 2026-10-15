import moment from 'moment-timezone';
import {IArticle} from 'superdesk-api';
import {sdApi} from 'api';
import {
    canAssociateAsUpdate,
    canAssociateMetadata,
    getMetadataToCopy,
    getModificationDateAfterQueryValue,
    getStoredConfiguration,
    hasEnoughKeywords,
    isRelatedItemsWidgetAllowed,
    storeConfiguration,
} from '../related-items-logic';

function article(overrides: Partial<IArticle>): IArticle {
    return {
        _id: 'item-1',
        type: 'text',
        state: 'in_progress',
        task: {desk: 'desk-1', stage: 'stage-1', user: 'user-1'},
        ...overrides,
    } as IArticle;
}

describe('isRelatedItemsWidgetAllowed', () => {
    const sluglineProfile = {slugline: {}, headline: {}};

    it('allows a regular text item', () => {
        expect(isRelatedItemsWidgetAllowed(article({}), sluglineProfile)).toBe(true);
    });

    it('allows a killed item', () => {
        expect(isRelatedItemsWidgetAllowed(
            article({state: 'killed' as IArticle['state']}),
            sluglineProfile,
        )).toBe(true);
    });

    it('hides the widget for packages and pictures', () => {
        expect(isRelatedItemsWidgetAllowed(article({type: 'composite'}), sluglineProfile)).toBe(false);
        expect(isRelatedItemsWidgetAllowed(article({type: 'picture'}), sluglineProfile)).toBe(false);
    });

    it('hides the widget for legal archive and archived items', () => {
        expect(isRelatedItemsWidgetAllowed(article({_type: 'legal_archive'}), sluglineProfile)).toBe(false);
        expect(isRelatedItemsWidgetAllowed(article({_type: 'archived'}), sluglineProfile)).toBe(false);
    });

    it('hides the widget for personal items, which have a user but no desk', () => {
        expect(isRelatedItemsWidgetAllowed(
            article({task: {user: 'user-1'} as IArticle['task']}),
            sluglineProfile,
        )).toBe(false);
    });

    // an item on a desk is not personal, whether or not it carries a stage
    it('allows the widget for an item on a desk with no stage', () => {
        expect(isRelatedItemsWidgetAllowed(
            article({task: {desk: 'desk-1', user: 'user-1'} as IArticle['task']}),
            sluglineProfile,
        )).toBe(true);
    });

    it('hides the widget when the profile has no slugline, which it searches on', () => {
        expect(isRelatedItemsWidgetAllowed(article({}), {headline: {}})).toBe(false);
    });

    it('allows the widget when the profile is unknown', () => {
        expect(isRelatedItemsWidgetAllowed(article({}), null)).toBe(true);
    });
});

describe('canAssociateAsUpdate', () => {
    const base = {
        currentItem: article({}),
        hasRewritePrivilege: true,
        targetCanBeRewritten: true,
    };

    it('allows associating an update when every condition holds', () => {
        expect(canAssociateAsUpdate(base)).toBe(true);
    });

    it('rejects when the user lacks the rewrite privilege', () => {
        expect(canAssociateAsUpdate({...base, hasRewritePrivilege: false})).toBe(false);
    });

    it('rejects when the picked item can not be rewritten', () => {
        expect(canAssociateAsUpdate({...base, targetCanBeRewritten: false})).toBe(false);
    });

    it('rejects when the edited item is published', () => {
        expect(canAssociateAsUpdate({
            ...base,
            currentItem: article({state: 'published' as IArticle['state']}),
        })).toBe(false);
    });

    it('rejects when the edited item is not text', () => {
        expect(canAssociateAsUpdate({...base, currentItem: article({type: 'picture'})})).toBe(false);
    });

    it('rejects when the edited item is already an update or a broadcast of another item', () => {
        expect(canAssociateAsUpdate({...base, currentItem: article({rewrite_of: 'item-2'})})).toBe(false);
        expect(canAssociateAsUpdate({...base, currentItem: article({broadcast: {master_id: 'item-2'}})})).toBe(false);
    });
});

describe('canAssociateMetadata', () => {
    it('is offered for anything but a package', () => {
        expect(canAssociateMetadata(article({}))).toBe(true);
        expect(canAssociateMetadata(article({type: 'composite'}))).toBe(false);
    });
});

describe('getMetadataToCopy', () => {
    const source = article({
        _id: 'source-id',
        slugline: 'source slugline',
        headline: 'source headline',
        urgency: 2,
        priority: 5,
        anpa_category: [{qcode: 'a', name: 'a'}] as IArticle['anpa_category'],
        place: [] as IArticle['place'],
        subject: [] as IArticle['subject'],
        body_html: 'not copied',
    });

    it('links the destination to the source and copies every metadata field without a profile', () => {
        const patch = getMetadataToCopy(source, null);

        expect(patch.related_to).toBe('source-id');
        expect(patch.slugline).toBe('source slugline');
        expect(patch.headline).toBe('source headline');
        expect(patch.urgency).toBe(2);
        expect(patch.priority).toBe(5);
    });

    it('never copies fields outside the metadata list', () => {
        expect(getMetadataToCopy(source, null).body_html).toBeUndefined();
    });

    it('skips fields the destination content profile does not define', () => {
        const patch = getMetadataToCopy(source, {slugline: {}, headline: {}});

        expect(patch.slugline).toBe('source slugline');
        expect(patch.headline).toBe('source headline');
        expect(Object.prototype.hasOwnProperty.call(patch, 'urgency')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(patch, 'priority')).toBe(false);
        expect(patch.related_to).toBe('source-id');
    });

    it('keeps a profile field that is defined but empty, matching the angular hasOwnProperty check', () => {
        expect(Object.prototype.hasOwnProperty.call(getMetadataToCopy(source, {urgency: null}), 'urgency')).toBe(true);
    });
});

describe('getModificationDateAfterQueryValue', () => {
    it('passes relative values through untouched', () => {
        expect(getModificationDateAfterQueryValue('now-6h')).toBe('now-6h');
        expect(getModificationDateAfterQueryValue('now-48h')).toBe('now-48h');
    });

    it('resolves today to midnight with an explicit offset', () => {
        expect(getModificationDateAfterQueryValue('today')).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00[+-]\d{4}$/);
    });

    // the test config enables `search.useDefaultTimezone` with `default_timezone: Europe/London`
    it('takes the day boundary from the configured timezone, not the machine one', () => {
        const value = getModificationDateAfterQueryValue('today');

        expect(value.startsWith(moment().tz('Europe/London').format('YYYY-MM-DD'))).toBe(true);
        expect(value.endsWith(moment.tz('Europe/London').format('ZZ'))).toBe(true);
    });
});

describe('the widget configuration', () => {
    it('falls back to the same defaults authoring-angular registers', () => {
        spyOn(sdApi.localStorage, 'getItem').and.returnValue(null);

        expect(getStoredConfiguration()).toEqual({sluglineMatch: 'EXACT', modificationDateAfter: 'today'});
    });

    it('is stored under `sluglineMatch` and `modificationDateAfter`', () => {
        const stored: {[key: string]: any} = {};

        spyOn(sdApi.localStorage, 'getItem').and.callFake((key: string) => stored[key] ?? null);
        spyOn(sdApi.localStorage, 'setItem').and.callFake((key: string, value: any) => {
            stored[key] = value;
        });

        storeConfiguration({sluglineMatch: 'PREFIX', modificationDateAfter: 'now-24h'});

        expect(stored).toEqual({sluglineMatch: 'PREFIX', modificationDateAfter: 'now-24h'});
        expect(getStoredConfiguration()).toEqual({sluglineMatch: 'PREFIX', modificationDateAfter: 'now-24h'});
    });
});

describe('hasEnoughKeywords', () => {
    it('requires at least two non-whitespace characters', () => {
        expect(hasEnoughKeywords('')).toBe(false);
        expect(hasEnoughKeywords(' a ')).toBe(false);
        expect(hasEnoughKeywords('ab')).toBe(true);
    });
});
