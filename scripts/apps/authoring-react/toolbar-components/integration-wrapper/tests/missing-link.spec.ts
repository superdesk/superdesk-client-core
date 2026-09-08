import {IArticle} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {ITEM_STATE} from 'apps/archive/constants';
import {isMissingLink, shouldQueryRelatedItems} from '../missing-link';

function article(overrides: Partial<IArticle>): IArticle {
    return {type: 'text', slugline: 'a slugline', ...overrides} as IArticle;
}

describe('authoring-react header missing link predicate', () => {
    describe('isMissingLink', () => {
        it('is true for an item that is neither in a rewrite chain nor a correction', () => {
            expect(isMissingLink(article({}), 'edit')).toBe(true);
        });

        it('is false when the item is a rewrite of another item', () => {
            expect(isMissingLink(article({rewrite_of: 'other-id'}), 'edit')).toBe(false);
        });

        it('is false when the item has already been rewritten', () => {
            expect(isMissingLink(article({rewritten_by: 'other-id'}), 'edit')).toBe(false);
        });

        it('is false when the item carries a correction sequence', () => {
            expect(isMissingLink(article({correction_sequence: 1}), 'edit')).toBe(false);
        });

        it('treats a correction sequence of 0 as no correction, so it stays true', () => {
            expect(isMissingLink(article({correction_sequence: 0}), 'edit')).toBe(true);
        });

        it('is false while the item is open in correct mode', () => {
            expect(isMissingLink(article({}), 'correct')).toBe(false);
        });

        it('is false for an item in the correction state when the corrections workflow is on', () => {
            const previous = appConfig.corrections_workflow;

            appConfig.corrections_workflow = true;

            try {
                expect(isMissingLink(article({state: ITEM_STATE.CORRECTION}), 'edit')).toBe(false);
            } finally {
                appConfig.corrections_workflow = previous;
            }
        });

        it('ignores the correction state when the corrections workflow is off', () => {
            const previous = appConfig.corrections_workflow;

            appConfig.corrections_workflow = false;

            try {
                expect(isMissingLink(article({state: ITEM_STATE.CORRECTION}), 'edit')).toBe(true);
            } finally {
                appConfig.corrections_workflow = previous;
            }
        });
    });

    describe('shouldQueryRelatedItems', () => {
        it('is true for a text item with a slugline', () => {
            expect(shouldQueryRelatedItems(article({}))).toBe(true);
        });

        it('is false for a non-text item', () => {
            expect(shouldQueryRelatedItems(article({type: 'picture'}))).toBe(false);
        });

        it('is false when the slugline is missing', () => {
            expect(shouldQueryRelatedItems(article({slugline: undefined}))).toBe(false);
        });

        it('is false when the slugline is only whitespace', () => {
            expect(shouldQueryRelatedItems(article({slugline: '   '}))).toBe(false);
        });

        it('is false for legal archive items', () => {
            expect(shouldQueryRelatedItems(article({_type: 'legal_archive'}))).toBe(false);
        });

        it('is false when the noMissingLink feature flag is set', () => {
            const previous = appConfig.features.noMissingLink;

            appConfig.features.noMissingLink = true;

            try {
                expect(shouldQueryRelatedItems(article({}))).toBe(false);
            } finally {
                appConfig.features.noMissingLink = previous;
            }
        });
    });
});
