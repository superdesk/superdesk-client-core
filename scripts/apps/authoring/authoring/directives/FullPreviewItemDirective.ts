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

            // Prevent external code from modifying this scope directly.
            const fakeScope: any = {};

            content.setupAuthoring(scope.item.profile, fakeScope, scope.item).then(() => {
                scope.editor = fakeScope.editor;
                scope.fields = fakeScope.fields;
            });

            scope.getHtml = function(html) {
                return $sce.trustAsHtml(html);
            };

            scope.associationExists = function(associations, fieldId) {
                return _.size(scope.getAssociationItems(associations, fieldId));
            };

            scope.getSubjectFieldsWithoutScheme = () => {
                return scope.item.subject.filter((val) => val['scheme'] == null);
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
