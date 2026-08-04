import {OrderedMap} from 'immutable';
import {ContentState, convertToRaw} from 'draft-js';
import {sdApi} from 'api';
import ng from 'core/services/ng';
import {IArticle, IEditor3Config, IEditor3ValueStorage, IVocabulary} from 'superdesk-api';
import {testArticle} from 'test-data/test-article';
import {testVocabulary} from 'test-data/test-vocabulary';
import {
    getContentStateFromStoredStringEditor3,
    getFieldsAdapter,
    getStoredStringValueEditor3,
    retrieveStoredValueEditor3Generic,
} from '.';
import {body_html} from './body_html';
import {ednote} from './ednote';
import {headline} from './headline';

const customTextFieldId = 'custom_text_field';

// `IVocabulary` is a union discriminated on `field_type`; spreading a union-typed value
// widens it past any single member, so the narrowed shape has to be asserted.
const customTextVocabulary = {
    ...testVocabulary,
    _id: customTextFieldId,
    field_type: 'text',
} as IVocabulary;

function getConfig(singleLine: boolean): IEditor3Config {
    return {
        editorFormat: [],
        singleLine,
        disallowedCharacters: [],
    };
}

describe('editor3 stored value retrieval', () => {
    // `sdApi.vocabularies` is a shared singleton; snapshot it per test rather than at import
    // time, so this spec restores what it actually found and cannot leak into its neighbours.
    let vocabulariesOriginal: typeof sdApi.vocabularies;

    beforeEach(inject(($injector) => {
        ng.register($injector);

        vocabulariesOriginal = {...sdApi.vocabularies};

        Object.assign(sdApi.vocabularies, {
            getAll: () => OrderedMap<string, IVocabulary>(),
            getCustomFieldVocabularies: () => [customTextVocabulary],
            isSelectionVocabulary: () => false,
        });
    }));

    afterEach(() => {
        Object.assign(sdApi.vocabularies, vocabulariesOriginal);
    });

    describe('getStoredStringValueEditor3', () => {
        it('reads top level fields from the article root', () => {
            const article: IArticle = {...testArticle, body_html: '<p>root</p>'};

            expect(getStoredStringValueEditor3('body_html', article, getFieldsAdapter(null))).toBe('<p>root</p>');
        });

        it('reads custom text fields from `extra`', () => {
            const article: IArticle = {...testArticle, extra: {[customTextFieldId]: '<p>from extra</p>'}};

            expect(getStoredStringValueEditor3(customTextFieldId, article, getFieldsAdapter(null)))
                .toBe('<p>from extra</p>');
        });

        it('returns an empty string for fields with no adapter', () => {
            const article: IArticle = {...testArticle, extra: {unknown_field: 'value'}};

            expect(getStoredStringValueEditor3('unknown_field', article, getFieldsAdapter(null))).toBe('');
        });
    });

    describe('getContentStateFromStoredStringEditor3', () => {
        it('parses markup instead of treating it as literal text', () => {
            const contentState = getContentStateFromStoredStringEditor3(
                '<p>Hello <b>world</b></p>',
                getConfig(false),
            );

            expect(contentState.getPlainText()).toBe('Hello world');
        });

        it('leaves single line values alone, because they are stored as plain text', () => {
            const contentState = getContentStateFromStoredStringEditor3('Smith &amp; Jones <ap>', getConfig(true));

            expect(contentState.getPlainText()).toBe('Smith &amp; Jones <ap>');
        });

        it('leaves plain text multi line values alone, newlines included', () => {
            const contentState = getContentStateFromStoredStringEditor3(
                'Contact: John\nPhone: 123',
                getConfig(false),
                undefined,
                true,
            );

            expect(contentState.getPlainText()).toBe('Contact: John\nPhone: 123');
        });

        it('returns an empty content state for an empty value', () => {
            expect(getContentStateFromStoredStringEditor3('', getConfig(false)).getPlainText()).toBe('');
        });
    });

    describe('retrieveStoredValueEditor3Generic', () => {
        it('parses `body_html` of an item that has no draftjs state', () => {
            const article: IArticle = {...testArticle, body_html: '<p>Hello <b>world</b></p>'};

            const value = retrieveStoredValueEditor3Generic('body_html', article, null, getConfig(false));

            expect(value.rawContentState.blocks.map((block) => block.text).join('\n')).toBe('Hello world');
        });

        it('prefers an existing draftjs state over the html string', () => {
            const article: IArticle = {
                ...testArticle,
                body_html: '<p>from html</p>',
                fields_meta: {
                    body_html: {
                        draftjsState: [convertToRaw(ContentState.createFromText('from draftjs state'))],
                    },
                },
            };

            const value = retrieveStoredValueEditor3Generic('body_html', article, null, getConfig(false));

            expect(value.rawContentState.blocks[0].text).toBe('from draftjs state');
        });

        it('parses a custom text field stored in `extra`', () => {
            const article: IArticle = {...testArticle, extra: {[customTextFieldId]: '<p>Hello <b>world</b></p>'}};

            const value = retrieveStoredValueEditor3Generic(
                customTextFieldId,
                article,
                null,
                getConfig(false),
            );

            expect(value.rawContentState.blocks[0].text).toBe('Hello world');
        });
    });

    /**
     * The retrieved content state is what gets written back on save and on autosave,
     * so a bad conversion on read permanently replaces the stored markup.
     */
    describe('round trip through the persisted value', () => {
        it('keeps `body_html` markup intact', () => {
            const article: IArticle = {...testArticle, body_html: '<p>Hello <b>world</b></p>'};
            const config = getConfig(false);

            const stored = body_html.retrieveStoredValue(article, null, config) as IEditor3ValueStorage;
            const updated = body_html.storeValue(stored, article, config, false);

            expect(updated.body_html).toBe('<p>Hello <b>world</b></p>');
        });

        it('leaves a single line field byte identical', () => {
            const article: IArticle = {...testArticle, headline: 'Smith &amp; Jones <ap>'};
            const config = getConfig(true);

            const stored = headline.retrieveStoredValue(article, null, config) as IEditor3ValueStorage;
            const updated = headline.storeValue(stored, article, config, false);

            expect(updated.headline).toBe('Smith &amp; Jones <ap>');
        });

        it('keeps the newlines of `ednote`, which is stored as multi line plain text', () => {
            const article: IArticle = {...testArticle, ednote: 'Contact: John\nPhone: 123'};
            const config = getConfig(false);

            const stored = ednote.retrieveStoredValue(article, null, config) as IEditor3ValueStorage;
            const updated = ednote.storeValue(stored, article, config, false);

            expect(updated.ednote).toBe('Contact: John\nPhone: 123');
        });
    });
});
