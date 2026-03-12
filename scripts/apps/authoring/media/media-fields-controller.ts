import {sortBy} from 'lodash';
import {getLabelForFieldId} from 'apps/workspace/helpers/getLabelForFieldId';
import {appConfig} from 'appConfig';

MediaFieldsController.$inject = ['$q', 'metadata', 'vocabularies', 'content'];
export default function MediaFieldsController($q, metadata, vocabularies, content) {
    function getCV(field) {
        const cv = metadata.cvs.find((_cv) => _cv._id === field || _cv.schema_field === field);

        if (cv == null && field === 'subject') {
            // fallback for built in subjectcodes
            return {selection_type: 'multi selection', items: metadata.values.subjectcodes};
        }

        if (cv == null && field === 'language' && metadata.values.languages) {
            // keep it consistent with authoring
            return {schema_field: 'language', items: metadata.values.languages, key: 'qcode'};
        }

        if (cv == null && field === 'authors' && metadata.values.authors) {
            return {schema_field: 'authors', items: metadata.values.authors, field_type: 'authors'};
        }

        if (cv == null && field === 'anpa_category') {
            return {schema_field: 'anpa_category', selection_type: 'multi selection',
                items: metadata.values.categories};
        }

        return cv;
    }

    $q.all({
        metadataInit: metadata.initialize(),
        getLabelForFieldId: vocabularies.getAllActiveVocabularies()
            .then((vocabulariesCollection) => (fieldId) => getLabelForFieldId(fieldId, vocabulariesCollection)),
        pictureType: content.getType('picture').catch(() => null),
    }).then(({getLabelForFieldId, pictureType}) => {
        const editorSource = appConfig.editor?.picture ?? pictureType?.editor ?? {};
        const schemaSource = appConfig.schema?.picture ?? pictureType?.schema ?? {};
        const editor = {...editorSource};
        const schema = {...schemaSource};
        const validator = appConfig.validator_media_metadata;

        // get last order
        let nextOrder = Math.max(0, ...Object.keys(editor).map((field) => editor?.[field]?.order ?? 0)) + 1;

        // add missing fields from validator to editor/schema
        Object.keys(validator || {}).forEach((field) => {
            if (!editor[field]) {
                editor[field] = {
                    type: validator[field].type || null,
                    order: validator[field].order || nextOrder++,
                };
                schema[field] = validator[field];
            }
        });

        // set scope fields in order.
        // Only display fields required on the media editor based on the value of `displayOnMediaEditor`.
        // default is set to true to display all fields.
        this.fields = sortBy(
            Object.keys(editor)
                .filter((key) => editor[key] != null)
                .filter((key) => editor[key]?.displayOnMediaEditor ?? true)
                .map((field) => {
                    const cv = getCV(field);

                    return Object.assign({
                        field: field,
                        label: getLabelForFieldId(field),
                        cv: cv,
                        extra: cv != null && (cv.field_type === 'text' || cv.field_type === 'date'),
                    }, editor[field], schema[field]);
                }),
            (field) => field.section === 'header' ? field.order : field.order + 1000,
        );
    });
}
