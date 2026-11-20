import {gettext} from 'core/utils';
import type {IAIProvider} from 'apps/ai-providers/interfaces';
import type {
    IAIAction,
    IAIActionDraft,
    IAIActionDraftErrors,
    IAIActionParameters,
    IAIActionPayload,
    IAIActionType,
    IAIActionTypeOption,
} from '../interfaces';

export const EXTRA_INSTRUCTIONS_MAX_LENGTH = 2000;
export const SUGGESTIONS_COUNT_MIN = 1;
export const SUGGESTIONS_COUNT_MAX = 10;
export const DEFAULT_SUGGESTIONS_COUNT = 3;

function textOrNull(value: string | null | undefined): string | null {
    return value == null || value.trim() === '' ? null : value;
}

/** The number `Input` reports an emptied field as `0` and an unparsable one as `NaN`, both invalid here */
export function numberInputToValue(value: number | null | undefined): number | null {
    return value == null || value === 0 || Number.isNaN(value) ? null : value;
}

/** The provider a new action starts with: the only active one, if there is exactly one */
export function getDefaultProvider(providers: Array<IAIProvider>): string | null {
    const active = providers.filter(({active}) => active);

    return active.length === 1 ? active[0]._id : null;
}

export function getNewDraft(provider: string | null = null): IAIActionDraft {
    return {
        name: '',
        active: true,
        content_profiles: [],
        input_fields: [],
        output_field: null,
        provider,
        model: null,
        max_characters: null,
        suggestions_count: DEFAULT_SUGGESTIONS_COUNT,
        extra_instructions: null,
    };
}

/** The server leaves out empty values, so they are normalised to `null` to keep comparisons simple */
export function actionToDraft(action: IAIAction): IAIActionDraft {
    const parameters = action.parameters ?? {};

    return {
        name: action.name ?? '',
        active: action.active ?? true,
        content_profiles: action.content_profiles ?? [],
        input_fields: action.input_fields ?? [],
        output_field: textOrNull(action.output_field),
        provider: textOrNull(action.provider),
        model: textOrNull(action.model),
        max_characters: parameters.max_characters ?? null,
        suggestions_count: parameters.suggestions_count ?? null,
        extra_instructions: textOrNull(parameters.extra_instructions),
    };
}

function normaliseDraft(draft: IAIActionDraft): IAIActionDraft {
    return {
        ...draft,
        output_field: textOrNull(draft.output_field),
        provider: textOrNull(draft.provider),
        model: textOrNull(draft.model),
        extra_instructions: textOrNull(draft.extra_instructions),
    };
}

function arraysEqual(a: Array<string>, b: Array<string>): boolean {
    return a.length === b.length && a.every((value, index) => value === b[index]);
}

/** Changing the provider clears the model, since models belong to a provider */
export function withProvider(draft: IAIActionDraft, provider: string | null): IAIActionDraft {
    if (provider === draft.provider) {
        return draft;
    }

    return {...draft, provider, model: null};
}

/**
 * Only what changed; empty means no change. The server merges parameters, so a cleared one is
 * sent as `null`.
 */
export function buildPatch(
    original: IAIAction,
    draft: IAIActionDraft,
    typeOption: IAIActionTypeOption | undefined,
): IAIActionPayload {
    const before = actionToDraft(original);
    const after = normaliseDraft(draft);
    const patch: IAIActionPayload = {};
    const parameters: IAIActionParameters = {};

    if (after.name !== before.name) {
        patch.name = after.name;
    }

    if (after.active !== before.active) {
        patch.active = after.active;
    }

    if (!arraysEqual(after.content_profiles, before.content_profiles)) {
        patch.content_profiles = after.content_profiles;
    }

    if (!arraysEqual(after.input_fields, before.input_fields)) {
        patch.input_fields = after.input_fields;
    }

    if (after.output_field !== before.output_field) {
        patch.output_field = after.output_field;
    }

    if (after.provider !== before.provider) {
        patch.provider = after.provider;
    }

    if (after.model !== before.model) {
        patch.model = after.model;
    }

    if (after.max_characters !== before.max_characters) {
        parameters.max_characters = after.max_characters;
    }

    if (typeOption?.uses_suggestions_count === true && after.suggestions_count !== before.suggestions_count) {
        parameters.suggestions_count = after.suggestions_count;
    }

    if (after.extra_instructions !== before.extra_instructions) {
        parameters.extra_instructions = after.extra_instructions;
    }

    if (Object.keys(parameters).length > 0) {
        patch.parameters = parameters;
    }

    return patch;
}

