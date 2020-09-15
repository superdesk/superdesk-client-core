import _ from 'lodash';
import {checkRenditions, getAssociationsByFieldId} from '../controllers/AssociationController';

FullPreviewItemDirective.$inject = ['content', '$sce'];
export function FullPreviewItemDirective(content, $sce) {
    return {
        scope: {
            item: '=',
            hideMedia: '=',
        },
        templateUrl: 'scripts/apps/authoring/views/full-preview-item.html',
        link: function(scope, elem, attr, ctrl) {
            scope.checkRenditions = checkRenditions;

            scope.hasValue = (v) => {
                if (typeof v === 'string') {
                    return v.length > 0;
                } else {
                    return v != null;
                }
            };

            if (scope.item.profile) {
                content.getType(scope.item.profile)
                    .then((type) => {
                        scope.editor = content.editor(type);
                        scope.fields = content.fields(type);
                    });
            } else {
                scope.editor = content.editor();
            }

            scope.getHtml = function(html) {
                return $sce.trustAsHtml(html);
            };

            scope.isCustomList = function(field) {
                return ['text', 'date', 'media', 'embed'].indexOf(field.field_type) === -1;
            };

            scope.associationExists = function(associations, fieldId) {
                return _.size(scope.getAssociationItems(associations, fieldId));
            };

            scope.getAssociationItems = getAssociationsByFieldId;

            scope.getLocaleName = function(term) {
                if (!term) {
                    return 'None';
                }

                if (term.translations && scope.item.language
                    && term.translations.name[scope.item.language]) {
                    return term.translations.name[scope.item.language];
                }

                return term.name;
            };
        },
    };
}
