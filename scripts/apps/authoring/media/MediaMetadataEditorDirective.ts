import {max, sortBy, get, isEmpty} from 'lodash';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';

MediaMetadataEditorDirective.$inject = ['metadata', 'deployConfig', 'features', '$q', 'session'];
export default function MediaMetadataEditorDirective(metadata, deployConfig, features, $q, session) {
    function getCV(field) {
        const cv = metadata.cvs.find((_cv) => _cv._id === field || _cv.schema_field === field);

        if (cv == null && field === 'subject') {
            // fallback for built in subjectcodes
            return {selection_type: 'multi selection', items: metadata.values.subjectcodes};
        }

        if (cv == null && field === 'language' && metadata.values.languages) {
            return {schema_field: 'language', items: metadata.values.languages}; // keep it consistent with authoring
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
                metadataInit: metadata.initialize(),
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
                    (field) => field.section === 'header' ? field.order : field.order + 1000,
                );

                scope.$applyAsync();

                // set default values
                scope.$watch('item', (item) => {
                    if (!item) {
                        return;
                    }

                    if (item._id && (!item._locked || !item._editable)) {
                        return;
                    }

                    if (!scope.fields) {
                        return;
                    }

                    scope.fields
                        .filter((field) => !isEmpty(field.default))
                        .forEach((field) => {
                            const dest = field.cv ? (field.cv.schema_field || field.field) : field.field;

                            if (scope.isExtra(field)) {
                                if (!item.extra || !item.extra.hasOwnProperty(dest)) {
                                    item.extra = item.extra || {};
                                    item.extra[dest] = field.default;
                                    scope.onChange({key: 'extra'});
                                }
                            } else {
                                if (!item.hasOwnProperty(dest)) {
                                    item[dest] = field.default;
                                    scope.onChange({key: dest});
                                }
                            }
                        });

                    // populate fields for current user
                    if (get(session, 'identity.sign_off') && !item.hasOwnProperty('sign_off')) {
                        item.sign_off = session.identity.sign_off;
                    }
                });
            });

            /**
             * Test if field should be disabled for editing
             *
             * @param {Object} field
             * @return {Boolean}
             */
            scope.isDisabled = (field) => scope.disabled || (scope.associated && field.external);

            scope.isExtra = (field): boolean => field.cv && field.cv.field_type === 'text';
        },
    };
}
