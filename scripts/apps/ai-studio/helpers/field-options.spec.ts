import type {IContentProfile, IVocabulary} from 'superdesk-api';
import {getLabelForFieldId} from 'apps/workspace/helpers/getLabelForFieldId';
import {getFieldOptions, getProfileOptions, isFieldEnabledInProfile, withSelectedOptions} from './field-options';

function getProfile(id: string, fields: Array<string>, extra: Partial<IContentProfile> = {}): IContentProfile {
    const editor = fields.reduce((result, field, order) => ({...result, [field]: {order}}), {});

    return {_id: id, label: id.toUpperCase(), enabled: true, editor, ...extra} as unknown as IContentProfile;
}

const vocabularies = [
    {_id: 'teaser', display_name: 'Teaser', field_type: 'text'},
    {_id: 'gallery', display_name: 'Gallery', field_type: 'media'},
] as unknown as Array<IVocabulary>;

const builtInTextFields = ['headline', 'slugline', 'abstract', 'body_html', 'description_text', 'ednote'];

const getLabel = (id: string) => getLabelForFieldId(id, vocabularies);

const ids = (options: Array<{id: string}>) => options.map(({id}) => id);

describe('ai studio: field options', () => {
    const text = getProfile('text', ['headline', 'abstract', 'body_html', 'teaser', 'gallery', 'byline']);
    const sms = getProfile('sms', ['headline', 'body_html', 'slugline']);
    const disabled = getProfile('old', ['headline', 'ednote'], {enabled: false});
    const profiles = [text, sms, disabled];

    it('treats an editor entry without `enabled` as enabled, and a missing or switched off one as not', () => {
        const profile = getProfile('p', ['headline'], {
            editor: {headline: {order: 1}, abstract: {order: 2, enabled: false}, body_html: null},
        } as unknown as Partial<IContentProfile>);

        expect(isFieldEnabledInProfile(profile, 'headline')).toBe(true);
        expect(isFieldEnabledInProfile(profile, 'abstract')).toBe(false);
        expect(isFieldEnabledInProfile(profile, 'body_html')).toBe(false);
        expect(isFieldEnabledInProfile(profile, 'ednote')).toBe(false);
    });

    it('offers built-in text fields and custom text fields only, never other fields or custom types', () => {
        const options = getFieldOptions({
            builtInTextFields,
            customFieldVocabularies: vocabularies,
            profiles: [text],
            selectedProfileIds: ['text'],
            getLabel,
        });

        expect(ids(options.input)).toEqual(['headline', 'abstract', 'body_html', 'teaser']);
    });

    it('uses the union of the selected profiles for input and their intersection for output', () => {
        const options = getFieldOptions({
            builtInTextFields,
            customFieldVocabularies: vocabularies,
            profiles,
            selectedProfileIds: ['text', 'sms'],
            getLabel,
        });

        expect(ids(options.input)).toEqual(['headline', 'slugline', 'abstract', 'body_html', 'teaser']);
        expect(ids(options.output)).toEqual(['headline', 'body_html']);
    });

    it('uses every enabled profile when none is selected', () => {
        const options = getFieldOptions({
            builtInTextFields,
            customFieldVocabularies: vocabularies,
            profiles,
            selectedProfileIds: [],
            getLabel,
        });

        expect(ids(options.input)).not.toContain('ednote');
        expect(ids(options.input)).toEqual(['headline', 'slugline', 'abstract', 'body_html', 'teaser']);
        expect(ids(options.output)).toEqual(['headline', 'body_html']);
    });

    it('labels fields like the rest of the app, custom ones by their display name', () => {
        const options = getFieldOptions({
            builtInTextFields,
            customFieldVocabularies: vocabularies,
            profiles: [text],
            selectedProfileIds: [],
            getLabel,
        });

        expect(options.input.find(({id}) => id === 'body_html').label).toBe(getLabelForFieldId('body_html', []));
        expect(options.input.find(({id}) => id === 'teaser').label).toBe('Teaser');
    });

    it('keeps selected values that are no longer offered', () => {
        const options = [{id: 'headline', label: 'Headline'}];

        expect(withSelectedOptions(options, ['headline', 'removed_field'], (id) => `[${id}]`)).toEqual([
            {id: 'headline', label: 'Headline'},
            {id: 'removed_field', label: '[removed_field]'},
        ]);
    });

    it('offers enabled profiles, plus selected ones that are disabled or deleted', () => {
        expect(ids(getProfileOptions(profiles, []))).toEqual(['text', 'sms']);
        expect(ids(getProfileOptions(profiles, ['old', 'gone']))).toEqual(['text', 'sms', 'old', 'gone']);
    });
});
