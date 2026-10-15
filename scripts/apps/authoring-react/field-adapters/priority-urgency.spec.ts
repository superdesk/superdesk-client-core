import {sdApi} from 'api';
import {OrderedMap} from 'immutable';
import {IDropdownConfigManualSource, IVocabulary, IVocabularyItem} from 'superdesk-api';
import {testVocabulary} from 'test-data/test-vocabulary';
import {priority} from './priority';
import {urgency} from './urgency';

const vocabulariesOriginal = sdApi.vocabularies;

// The e2e vocabulary names every item after its own qcode ({name: '6', qcode: 6}), which hides a
// renderer that drops the code or the name. The case that matters is one that calls qcode 1
// "Urgent", so that is what these stub.
function stubVocabularies(items: Array<Partial<IVocabularyItem>>): void {
    sdApi.vocabularies = {
        ...vocabulariesOriginal,
        getAll: () => OrderedMap<string, IVocabulary>()
            .set('priority', {...testVocabulary, _id: 'priority', items: items as Array<IVocabularyItem>})
            .set('urgency', {...testVocabulary, _id: 'urgency', items: items as Array<IVocabularyItem>}),
    };
}

function getOptions(adapter: typeof priority): IDropdownConfigManualSource['options'] {
    return (adapter.getFieldV2({}, {}, () => false).fieldConfig as IDropdownConfigManualSource).options;
}

describe('priority and urgency adapters', () => {
    afterEach(() => {
        sdApi.vocabularies = vocabulariesOriginal;
    });

    it('keeps the item name as the label and its code in the badge', () => {
        stubVocabularies([{qcode: '1', name: 'Urgent'}, {qcode: '5', name: 'Routine'}]);

        for (const adapter of [priority, urgency]) {
            expect(getOptions(adapter).map(({id, label, badgeLabel}) => ({id, label, badgeLabel}))).toEqual([
                {id: '1', label: 'Urgent', badgeLabel: '1'},
                {id: '5', label: 'Routine', badgeLabel: '5'},
            ]);
        }
    });

    // `IVocabularyItem` types `qcode` as a string, but the seeded priority and urgency
    // vocabularies store it as a number.
    it('reads a numeric qcode as well as a string one', () => {
        stubVocabularies([{qcode: 1 as unknown as string, name: 'Urgent'}]);

        expect(getOptions(priority)[0].badgeLabel).toBe('1');
        expect(getOptions(priority)[0].color).toBe('#b82f00');
    });

    it('prefers the vocabulary item short code for the badge', () => {
        stubVocabularies([{qcode: '1', name: 'Urgent', short: 'U'}]);

        for (const adapter of [priority, urgency]) {
            expect(getOptions(adapter)[0].badgeLabel).toBe('U');
            expect(getOptions(adapter)[0].label).toBe('Urgent');
        }
    });

    // The colour tables mirror `.priority-label--<n>` in styles/sass/labels.scss, which angular
    // keys on the qcode. Reading them by name gives no colour once the names stop being digits.
    it('takes the fallback colour from the code rather than the name', () => {
        stubVocabularies([{qcode: '1', name: 'Urgent'}]);

        expect(getOptions(priority)[0].color).toBe('#b82f00');
        expect(getOptions(urgency)[0].color).toBe('#01405b');
    });

    it('lets the vocabulary item override the fallback colour', () => {
        stubVocabularies([{qcode: '1', name: 'Urgent', color: '#123456'}]);

        expect(getOptions(priority)[0].color).toBe('#123456');
    });
});
