import * as constant from '../constants';

ContentProfileSchemaEditor.$inject = ['gettext', 'metadata', 'content'];
export function ContentProfileSchemaEditor(gettext, metadata, content) {
    // labelMap maps schema entry keys to their display names.
    var labelMap = {
        'headline': gettext('Headline'),
        'slugline': gettext('Slug'),
        'genre': gettext('Genre'),
        'anpa_take_key': gettext('Take Key'),
        'place': gettext('Place'),
        'priority': gettext('Priority'),
        'urgency': gettext('Urgency'),
        'anpa_category': gettext('Category'),
        'subject': gettext('Subject'),
        'ednote': gettext('Editorial Note'),
        'abstract': gettext('Abstract'),
        'age_range': gettext('Age Range'),
        'assets': gettext('Assets'),
        'body_html': gettext('Body HTML'),
        'byline': gettext('Byline'),
        'dateline': gettext('Dateline'),
        'located': gettext('Located'),
        'sign_off': gettext('Sign Off'),
        'sms': gettext('SMS'),
        'body_footer': gettext('Body footer'),
        'footer': gettext('Footer'),
        'media': gettext('Media'),
        'media_description': gettext('Media Description'),
        'credit_level': gettext('Credit Level'),
        'desired_response': gettext('Desired Response'),
        'feature_image': gettext('Feature Image'),
        'featured': gettext('Featured'),
        'reader_type': gettext('Reader Type'),
        'relatedItems': gettext('Related Items'),
        'subservice_motoring': gettext('Motoring Subservice'),
        'subservice_real_life': gettext('Real Life Subservice'),
        'subservice_sport': gettext('Sport Subservice'),
        'territory': gettext('Territory'),
        'topic_news': gettext('Topic (News)'),
        'topic_sport': gettext('Topic (Sport)'),
        'company_codes': gettext('Company Codes'),
        'feature_media': gettext('Feature Media')
    };

    return {
        restrict: 'E',
        templateUrl: 'scripts/superdesk-workspace/content/views/schema-editor.html',
        require: '^form',
        scope: {
            model: '=ngModel'
        },
        link: function(scope, elem, attr, form) {

            scope.model.schema = scope.model.schema || {};
            scope.model.editor = scope.model.editor || {};
            scope.schema = angular.extend({}, content.contentProfileSchema);
            scope.editor = angular.extend({}, content.contentProfileEditor);

            metadata.initialize().then(function() {
                scope.options = {subject: metadata.values.subjectcodes};
                scope.terms = {
                    subject: metadata.values.subjectcodes,
                    anpa_category: metadata.values.categories
                };
                metadata.cvs.forEach(function(cv) {
                    var cvId = constant.CV_ALIAS[cv._id] || cv._id;
                    if (scope.schema[cvId]) {
                        scope.options[cvId] = cv.items;
                    }
                });
            });

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
                    '(superdesk-workspace/content/content/directives/ContentProfileSchemaEditor).' +
                    'ContentProfileSchemaEditor/labelMap');

                return id;
            };

            /**
             * @description Toggles whether a field is enabled or not.
             * @param {String} id the key of the field to toggle.
             */
            scope.toggle = function(id) {
                scope.model.schema[id] = scope.model.schema[id] ?
                    null : angular.extend({}, content.contentProfileSchema[id]);
                scope.model.editor[id] = !scope.model.schema[id] ?
                    null : angular.extend({}, content.contentProfileEditor[id]);
                form.$dirty = true;
            };

            /**
             * Copy value from `id` key into `default` within schema
             *
             * it's a workaround for meta-* directives, those have specific logic based on `id`
             *
             * @param {String} id
             */
            scope.setdefault = function(id) {
                scope.model.schema[id].default = scope.model.schema[id][id];
                form.$dirty = true;
            };

            scope.setDirty = function(dirty) {
                form.$dirty = !!dirty;
            };
        }
    };
}
