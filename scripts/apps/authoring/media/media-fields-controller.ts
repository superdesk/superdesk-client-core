import {sortBy, get} from 'lodash';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';
import {appConfig} from 'appConfig';

MediaFieldsController.$inject = ['$q', 'metadata'];
export default function MediaFieldsController($q, metadata) {
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

        return cv;
    }

    $q.all({
        getLabelForFieldId: getLabelNameResolver(),
        metadataInit: metadata.initialize(),
    }).then(({getLabelForFieldId}) => {
        const editor = get(appConfig.editor, 'picture', {});
        const schema = get(appConfig.schema, 'picture', {});
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
                .filter((key) => get(editor[key], 'displayOnMediaEditor', true))
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
