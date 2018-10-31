import {max, sortBy, get} from 'lodash';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';

MediaMetadataEditorDirective.$inject = ['metadata', 'deployConfig', '$q'];
export default function MediaMetadataEditorDirective(metadata, deployConfig, $q) {
    function getCV(field) {
        return metadata.cvs.find((cv) => !cv.field_type && (cv._id === field || cv.schema_field === field));
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
            $q.all({
                getLabelForFieldId: getLabelNameResolver(),
                metdataInit: metadata.initialize(),
            }).then(({getLabelForFieldId}) => {
                const editor = get(deployConfig.getSync('editor'), 'picture', {});
                const schema = get(deployConfig.getSync('editor'), 'picture', {});

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

                // set scope fields in order
                scope.fields = sortBy(
                    Object.keys(editor)
                        .filter((key) => editor[key] != null)
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
