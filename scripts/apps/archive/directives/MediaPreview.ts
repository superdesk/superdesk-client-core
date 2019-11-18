import _ from 'lodash';
import {checkRenditions} from 'apps/authoring/authoring/controllers/AssociationController';

/**
 * @ngdoc directive
 * @module superdesk.apps.archive
 * @name sdMediaPreview
 *
 * @requires api
 * @requires $rootScope
 * @requires desks
 * @requires superdesk
 * @requires content
 * @requires storage
 *
 * @description Renders the preview of the list item.
 *
 */

MediaPreview.$inject = ['api', '$rootScope', 'desks', 'superdesk', 'content', 'storage'];

export function MediaPreview(api, $rootScope, desks, superdesk, content, storage) {
    return {
        template: require('../views/preview.html'),
        link: function(scope, elem) {
            const PREVIEW_HEADER_STATE = 'item_preview:header_state';

            scope.checkRenditions = checkRenditions;
            scope.previewState = {toggleHeader: false};
            if (scope.selected.preview.profile) {
                content.getType(scope.selected.preview.profile)
                    .then((type) => {
                        scope.editor = content.editor(type);
                        scope.fields = content.fields(type);
                    });
            } else {
                content.getCustomFields().then(() => {
                    scope.editor = content.editor(null, scope.selected.preview.type);
                    scope.fields = content.fields({editor: scope.editor});
                });
            }
            // prevent dragging from preview
            elem.on('dragstart', () => false);

            /**
             * @ngDoc method
             * @name sdMediaPreview#setPreviewState
             *
             * @description Set the preview header state
             */
            const setPreviewState = (state) => {
                scope.previewState = {toggleHeader: state};
                storage.setItem(PREVIEW_HEADER_STATE, state);
            };

            setPreviewState(storage.getItem(PREVIEW_HEADER_STATE) || false);

            /**
             * @ngDoc method
             * @name sdMediaPreview#previewRewriteStory
             *
             * @description Preview the rewrite story.
             */
            scope.previewRewriteStory = function() {
                return api.find('archive', scope.item.rewrite_id).then((item) => {
                    $rootScope.$broadcast('broadcast:preview', {item: item});
                });
            };

            /**
             * @ngDoc method
             * @name sdMediaPreview#previewRewriteStory
             *
             * @description Preview the item (picture, story).
             */
            scope.preview = function(item) {
                superdesk.intent('preview', 'item', item);
            };

            /**
             * @ngDoc method
             * @name sdMediaPreview#togglePreviewHeader
             *
             * @description Toggle the preview header.
             */
            scope.togglePreviewHeader = () => {
                setPreviewState(!scope.previewState.toggleHeader);
            };

            scope.getCompanyCodes = function() {
                return _.map(scope.item.company_codes, 'qcode').join(', ');
            };

            scope.associationExists = function(associations, fieldId) {
                return _.size(scope.getAssociatedItems(associations, fieldId));
            };

            scope.getAssociatedItems = function(associations, fieldId) {
                var result = _.filter(associations, (association, key) => key.indexOf(fieldId) !== -1);

                return result;
            };

            desks.initialize().then(() => {
                scope.userLookup = desks.userLookup;
            });

            scope.$on('$destroy', () => {
                elem.off('dragstart');
            });
        },
    };
}

export function MediaPreviewWidget() {
    return {
        scope: {item: '='},
        templateUrl: 'scripts/apps/archive/views/item-preview.html',
    };
}
