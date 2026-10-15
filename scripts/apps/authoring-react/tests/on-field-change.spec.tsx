import {Map, OrderedMap} from 'immutable';
import {
    IArticle,
    IAuthoringFieldV2,
    IContentProfileV2,
    IExtensionObject,
    IPropsAuthoring,
    IStorageAdapter,
} from 'superdesk-api';
import {extensions} from 'appConfig';
import {AuthoringReact} from '../authoring-react';

const EXTENSION_ID = 'authoring-react-on-field-change-spec';
const FIELD_TYPE = 'plain-text-for-spec';
const FIELD_ID = 'headline';

const field: IAuthoringFieldV2 = {
    id: FIELD_ID,
    name: 'Headline',
    fieldType: FIELD_TYPE,
    fieldConfig: {},
};

const profile: IContentProfileV2 = {
    id: 'spec-profile',
    name: 'Spec profile',
    header: OrderedMap<string, IAuthoringFieldV2>(),
    content: OrderedMap<string, IAuthoringFieldV2>().set(field.id, field),
};

const storageAdapter: IStorageAdapter<IArticle> = {
    storeValue: (value, fieldId, entity) => ({...entity, [fieldId]: value}),
    retrieveStoredValue: (item, fieldId) => item[fieldId] ?? null,
};

/**
 * `serializeFieldsDataAndApplyOnEntity` looks the field type up in the extension registry, so the
 * spec has to contribute one. Storage format is left undefined, which means the operational value
 * is stored as is.
 */
function registerFieldType(): void {
    extensions[EXTENSION_ID] = {
        activationResult: {
            contributions: {
                customFieldTypes: [{id: FIELD_TYPE} as any],
            },
        },
    } as IExtensionObject;
}

function createAuthoring(
    storedValue: string,
    onFieldChange: IPropsAuthoring<IArticle>['onFieldChange'],
): AuthoringReact<IArticle> {
    const item = {_id: 'spec-item', [FIELD_ID]: storedValue} as unknown as IArticle;

    const authoring = new AuthoringReact<IArticle>({
        itemId: 'spec-item',
        onFieldChange,
        fieldsAdapter: {},
        storageAdapter,
    } as unknown as IPropsAuthoring<IArticle>);

    // assigning rather than `setState` keeps the component out of the react lifecycle; the unit
    // under test is `handleFieldChange`, and rendering would drag in the whole authoring frame
    (authoring as any).state = {
        initialized: true,
        loading: false,
        itemOriginal: item,
        itemWithChanges: item,
        itemAutosaved: null,
        fieldsDataOriginal: Map<string, unknown>().set(FIELD_ID, storedValue),
        fieldsDataWithChanges: Map<string, unknown>().set(FIELD_ID, storedValue),
        profile,
        toggledFields: {},
        userPreferencesForFields: {},
        spellcheckerEnabled: false,
        validationErrors: {},
        allThemes: {default: null, proofreading: null},
        proofreadingEnabled: false,
    };

    (authoring as any).setState = () => {
        // `handleFieldChange` commits through setState; the spec asserts on what it hands to
        // `onFieldChange` before that, so committing is not needed and would trigger a render.
    };

    return authoring;
}

describe('authoring-react onFieldChange', () => {
    beforeEach(registerFieldType);

    afterEach(() => {
        delete extensions[EXTENSION_ID];
    });

    /**
     * `onFieldChange` runs while the `setState` argument is being built, so `this.state` still
     * holds the previous field values. A consumer that writes the computed item straight to
     * storage, as the settings template editor does, would save an item one edit behind.
     */
    it('computes an entity that includes the change being applied', () => {
        let computed: IArticle | null = null;

        const authoring = createAuthoring(
            'stored headline',
            (_fieldId, fieldsData, computeLatestEntity) => {
                computed = computeLatestEntity();

                return fieldsData;
            },
        );

        authoring.handleFieldChange(FIELD_ID, 'edited headline');

        expect(computed).not.toBeNull();
        expect(computed[FIELD_ID]).toBe('edited headline');
    });

    it('passes the field values including the change being applied', () => {
        let received: Map<string, unknown> | null = null;

        const authoring = createAuthoring(
            'stored headline',
            (_fieldId, fieldsData) => {
                received = fieldsData;

                return fieldsData;
            },
        );

        authoring.handleFieldChange(FIELD_ID, 'edited headline');

        expect(received.get(FIELD_ID)).toBe('edited headline');
    });

    it('keeps computeLatestEntity reading committed state', () => {
        const authoring = createAuthoring('stored headline', (_fieldId, fieldsData) => fieldsData);

        expect(authoring.computeLatestEntity()[FIELD_ID]).toBe('stored headline');
    });
});
