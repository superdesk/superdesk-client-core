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
.directive('sdFiletypeIcon', function() {
    return {
        scope: {item: '='},
        link: function(scope, element, attrs) {
            var stopWatch = scope.$watch('item', function(item) {
                if (item) {
                    initIcon(item);
                    stopWatch();
                }
            });

            function initIcon(item) {
                var cls = 'filetype-icon-';

                if (item.package_type) {
                    cls += 'takes-pack';
                } else if (item.type === 'composite' && item.highlight) {
                    cls += 'highlight-pack';
                } else {
                    cls += item.type;
                }
                element.addClass(cls);
            }
        }
    };
});
