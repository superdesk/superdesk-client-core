export default angular.module('superdesk.directives.filetypeIcon', [])
/**
 * sdFiletypeIcon adds proper "filetype-icon-*" class based item.
 *
 * Usage:
 * <i sd-filetype-icon data-item="item"></i>
 *
 * Params:
 * @scope {Object} item - item from ItemList provider
 */
.directive('sdFiletypeIcon', function() {
    return {
        scope: {item: '@'},
        link: function(scope, element, attrs) {
            scope.$watch('item', function(item) {
                if (item) {
                    initIcon(item);
                }
            }, true);

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
