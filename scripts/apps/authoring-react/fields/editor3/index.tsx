import {
    ICustomFieldType,
    IEditor3ValueOperational,
    IEditor3Config,
    IEditor3ValueStorage,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {convertToRaw, ContentState, RawDraftContentState} from 'draft-js';
import createEditorStore, {
    prepareEditor3StateForExport,
} from 'core/editor3/store';
import ng from 'core/services/ng';
import {noop} from 'lodash';
import {
    CharacterLimitUiBehavior,
} from 'apps/authoring/authoring/components/CharacterCountConfigButton';
import {Difference} from './difference';
import {Preview} from './preview';
import {Config} from './config';
import {Editor} from './editor';
import {replaceAllForEachBlock} from 'core/editor3/helpers/find-replace';

interface IUserPreferences {
    characterLimitMode?: CharacterLimitUiBehavior;
}

export const EDITOR_3_FIELD_TYPE = 'editor3';

export function editor3ToOperationalFormat(
    value: IEditor3ValueStorage,
    language: string,
): IEditor3ValueOperational {
    const emptyState: RawDraftContentState = {blocks: [], entityMap: {}};

    const store = createEditorStore(
        {
            editorState: value?.rawContentState ?? emptyState,
            onChange: noop,
            language: language,
        },
        ng.get('spellcheck'),
        true,
    );

    const result: IEditor3ValueOperational = {
        store,
        contentState: store.getState().editorState.getCurrentContent(),
    };

    return result;
}

export const EDITOR_3_FIELD_TYPE = 'editor3';

export function getEditor3Field()
: ICustomFieldType<IEditor3ValueOperational, IEditor3ValueStorage, IEditor3Config, IUserPreferences> {
    const field: ICustomFieldType<IEditor3ValueOperational, IEditor3ValueStorage, IEditor3Config, IUserPreferences> = {
        id: EDITOR_3_FIELD_TYPE,
        label: gettext('Editor3 (authoring-react)'),
        editorComponent: Editor,
        previewComponent: Preview,

        hasValue: (valueOperational) => valueOperational.contentState.getPlainText().trim().length > 0,

        getEmptyValue: (config, language) => {
            return editor3ToOperationalFormat(
                {rawContentState: convertToRaw(ContentState.createFromText(''))},
                language,
            );
        },

        onToggledOn: ({fieldsData, config, language}) => {
            const fieldValue: IEditor3ValueOperational | null =
                config.copyFromFieldOnToggle == null
                    ? null
                    : fieldsData.get(config.copyFromFieldOnToggle) as IEditor3ValueOperational | null;

            const plainText = fieldValue?.contentState?.getPlainText() ?? '';

            return editor3ToOperationalFormat(
                {rawContentState: convertToRaw(ContentState.createFromText(plainText))},
                language,
            );
        },

        differenceComponent: Difference,
        configComponent: Config,

        toStorageFormat: (valueOperational: IEditor3ValueOperational, config: IEditor3Config): IEditor3ValueStorage => {
            let contentState = prepareEditor3StateForExport(
                valueOperational.store.getState().editorState.getCurrentContent(),
            );

            // trim whitespace at the beginning of each block
            contentState = replaceAllForEachBlock(contentState, /^\s+/g, '');

            // trim whitespace at the end of each block
            contentState = replaceAllForEachBlock(contentState, /\s+$/g, '');

            // replace multiple spaces with a single space
            contentState = replaceAllForEachBlock(contentState, /\s\s+/g, ' ');

            const storageValue: IEditor3ValueStorage = {
                rawContentState: convertToRaw(contentState),
            };

            return storageValue;
        },

        toOperationalFormat: (
            value: IEditor3ValueStorage,
            config: IEditor3Config,
            language: string,
        ): IEditor3ValueOperational => {
            return editor3ToOperationalFormat(value, language);
        },
    };

    return field;
}
