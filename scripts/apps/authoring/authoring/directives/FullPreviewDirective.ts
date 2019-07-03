import _ from 'lodash';
import {checkRenditions} from '../controllers/AssociationController';

FullPreviewDirective.$inject = ['$timeout', 'config', 'content', '$sce'];
export function FullPreviewDirective($timeout, config, content, $sce) {
    return {
        scope: {
            item: '=',
            closeAction: '=',
        },
        templateUrl: 'scripts/apps/authoring/views/full-preview.html',
        link: function(scope, elem, attr, ctrl) {
            scope.hide_media = false;
            scope.checkRenditions = checkRenditions;

            scope.filterKey = config.previewSubjectFilterKey || '';

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

            scope.printPreview = function() {
                angular.element('body').addClass('prepare-print');

                var afterPrint = function() {
                    angular.element('body').removeClass('prepare-print');
                };

                if (window.matchMedia) {
                    var mediaQueryList = window.matchMedia('print');

                    mediaQueryList.addListener((mql) => {
                        if (!mql.matches) {
                            afterPrint();
                        }
                    });
                }

                window.onafterprint = afterPrint;

                $timeout(() => {
                    window.print();
                }, 200, false);
                return false;
            };

            scope.associationExists = function(associations, fieldId) {
                return _.size(scope.getAssociationItems(associations, fieldId));
            };

            scope.getAssociationItems = function(associations, fieldId) {
                var result = _.filter(associations, (association, key) => key.indexOf(fieldId) !== -1);

                return result;
            };

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
