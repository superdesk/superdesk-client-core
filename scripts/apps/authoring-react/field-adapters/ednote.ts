import {IArticle, IAuthoringFieldV2, IFieldAdapter, IEditor3Config} from 'superdesk-api';
import {gettext} from 'core/utils';
import {retrieveStoredValueEditor3Generic, storeEditor3ValueBase} from '.';

export const ednote: IFieldAdapter<IArticle> = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const fieldConfig: IEditor3Config = {
            editorFormat: [],
            minLength: fieldSchema?.minlength,
            maxLength: fieldSchema?.maxlength,
            maxSoftLength: fieldEditor?.maxSoftLength,
            showFloatingCount: fieldEditor?.showFloatingCount,
            cleanPastedHtml: fieldEditor?.cleanPastedHTML,
            singleLine: false,
            disallowedCharacters: [],
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'ednote',
            name: gettext('Ed. Note'),
            fieldType: 'editor3',
            fieldConfig,
        };

        return fieldV2;
    },

    // `plainTextInMultiLineMode` must match `storeValue` below, otherwise reading and
    // writing disagree about whether the stored string is plain text or HTML.
    retrieveStoredValue: (item: IArticle, authoringStorage, config: IEditor3Config) =>
        retrieveStoredValueEditor3Generic(
            'ednote',
            item,
            authoringStorage,
            config,
            true,
        ),

    storeValue: (value, item, config) => {
        const result = storeEditor3ValueBase(
            'ednote',
            item,
            value,
            config,
            true,
        );

        const articleUpdated = {...result.article};

        articleUpdated.ednote = result.stringValue;

        return articleUpdated;
    },
};