/** The POST body for a new action, leaving out empty values so the server applies its defaults */
export function buildCreatePayload(
    actionType: IAIActionType,
    draft: IAIActionDraft,
    typeOption: IAIActionTypeOption | undefined,
): IAIActionPayload {
    const values = normaliseDraft(draft);
    const payload: IAIActionPayload = {
        name: values.name,
        action_type: actionType,
        active: values.active,
        content_profiles: values.content_profiles,
        input_fields: values.input_fields,
        output_field: values.output_field,
        provider: values.provider,
    };
    const parameters: IAIActionParameters = {};

    if (values.model != null) {
        payload.model = values.model;
    }

    if (values.max_characters != null) {
        parameters.max_characters = values.max_characters;
    }

    if (typeOption?.uses_suggestions_count === true && values.suggestions_count != null) {
        parameters.suggestions_count = values.suggestions_count;
    }

    if (values.extra_instructions != null) {
        parameters.extra_instructions = values.extra_instructions;
    }

    if (Object.keys(parameters).length > 0) {
        payload.parameters = parameters;
    }

    return payload;
}

/** Whether a new action's draft differs from the form it was opened with */
export function isNewDraftDirty(draft: IAIActionDraft, initial: IAIActionDraft = getNewDraft()): boolean {
    const current = normaliseDraft(draft);

    return (Object.keys(initial) as Array<keyof IAIActionDraft>).some((key) => {
        const a = initial[key];
        const b = current[key];

        return Array.isArray(a) && Array.isArray(b) ? !arraysEqual(a, b) : a !== b;
    });
}

function isPositiveInteger(value: number): boolean {
    return Number.isInteger(value) && value > 0;
}

/** Checks the server would also make, so a request that can only fail is not sent */
export function validateDraft(
    draft: IAIActionDraft,
    typeOption: IAIActionTypeOption | undefined,
): IAIActionDraftErrors {
    const errors: IAIActionDraftErrors = {};

    if (draft.name.trim() === '') {
        errors.name = gettext('Name is required');
    }

    if (draft.input_fields.length < 1) {
        errors.input_fields = gettext('Select at least one input field');
    }

    if (textOrNull(draft.output_field) == null) {
        errors.output_field = gettext('Output field is required');
    }

    if (textOrNull(draft.provider) == null) {
        errors.provider = gettext('Provider is required');
    }

    if (draft.max_characters != null && !isPositiveInteger(draft.max_characters)) {
        errors.max_characters = gettext('Enter a whole number above 0, or leave it empty');
    }

    if (typeOption?.uses_suggestions_count === true) {
        const count = draft.suggestions_count;

        if (
            count == null
            || !Number.isInteger(count)
            || count < SUGGESTIONS_COUNT_MIN
            || count > SUGGESTIONS_COUNT_MAX
        ) {
            errors.suggestions_count = gettext('Enter a whole number from {{min}} to {{max}}', {
                min: SUGGESTIONS_COUNT_MIN,
                max: SUGGESTIONS_COUNT_MAX,
            });
        }
    }

    if ((draft.extra_instructions ?? '').trim().length > EXTRA_INSTRUCTIONS_MAX_LENGTH) {
        errors.extra_instructions = gettext('At most {{max}} characters', {max: EXTRA_INSTRUCTIONS_MAX_LENGTH});
    }

    return errors;
}
