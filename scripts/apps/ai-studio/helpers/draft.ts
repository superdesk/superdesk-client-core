import {isEqual} from 'lodash';
import {gettext} from 'core/utils';
import type {IAIProvider} from 'apps/ai-providers/interfaces';
import type {
    IAIAction,
    IAIActionDraft,
    IAIActionDraftErrors,
    IAIActionDraftField,
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

export function getNewDraft(usesSuggestionsCount: boolean, provider: string | null = null): IAIActionDraft {
    return {
        name: '',
        active: true,
        content_profiles: [],
        input_fields: [],
        output_field: null,
        provider,
        model: null,
        max_characters: null,
        suggestions_count: usesSuggestionsCount ? DEFAULT_SUGGESTIONS_COUNT : null,
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

/** Sent nested under `parameters` */
export const PARAMETER_FIELDS: Array<IAIActionDraftField> = [
    'max_characters',
    'suggestions_count',
    'extra_instructions',
];

function changedFields(before: IAIActionDraft, after: IAIActionDraft): Array<IAIActionDraftField> {
    return (Object.keys(after) as Array<IAIActionDraftField>).filter((field) => !isEqual(before[field], after[field]));
}

/** The draft fields as a request body, with the parameters nested */
function toPayload(draft: IAIActionDraft, fields: Array<IAIActionDraftField>): IAIActionPayload {
    const payload: Record<string, unknown> = {};
    const parameters: Record<string, unknown> = {};

    fields.forEach((field) => {
        (PARAMETER_FIELDS.includes(field) ? parameters : payload)[field] = draft[field];
    });

    if (Object.keys(parameters).length > 0) {
        payload.parameters = parameters;
    }

    return payload as IAIActionPayload;
}

/**
 * Only what changed; empty means no change. The server merges parameters, so a cleared one is
 * sent as `null`.
 */
export function buildPatch(original: IAIAction, draft: IAIActionDraft): IAIActionPayload {
    const after = normaliseDraft(draft);

    return toPayload(after, changedFields(actionToDraft(original), after));
}

/** The POST body for a new action, leaving out empty values so the server applies its defaults */
export function buildCreatePayload(actionType: IAIActionType, draft: IAIActionDraft): IAIActionPayload {
    const values = normaliseDraft(draft);
    const fields = (Object.keys(values) as Array<IAIActionDraftField>).filter((field) => values[field] != null);

    return {action_type: actionType, ...toPayload(values, fields)};
}

/** Whether the draft differs from what the form was opened with */
export function isDraftDirty(draft: IAIActionDraft, baseline: IAIActionDraft): boolean {
    return changedFields(baseline, normaliseDraft(draft)).length > 0;
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
