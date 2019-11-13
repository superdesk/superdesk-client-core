import {get, isEmpty} from 'lodash';

MediaMetadataEditorDirective.$inject = ['metadata', 'features', 'session'];
export default function MediaMetadataEditorDirective(metadata, features, session) {
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
            multi: '=',
            fields: '=',
        },
        template: require('./views/media-metadata-editor-directive.html'),
        link: (scope) => {
            scope.features = features;
            scope.metadata = metadata;

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

                        if (field.extra) {
                            if (!item.extra || !item.extra.hasOwnProperty(dest)) {
                                item.extra = item.extra || {};
                                item.extra[dest] = field.default;
                                // only call on change for single image editing, not multi upload
                                // it would override other extra values
                                if (!scope.multi) {
                                    scope.onChange({key: 'extra'});
                                }
                            }
                        } else if (!item.hasOwnProperty(dest)) {
                            item[dest] = field.default;
                            scope.onChange({key: dest});
                        }
                    });

                // populate fields for current user
                if (get(session, 'identity.sign_off') && !item.hasOwnProperty('sign_off')) {
                    item.sign_off = session.identity.sign_off;
                }
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
