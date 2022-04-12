import {
    ICustomFieldType,
    IArticle,
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
import {IEditor3ValueOperational, IEditor3Config, IEditor3ValueStorage} from './interfaces';
import {Difference} from './difference';
import {Preview} from './preview';
import {Config} from './config';
import {Editor} from './editor';
import {replaceAllForEachBlock} from 'core/editor3/helpers/find-replace';
import {getFieldsAdapter} from 'apps/authoring-react/field-adapters';
import {computeDerivedProperties} from './compute-derived-properties';

interface IUserPreferences {
    characterLimitMode?: CharacterLimitUiBehavior;
}

export function storeEditor3ValueBase(fieldId, article, value, config)
: {article: IArticle; stringValue: string; annotations: Array<any>} {
    const rawContentState = value.rawContentState;

    const {stringValue, annotations} = computeDerivedProperties(
        rawContentState,
        config,
        article,
    );

    const articleUpdated: IArticle = {
        ...article,
        fields_meta: {
            ...(article.fields_meta ?? {}),
            [fieldId]: {
                draftjsState: [rawContentState],
            },
        },
    };

    if (annotations.length > 0) {
        articleUpdated.fields_meta[fieldId].annotations = annotations;
    }

    return {article: articleUpdated, stringValue, annotations};
}

export function getEditor3Field()
: ICustomFieldType<IEditor3ValueOperational, IEditor3ValueStorage, IEditor3Config, IUserPreferences> {
    const field: ICustomFieldType<IEditor3ValueOperational, IEditor3ValueStorage, IEditor3Config, IUserPreferences> = {
        id: 'editor3',
        label: gettext('Editor3 (authoring-react)'),
        editorComponent: Editor,
        previewComponent: Preview,
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
            article: IArticle,
        ): IEditor3ValueOperational => {
            const store = createEditorStore(
                {
                    editorState: value.rawContentState,
                    onChange: noop,
                    language: article.language,
                },
                ng.get('spellcheck'),
                true,
            );

            const result: IEditor3ValueOperational = {
                store,
                contentState: store.getState().editorState.getCurrentContent(),
            };

            return result;
        },

        retrieveStoredValue: (fieldId, article) => {
            const rawContentState: RawDraftContentState = (() => {
                const fromFieldsMeta = article.fields_meta?.[fieldId]?.['draftjsState'][0];
                const fieldsAdapter = getFieldsAdapter();

                if (fromFieldsMeta != null) {
                    return fromFieldsMeta;
                } else if (
                    fieldsAdapter[fieldId] != null
                    && typeof article[fieldId] === 'string'
                    && article[fieldId].length > 0
                ) {
                    /**
                     * This is only for compatibility with angular based authoring.
                     * create raw content state in case only text value is present.
                     */

                    return convertToRaw(ContentState.createFromText(article[fieldId]));
                } else {
                    return convertToRaw(ContentState.createFromText(''));
                }
            })();

            const result: IEditor3ValueStorage = {
                rawContentState,
            };

            return result;
        },

        storeValue: (fieldId, article, value, config) => {
            const result = storeEditor3ValueBase(fieldId, article, value, config);
            const articleUpdated = {...result.article};

            articleUpdated.extra = {
                ...(articleUpdated.extra ?? {}),
                [fieldId]: result.stringValue,
            };

            return articleUpdated;
        },
    };

    return field;
}
