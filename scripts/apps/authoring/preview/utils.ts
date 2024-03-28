import {ARTICLE_HEADER_FIELDS, ARTICLE_COMMON_FIELDS} from 'apps/workspace/content/components/get-editor-config';
import {IArticle, IVocabulary} from 'superdesk-api';
import {authoringFieldHasValue} from './authoringFieldHasValue';
import {getAuthoringField} from './getAuthoringField';
import {isMediaField} from './isMediaField';
import {IAuthoringField} from './types';

const getSortedFieldsCore = (
    section: 'header' | 'content',
    editor: any,
    item: Partial<IArticle>,
    customVocabularies: Array<IVocabulary>,
): Array<IAuthoringField> => {
    return Object.keys(editor)
        .filter((key) => editor[key] != null)
        .filter(
            (key) => {
                const isHeader = editor[key].section === 'header'
                || ARTICLE_HEADER_FIELDS.has(key as keyof IArticle)
                || ARTICLE_COMMON_FIELDS.has(key as keyof IArticle);

                const inSection = (() => {
                    if (ARTICLE_HEADER_FIELDS.has(key as keyof IArticle)) {
                    // Handle invalid config when header-only fields are set as content.
                        return section === 'header';
                    } if (editor[key].section != null) {
                        return editor[key].section === section;
                    } else {
                        return section === 'header' ? isHeader : !isHeader;
                    }
                })();

                return inSection && editor[key].hideOnPrint !== true;
            },
        )
        .sort((key1, key2) => editor[key1].order - editor[key2].order)
        .map((key) => getAuthoringField(key, item, customVocabularies));
};

export const getSortedFields = (
    section: 'header' | 'content',
    editor: any,
    item: Partial<IArticle>,
    hideMedia: boolean,
    customVocabularies: Array<IVocabulary>,
): Array<IAuthoringField> => {
    return getSortedFieldsCore(section, editor, item, customVocabularies)
        .filter(
            (field) =>
                field?.value != null
                && authoringFieldHasValue(field)
                && (hideMedia ? isMediaField(field) !== true : true),
        );
};

export const getSortedFieldsFiltered = (
    section: 'header' | 'content',
    editor: any,
    item: Partial<IArticle>,
    hideMedia: boolean,
    customVocabularies: Array<IVocabulary>,
    fieldsToExtract: Array<string>,
): { allFields: Array<IAuthoringField>, extractedFields: {[key: string]: IAuthoringField}} => {
    let extractedFields: {[key: string]: IAuthoringField} = {};
    const allFields = getSortedFieldsCore(section, editor, item, customVocabularies)
        .filter((field) => {
            if (field?.value != null
                && authoringFieldHasValue(field)
                && (hideMedia ? isMediaField(field) !== true : true)
            ) {
                if (fieldsToExtract.includes(field.id)) {
                    extractedFields = {
                        ...extractedFields,
                        [field.id]: field,
                    };

                    // If the field was added to extractedFieldsArray, don't include it in allFields array
                    return false;
                }

                return true;
            } else {
                return false;
            }
        });

    return {
        allFields,
        extractedFields,
    };
};
