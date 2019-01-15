import {max, sortBy, get} from 'lodash';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';

MediaMetadataEditorDirective.$inject = ['metadata', 'deployConfig', 'features', '$q'];
export default function MediaMetadataEditorDirective(metadata, deployConfig, features, $q) {
    function getCV(field) {
        const cv = metadata.cvs.find((_cv) => !_cv.field_type && (_cv._id === field || _cv.schema_field === field));

        if (cv == null && field === 'subject') {
            return {items: metadata.values.subjectcodes}; // fallback for built in subjectcodes
        }

        return cv;
    }

    return {
        scope: {
            item: '=',
            validator: '=',
            placeholder: '=',
            disabled: '=',
            onChange: '&',
            onBlur: '&',
            dark: '@',
            boxed: '@',
            associated: '=',
        },
        template: require('./views/media-metadata-editor-directive.html'),
        link: (scope) => {
            scope.features = features;
            scope.metadata = metadata;

            $q.all({
                getLabelForFieldId: getLabelNameResolver(),
                metdataInit: metadata.initialize(),
            }).then(({getLabelForFieldId}) => {
                const editor = get(deployConfig.getSync('editor'), 'picture', {});
                const schema = get(deployConfig.getSync('schema'), 'picture', {});

                // get last order
                let nextOrder = max(Object.keys(editor).map((field) => get(editor, `${field}.order`, 0))) + 1;

                // add missing fields from validator to editor/schema
                Object.keys(scope.validator || {}).forEach((field) => {
                    if (!editor[field]) {
                        editor[field] = {
                            type: scope.validator[field].type || null,
                            order: scope.validator[field].order || nextOrder++,
                        };
                        schema[field] = scope.validator[field];
                    }
                });

                // set scope fields in order.
                // Only display fields required on the media editor based on the value of `displayOnMediaEditor`.
                // default is set to true to display all fields.
                scope.fields = sortBy(
                    Object.keys(editor)
                        .filter((key) => editor[key] != null)
                        .filter((key) => get(editor[key], 'displayOnMediaEditor', true))
                        .map((field) => Object.assign({
                            field: field,
                            label: getLabelForFieldId(field),
                            cv: getCV(field),
                        }, editor[field], schema[field])),
                    'order',
                );

                scope.$applyAsync();
            });

            /**
             * Test if field should be disabled for editing
             *
             * @param {Object} field
             * @return {Boolean}
             */
            scope.isDisabled = (field) => scope.disabled || (scope.associated && field.external);
        },
    };
}
