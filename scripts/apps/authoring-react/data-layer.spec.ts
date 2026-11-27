import {appConfig} from 'appConfig';
import {IArticle, IFieldsAdapter, IVocabulary} from 'superdesk-api';
import {
    authoringStorageIArticle,
    authoringStorageIArticleCorrect,
    getAuthoringStorageIArticleKillOrTakedown,
    getProfileFields,
} from './data-layer';

describe('getProfileFields', () => {
    it('skips a field that has neither an adapter nor a custom field type', () => {
        spyOn(console, 'warn');

        const fieldsAdapter = {
            headline: {
                getFieldV2: () => ({id: 'headline', name: 'Headline', fieldType: 'plain-text', fieldConfig: {}}),
            },
        } as unknown as IFieldsAdapter<IArticle>;

        const customFields = [
            {_id: 'custom_text', custom_field_type: 'plain-text', custom_field_config: {}},
            {_id: 'regions', service: {all: 1}},
        ] as unknown as Array<IVocabulary>;

        const {header, content} = getProfileFields(
            {
                editor: {
                    headline: {order: 1},
                    company_codes: {order: 2},
                    custom_text: {order: 3},
                    regions: {order: 4},
                },
                schema: {},
                customFields,
            },
            fieldsAdapter,
            (fieldId) => fieldId,
            () => 'content',
        );

        expect(header.size).toBe(0);
        expect(content.keySeq().toArray()).toEqual(['headline', 'custom_text']);
    });
});

describe('kill / correct / takedown authoring storage', () => {
    let overrideEdnoteInitial: boolean;

    beforeEach(() => {
        overrideEdnoteInitial = appConfig.override_ednote_for_corrections;
    });

    afterEach(() => {
        appConfig.override_ednote_for_corrections = overrideEdnoteInitial;
    });

    it('autosave.get resolves with null so the saved item is used for initialization', (done) => {
        Promise.all([
            authoringStorageIArticleCorrect.autosave.get('item-id'),
            getAuthoringStorageIArticleKillOrTakedown('kill').autosave.get('item-id'),
        ]).then(([autosavedCorrect, autosavedKill]) => {
            expect(autosavedCorrect).toBe(null);
            expect(autosavedKill).toBe(null);

            done();
        });
    });

    it('correct storage returns the item with correction adjustments applied', (done) => {
        appConfig.override_ednote_for_corrections = true;

        const saved = {
            _id: 'item-1',
            slugline: 'test slugline',
            versioncreated: '2023-06-01T10:00:00+0000',
            sms_message: 'sms text',
            ednote: 'original note',
            flags: {marked_for_sms: true},
            fields_meta: {ednote: {}},
        } as unknown as IArticle;

        spyOn(authoringStorageIArticle, 'getEntity').and.returnValue(Promise.resolve(saved));

        authoringStorageIArticleCorrect.getEntity('item-1').then((item) => {
            expect(item.sms_message).toBe('');
            expect(item.flags.marked_for_sms).toBe(false);
            expect(item.ednote).toContain('This is a corrected repeat');
            expect(item.fields_meta['ednote']).toBeUndefined();

            done();
        });
    });
});
