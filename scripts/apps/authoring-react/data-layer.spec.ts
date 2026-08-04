import {appConfig} from 'appConfig';
import {IArticle} from 'superdesk-api';
import {
    authoringStorageIArticle,
    authoringStorageIArticleCorrect,
    getAuthoringStorageIArticleKillOrTakedown,
} from './data-layer';

describe('kill / correct / takedown authoring storage', () => {
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
