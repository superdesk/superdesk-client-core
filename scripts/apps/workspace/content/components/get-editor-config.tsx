import ng from 'core/services/ng';
import {assertNever} from 'core/helpers/typescript-helpers';
import {IContentProfileEditorConfig, IArticle} from 'superdesk-api';
import {getFields} from 'apps/fields';

export const ARTICLE_HEADER_FIELDS = new Set<keyof IArticle>([
    'keywords',
    'genre',
    'anpa_take_key',
    'place',
    'language',
    'priority',
    'urgency',
    'anpa_category',
    'subject',
    'company_codes',
    'ednote',
    'authors',
]);

export const ARTICLE_COMMON_FIELDS = new Set<keyof IArticle>([
    'slugline',
]);

export const getArticleHeaderFields = (customVocabulariesForArticleHeader): Set<string> => {
    const articleHeaderFields = new Set<string>();

    ARTICLE_HEADER_FIELDS.forEach((id) => {
        articleHeaderFields.add(id);
    });

    customVocabulariesForArticleHeader.forEach((filteredCustomField) => {
        articleHeaderFields.add(filteredCustomField._id);
    });

    return articleHeaderFields;
};

const getArticleCommonFields = (customTextAndDateVocabularies, customFields): Set<string> => {
    const articleCommonFields = new Set<string>();

    ARTICLE_COMMON_FIELDS.forEach((id) => {
        articleCommonFields.add(id);
    });

    const fieldsFromExtensions = Object.keys(getFields());

    customFields.forEach((customField) => {
        if (
            customField.custom_field_type != null
            && fieldsFromExtensions.includes(customField.custom_field_type)
        ) {
            articleCommonFields.add(customField._id);
        }
    });

    customTextAndDateVocabularies.forEach((filteredCustomField) => {
        articleCommonFields.add(filteredCustomField._id);
    });

    return articleCommonFields;
};

export function getEditorConfig(contentTypeId) {
    const content = ng.get('content');
    const metadata = ng.get('metadata');

    return Promise.all([
        content.getCustomFields(),
        content.getTypeMetadata(contentTypeId),
    ]).then((res) => {
        const [customFields, typeMetadata] = res;

        let editor: IContentProfileEditorConfig = angular.extend({}, content.contentProfileEditor);

        editor = angular.extend({}, typeMetadata.editor);

        let schema = angular.extend({}, content.contentProfileSchema);

        schema = angular.extend({}, typeMetadata.schema);

        return metadata.getAllCustomVocabulariesForArticleHeader(
            editor,
            schema,
        ).then(({customVocabulariesForArticleHeader, customTextAndDateVocabularies}) => {
            const articleHeaderFields = getArticleHeaderFields(customVocabulariesForArticleHeader);
            const articleCommonFields = getArticleCommonFields(customTextAndDateVocabularies, customFields);

            for (const key in editor) {
                const isHeaderField = articleHeaderFields.has(key) || articleCommonFields.has(key);
                const section = editor[key].section || (isHeaderField ? 'header' : 'content');

                if (editor[key] != null) {
                    editor[key].section = section;
                }
            }

            return {
                editor,
                schema,
                isAllowedForSection: (section: 'header' | 'content', fieldId) => {
                    if (section === 'header') {
                        return articleHeaderFields.has(fieldId) || articleCommonFields.has(fieldId);
                    } else if (section === 'content') {
                        return !articleHeaderFields.has(fieldId);
                    } else {
                        return assertNever(section);
                    }
                },
            };
        });
    });
}
