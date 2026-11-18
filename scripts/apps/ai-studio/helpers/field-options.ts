import {gettext} from 'core/utils';
import type {IContentProfile, IVocabulary} from 'superdesk-api';
import type {ISelectOption} from '../interfaces';

/**
 * A field is enabled in a profile when the profile's editor config has an entry for it that is not
 * switched off. Stored profiles drop disabled fields or mark them `enabled: false`, and leave
 * `enabled` out on enabled ones, so a missing flag counts as enabled.
 */
export function isFieldEnabledInProfile(profile: IContentProfile, fieldId: string): boolean {
    const config = profile.editor?.[fieldId];

    return config != null && config.enabled !== false;
}

/**
 * Profiles the action applies to: the selected ones, or every enabled profile when none is selected
 * (an action with no content profiles is offered for all of them). Selected IDs that no longer
 * match a profile are skipped; when none match, every enabled profile is used.
 */
export function getProfilesInScope(
    profiles: Array<IContentProfile>,
    selectedProfileIds: Array<string>,
): Array<IContentProfile> {
    const selected = profiles.filter(({_id}) => selectedProfileIds.includes(_id));

    return selected.length > 0 ? selected : profiles.filter(({enabled}) => enabled);
}

interface IFieldOptionsParams {
    /** From `GET /ai_actions/options`, the built-in fields core accepts */
    builtInTextFields: Array<string>;

    /** Custom field vocabularies; only those of type text are offered */
    customFieldVocabularies: Array<IVocabulary>;

    profiles: Array<IContentProfile>;
    selectedProfileIds: Array<string>;
    getLabel(fieldId: string): string;
}

interface IFieldOptions {
    /** Fields enabled in at least one profile in scope */
    input: Array<ISelectOption>;

    /** Fields enabled in every profile in scope */
    output: Array<ISelectOption>;
}

/**
 * Text fields an action can read from and write to. Input fields can be the union over the
 * profiles in scope, since a run reads whatever the item has, while the output field has to exist
 * in every one of them.
 */
export function getFieldOptions(params: IFieldOptionsParams): IFieldOptions {
    const {builtInTextFields, customFieldVocabularies, profiles, selectedProfileIds, getLabel} = params;

    const candidates: Array<string> = [
        ...builtInTextFields,
        ...customFieldVocabularies
            .filter((vocabulary) => vocabulary.field_type === 'text')
            .map(({_id}) => _id)
            .filter((id) => !builtInTextFields.includes(id)),
    ];

    const profilesInScope = getProfilesInScope(profiles, selectedProfileIds);

    const toOption = (id: string): ISelectOption => ({id, label: getLabel(id)});

    if (profilesInScope.length === 0) {
        const all = candidates.map(toOption);

        return {input: all, output: all};
    }

    return {
        input: candidates
            .filter((id) => profilesInScope.some((profile) => isFieldEnabledInProfile(profile, id)))
            .map(toOption),
        output: candidates
            .filter((id) => profilesInScope.every((profile) => isFieldEnabledInProfile(profile, id)))
            .map(toOption),
    };
}

/**
 * Appends the selected values that are missing from `options`, so a stored value that is no
 * longer offered (a field removed from a profile, a deleted vocabulary) stays visible and can be
 * removed, instead of the control showing something else or nothing.
 */
export function withSelectedOptions(
    options: Array<ISelectOption>,
    selectedIds: Array<string>,
    getLabel: (id: string) => string,
): Array<ISelectOption> {
    const missing = selectedIds
        .filter((id) => !options.some((option) => option.id === id))
        .map((id) => ({id, label: getLabel(id)}));

    return [...options, ...missing];
}

/** Enabled profiles, plus selected ones that are disabled or no longer exist */
export function getProfileOptions(
    profiles: Array<IContentProfile>,
    selectedProfileIds: Array<string>,
): Array<ISelectOption> {
    const enabled = profiles
        .filter(({enabled}) => enabled)
        .map(({_id, label}) => ({id: _id, label}));

    return withSelectedOptions(enabled, selectedProfileIds, (id) => {
        const profile = profiles.find(({_id}) => _id === id);

        return profile == null
            ? gettext('{{id}} (deleted)', {id})
            : gettext('{{label}} (disabled)', {label: profile.label});
    });
}
