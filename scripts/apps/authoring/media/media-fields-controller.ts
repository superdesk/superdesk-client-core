import {max, sortBy, get} from 'lodash';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';

MediaFieldsController.$inject = ['$q', 'deployConfig', 'metadata'];
export default function MediaFieldsController($q, deployConfig, metadata) {
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

        return cv;
    }

    $q.all({
        getLabelForFieldId: getLabelNameResolver(),
        metadataInit: metadata.initialize(),
    }).then(({getLabelForFieldId}) => {
        const editor = get(deployConfig.getSync('editor'), 'picture', {});
        const schema = get(deployConfig.getSync('schema'), 'picture', {});
        const validator = deployConfig.getSync('validator_media_metadata');

        // get last order
        let nextOrder = max(Object.keys(editor).map((field) => get(editor, `${field}.order`, 0))) + 1;

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
