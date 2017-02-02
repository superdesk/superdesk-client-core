import * as constant from '../constants';

ContentProfileSchemaEditor.$inject = ['gettext', 'metadata', 'content', 'config'];
export function ContentProfileSchemaEditor(gettext, metadata, content, config) {
    // labelMap maps schema entry keys to their display names.
    var labelMap = {
        headline: gettext('Headline'),
        slugline: gettext('Slug'),
        genre: gettext('Genre'),
        anpa_take_key: gettext('Take Key'),
        place: gettext('Place'),
        priority: gettext('Priority'),
        urgency: gettext('Urgency'),
        anpa_category: gettext('Category'),
        subject: gettext('Subject'),
        ednote: gettext('Editorial Note'),
        abstract: gettext('Abstract'),
        body_html: gettext('Body HTML'),
        byline: gettext('Byline'),
        dateline: gettext('Dateline'),
        sign_off: gettext('Sign Off'),
        sms: gettext('SMS'),
        body_footer: gettext('Body footer'),
        footer: gettext('Footer'),
        media: gettext('Media'),
        media_description: gettext('Media Description'),
        feature_image: gettext('Feature Image'),
        feature_media: gettext('Feature Media'),
        relatedItems: gettext('Related Items'),
        company_codes: gettext('Company Codes')
    };

    return {
        restrict: 'E',
        templateUrl: 'scripts/apps/workspace/content/views/schema-editor.html',
        require: '^form',
        scope: {
            model: '=ngModel'
        },
        link: function(scope, elem, attr, form) {
            scope.loading = true;
            scope.model.schema = angular.extend({}, content.contentProfileSchema);
            scope.model.editor = angular.extend({}, content.contentProfileEditor);

            content.getTypeMetadata(scope.model._id).then((typeMetadata) => {
                scope.model.schema = angular.extend({}, typeMetadata.schema);
                scope.model.editor = angular.extend({}, typeMetadata.editor);

                metadata.initialize().then(() => {
                    scope.options = {subject: metadata.values.subjectcodes};
                    scope.terms = {
                        subject: metadata.values.subjectcodes,
                        anpa_category: metadata.values.categories
                    };

                    metadata.cvs.forEach((cv) => {
                        var cvId = constant.CV_ALIAS[cv._id] || cv._id;

                        if (scope.model.editor[cvId]) {
                            scope.options[cvId] = cv.items;
                        }
                    });

                    scope.loading = false;
                });
            });

            scope.directive = this.name;

            scope.withEditor3 = config.features.editor3;

            scope.formatingOptions = [
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull',
                'outdent', 'indent', 'unorderedlist', 'orderedlist',
                'pre', 'quote', 'image', 'anchor', 'superscript', 'subscript', 'strikethrough',
                'underline', 'italic', 'bold', 'table'
            ];

            /**
             * @description label returns the display name for a key.
             */
            scope.label = function(id) {
                if (labelMap.hasOwnProperty(id)) {
                    return labelMap[id];
                }

                console.warn(`could not find label for ${id}. Please add it in ` +
                    '(apps/workspace/content/content/directives/ContentProfileSchemaEditor).' +
                    'ContentProfileSchemaEditor/labelMap');

                return id.charAt(0).toUpperCase() + id.substr(1).toLowerCase();
            };

            /**
             * @description Toggles whether a field is enabled or not.
             * @param {String} id the key of the field to toggle.
             */
            scope.toggle = function(id) {
                scope.model.editor[id].enabled = !scope.model.editor[id].enabled;
                scope.model.schema[id].enabled = !scope.model.schema[id].enabled;
                form.$dirty = true;
            };

            scope.setDirty = function(dirty) {
                form.$dirty = !!dirty;
            };
        }
    };
}
