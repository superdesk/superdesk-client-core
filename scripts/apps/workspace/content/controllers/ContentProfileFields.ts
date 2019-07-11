import {get, keyBy} from 'lodash';
import {IArticle} from 'superdesk-api';
import {getLabelForFieldId} from '../../helpers/getLabelForFieldId';
import {getTypeForFieldId} from '../../helpers/getTypeForFieldId';

const ARTICLE_HEADER_FIELDS = new Set<keyof IArticle>([
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

const ARTICLE_COMMON_FIELDS = new Set<keyof IArticle>([
    'slugline',
]);

ContentProfileFields.$inject = ['$scope', 'content', 'vocabularies', 'metadata'];
export default function ContentProfileFields($scope, content, vocabularies, metadata) {
    this.model = $scope.editing.form;
    this.fieldsById = {};
    this.fieldsBySection = {};

    const getOrder = (field) => get(this.model.editor[field], 'order') || 99;
    const isEnabled = (field) => get(this.model.editor[field], 'enabled', false);

    Promise.all([
        content.getCustomFields(),
        content.getTypeMetadata(this.model._id),
        vocabularies.getVocabularies(),
    ]).then((res) => {
        const [customFields, typeMetadata, vocabulariesCollection] = res;

        const label = (id) => getLabelForFieldId(id, vocabulariesCollection);

        const getArticleHeaderFields = (customVocabulariesForArticleHeader) => {
            const articleHeaderFields = new Set();

            ARTICLE_HEADER_FIELDS.forEach((id) => {
                articleHeaderFields.add(id);
            });

            customVocabulariesForArticleHeader.forEach((filteredCustomField) => {
                articleHeaderFields.add(filteredCustomField._id);
            });

            return articleHeaderFields;
        };

        const getArticleCommonFields = (customTextAndDateVocabularies) => {
            const articleCommonFields = new Set();

            ARTICLE_COMMON_FIELDS.forEach((id) => {
                articleCommonFields.add(id);
            });

            customTextAndDateVocabularies.forEach((filteredCustomField) => {
                articleCommonFields.add(filteredCustomField._id);
            });

            return articleCommonFields;
        };

        const initFields = (customVocabulariesForArticleHeader, customTextAndDateVocabularies) => {
            this.articleHeaderFields = getArticleHeaderFields(customVocabulariesForArticleHeader);
            this.articleCommonFields = getArticleCommonFields(customTextAndDateVocabularies);

            this.enabled = Object.keys(this.model.editor)
                .filter(isEnabled)
                .sort((a, b) => getOrder(a) - getOrder(b));

            updateSections();
        };

        this.model.schema = angular.extend({}, content.contentProfileSchema);
        this.model.editor = angular.extend({}, content.contentProfileEditor);

        this.model.schema = angular.extend({}, typeMetadata.schema);
        this.model.editor = angular.extend({}, typeMetadata.editor);
        this.fieldsById = keyBy(customFields, '_id');

        metadata.getAllCustomVocabulariesForArticleHeader(
            this.model.editor,
            this.model.schema,
        ).then(({customVocabulariesForArticleHeader, customTextAndDateVocabularies}) => {
            initFields(customVocabulariesForArticleHeader, customTextAndDateVocabularies);
        });

        const formatKey = (key: string) => ({
            key: key,
            name: this.model.editor[key].field_name || label(key),
            type: getTypeForFieldId(key, vocabulariesCollection),
        });

        const updateSections = () => {
            this.sections = {
                header: {
                    enabled: [],
                    available: [],
                },
                content: {
                    enabled: [],
                    available: [],
                },
            };

            this.enabled.forEach((key, index) => {
                const headerField = this.articleHeaderFields.has(key) || this.articleCommonFields.has(key);
                const section = this.model.editor[key].section || (headerField ? 'header' : 'content');

                this.sections[section].enabled.push(key);
                this.model.editor[key].order = index + 1; // keep order in sync
            });

            Object.keys(this.model.editor)
                .filter((key) => !isEnabled(key))
                .forEach((key) => {
                    const headerField = this.articleHeaderFields.has(key) || this.articleCommonFields.has(key);
                    const contentField = this.articleCommonFields.has(key) || !headerField;

                    if (headerField) {
                        this.sections.header.available.push(formatKey(key));
                    }

                    if (contentField) {
                        this.sections.content.available.push(formatKey(key));
                    }

                    this.model.editor[key].order = null;
                });
        };

        const updateModel = (key, editorUpdates, schemaUpdates) => {
            const editor = {...this.model.editor};
            const schema = {...this.model.schema};

            editor[key] = Object.assign({}, editor[key], editorUpdates);
            schema[key] = Object.assign({}, schema[key], schemaUpdates);

            this.model.editor = editor;
            this.model.schema = schema;
        };

        /**
         * @description Disable field in content profile
         * @param {String} key the key of the field to toggle.
         */
        this.remove = (key) => {
            updateModel(key, {enabled: false, section: null}, {enabled: false});
            this.removeEnabled(key);
            updateSections();
        };

        this.add = (key, dest, position, section) => {
            updateModel(key, {enabled: true, section: section}, {enabled: true});

            let destIndex = this.enabled.indexOf(dest);

            if (position === 'after') {
                destIndex++;
            }

            this.enabled.splice(destIndex, 0, key);
            updateSections();
        };

        this.reorder = (key) => {
            this.removeEnabled(key);
            this.enabled.splice(this.model.editor[key].order, 0, key);
            updateSections();
        };

        this.drag = (start, end, key) => {
            const dest = this.enabled.indexOf(key) + end - start;

            this.removeEnabled(key);
            this.enabled.splice(dest, 0, key);
            updateSections();
        };

        this.removeEnabled = (key) => {
            this.enabled = this.enabled.filter((_key) => _key !== key);
        };
    });
}
