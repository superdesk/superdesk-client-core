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
            var oldClass = null;

            scope.$watch('item', (item) => {
                if (item != null) {
                    setIcon(item);
                } else {
                    oldClass = null;
                }
            });

            function setIcon(item) {
                var cls = 'filetype-icon-';

                if (item.type === 'composite' && item.highlight) {
                    cls += 'highlight-pack';
                } else {
                    cls += item.type;
                }

                if (oldClass === cls) {
                    return;
                }

                element.attr('title', `${gettextCatalog.getString('Article Type')}: ${item.type}`);
                element.addClass(cls);
                element.removeClass(oldClass);
                oldClass = cls;
            }
        },
    })]);
