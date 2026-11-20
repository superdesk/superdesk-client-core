import type {IAIProvider} from 'apps/ai-providers/interfaces';
import type {IAIAction, IAIActionTypeOption} from '../interfaces';
import {
    actionToDraft,
    buildCreatePayload,
    buildPatch,
    getDefaultProvider,
    getNewDraft,
    isNewDraftDirty,
    numberInputToValue,
    validateDraft,
    withProvider,
} from './draft';

const suggestion: IAIActionTypeOption = {
    action_type: 'suggestion',
    user_actions: ['apply', 'copy'],
    uses_suggestions_count: true,
};

const summary: IAIActionTypeOption = {
    action_type: 'summary',
    user_actions: ['apply', 'copy'],
    uses_suggestions_count: false,
};

function getAction(overrides: Partial<IAIAction> = {}): IAIAction {
    return {
        _id: 'action-1',
        _etag: 'etag-1',
        _created: '2026-11-18T10:00:00+0000',
        _updated: '2026-11-18T10:00:00+0000',
        _links: {},
        name: 'Headlines',
        action_type: 'suggestion',
        active: true,
        input_fields: ['body_html'],
        output_field: 'headline',
        content_profiles: ['text'],
        provider: 'provider-1',
        model: 'gpt-4o-mini',
        parameters: {
            temperature: 0.7,
            max_characters: 120,
            suggestions_count: 3,
            extra_instructions: 'Use British spelling.',
        },
        ...overrides,
    } as IAIAction;
}

describe('ai studio: action draft', () => {
    it('sends nothing when the draft matches the stored action', () => {
        const action = getAction();

        expect(buildPatch(action, actionToDraft(action), suggestion)).toEqual({});
    });

    it('treats a value the server left out, null and an empty string as the same empty value', () => {
        const action = getAction({model: undefined, parameters: {suggestions_count: 3}});
        const draft = {...actionToDraft(action), model: '', extra_instructions: '   '};

        expect(buildPatch(action, draft, suggestion)).toEqual({});
    });

    it('sends only the changed fields', () => {
        const action = getAction();
        const draft = {...actionToDraft(action), name: 'Better headlines', input_fields: ['body_html', 'abstract']};

        expect(buildPatch(action, draft, suggestion)).toEqual({
            name: 'Better headlines',
            input_fields: ['body_html', 'abstract'],
        });
    });

    it('nests changed parameters and leaves the unchanged ones to the server merge', () => {
        const action = getAction();
        const draft = {...actionToDraft(action), suggestions_count: 5};

        expect(buildPatch(action, draft, suggestion)).toEqual({parameters: {suggestions_count: 5}});
    });

    it('sends cleared parameters and a cleared model as null, since parameters are merged', () => {
        const action = getAction();
        const draft = {...actionToDraft(action), model: null, max_characters: null, extra_instructions: ''};

        expect(buildPatch(action, draft, suggestion)).toEqual({
            model: null,
            parameters: {max_characters: null, extra_instructions: null},
        });
    });

    it('never sends the number of suggestions for a type that does not use it', () => {
        const action = getAction({action_type: 'summary', parameters: {suggestions_count: 1}});
        const draft = {...actionToDraft(action), suggestions_count: 4};

        expect(buildPatch(action, draft, summary)).toEqual({});
        expect(buildCreatePayload('summary', draft, summary).parameters?.suggestions_count).toBeUndefined();
    });

    it('builds a create payload without empty values', () => {
        const draft = {
            ...getNewDraft(),
            name: 'Abstracts',
            input_fields: ['body_html'],
            output_field: 'abstract',
            provider: 'provider-1',
        };

        expect(buildCreatePayload('suggestion', draft, suggestion)).toEqual({
            name: 'Abstracts',
            action_type: 'suggestion',
            active: true,
            content_profiles: [],
            input_fields: ['body_html'],
            output_field: 'abstract',
            provider: 'provider-1',
            parameters: {suggestions_count: 3},
        });
    });

    it('clears the model when the provider changes', () => {
        const draft = {...getNewDraft(), provider: 'provider-1', model: 'gpt-4o'};

        expect(withProvider(draft, 'provider-2')).toEqual({...draft, provider: 'provider-2', model: null});
        expect(withProvider(draft, 'provider-1')).toBe(draft);
    });

    it('reads an emptied or unparsable number input as no value', () => {
        expect(numberInputToValue(0)).toBeNull();
        expect(numberInputToValue(NaN)).toBeNull();
        expect(numberInputToValue(120)).toBe(120);
    });

    it('tells an untouched new form from a changed one', () => {
        expect(isNewDraftDirty(getNewDraft())).toBe(false);
        expect(isNewDraftDirty({...getNewDraft(), extra_instructions: ''})).toBe(false);
        expect(isNewDraftDirty({...getNewDraft(), name: 'x'})).toBe(true);
        expect(isNewDraftDirty({...getNewDraft(), input_fields: ['headline']})).toBe(true);
    });

    it('does not count the provider a new form opened with as a change', () => {
        const initial = getNewDraft('provider-1');

        expect(initial.provider).toBe('provider-1');
        expect(isNewDraftDirty(initial, initial)).toBe(false);
        expect(isNewDraftDirty({...initial, provider: 'provider-2'}, initial)).toBe(true);
    });

    it('picks a default provider only when exactly one is active', () => {
        const provider = (_id: string, active: boolean) => ({_id, active} as IAIProvider);

        expect(getDefaultProvider([])).toBeNull();
        expect(getDefaultProvider([provider('a', true)])).toBe('a');
        expect(getDefaultProvider([provider('a', true), provider('b', false)])).toBe('a');
        expect(getDefaultProvider([provider('a', true), provider('b', true)])).toBeNull();
        expect(getDefaultProvider([provider('a', false)])).toBeNull();
    });

    describe('validation', () => {
        const valid = {
            ...getNewDraft(),
            name: 'Headlines',
            input_fields: ['body_html'],
            output_field: 'headline',
            provider: 'provider-1',
        };

        it('accepts a complete draft', () => {
            expect(validateDraft(valid, suggestion)).toEqual({});
        });

        it('requires a name, an input field, an output field and a provider', () => {
            expect(Object.keys(validateDraft({...getNewDraft(), name: ' '}, suggestion)).sort()).toEqual(
                ['input_fields', 'name', 'output_field', 'provider'],
            );
        });

        it('keeps the number of suggestions between 1 and 10, only for types that use it', () => {
            expect(validateDraft({...valid, suggestions_count: 11}, suggestion).suggestions_count).toBeDefined();
            expect(validateDraft({...valid, suggestions_count: null}, suggestion).suggestions_count).toBeDefined();
            expect(validateDraft({...valid, suggestions_count: 10}, suggestion).suggestions_count).toBeUndefined();
            expect(validateDraft({...valid, suggestions_count: null}, summary)).toEqual({});
        });

        it('accepts an empty max characters but not a negative or fractional one', () => {
            expect(validateDraft({...valid, max_characters: null}, suggestion)).toEqual({});
            expect(validateDraft({...valid, max_characters: -5}, suggestion).max_characters).toBeDefined();
            expect(validateDraft({...valid, max_characters: 2.5}, suggestion).max_characters).toBeDefined();
        });

        it('caps the extra instructions at 2000 characters', () => {
            expect(validateDraft({...valid, extra_instructions: 'a'.repeat(2000)}, suggestion)).toEqual({});
            expect(
                validateDraft({...valid, extra_instructions: 'a'.repeat(2001)}, suggestion).extra_instructions,
            ).toBeDefined();
        });
    });
});
