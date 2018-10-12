export default angular.module('superdesk.core.directives.filetypeIcon', [])
/**
 * @ngdoc directive
 * @module superdesk.core.directives
 * @name sdFiletypeIcon
 *
 * @param {Object} item Item from ItemList provider.
 *
 * @description Adds the "filetype-icon-*" class based on the item.
 */
    .directive('sdFiletypeIcon', ['gettextCatalog', (gettextCatalog) => ({
        scope: {item: '='},
        link: function(scope, element, attrs) {
            var stopWatch = scope.$watch('item', (item) => {
                if (item) {
                    initIcon(item);
                    stopWatch();
                }
            });

            function initIcon(item) {
                var cls = 'filetype-icon-';

                if (item.type === 'composite' && item.highlight) {
                    cls += 'highlight-pack';
                } else {
                    cls += item.type;
                }
                element.attr('title', `${gettextCatalog.getString('Article Type')}: ${item.type}`);
                element.addClass(cls);
            }
        },
    })]);
