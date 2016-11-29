ItemSearchbar.$inject = ['$location', '$document', 'asset'];

/**
 * Item search component
 */
export function ItemSearchbar($location, $document, asset) {
    return {
        templateUrl: asset.templateUrl('apps/search/views/item-searchbar.html'),
        link: function(scope, elem) {
            var ENTER = 13;

            scope.focused = false;
            var input = elem.find('#search-input');

            scope.searchOnEnter = function($event) {
                if ($event.keyCode === ENTER) {
                    scope.search();
                    $event.stopPropagation();
                }
            };

            scope.search = function() {
                var output = '';

                if (scope.query) {
                    var newQuery = _.uniq(scope.query.split(/[\s,]+/));

                    _.each(newQuery, (item, key) => {
                        if (item) {
                            output += key !== 0 ? ' (' + item + ')' : '(' + item + ')';
                        }
                    });

                    scope.query = newQuery.join(' ');
                }
                $location.search('q', output || null);
            };

            scope.cancel = function() {
                scope.query = null;
                scope.search();
                input.focus();
                // to be implemented
            };

            // initial query
            var srch = $location.search();

            if (srch.q && srch.q !== '') {
                scope.query = srch.q.replace(/[()]/g, '');
            } else {
                scope.query = null;
            }

            function closeOnClick() {
                scope.$applyAsync(() => {
                    scope.focused = false;
                });
            }

            $document.bind('click', closeOnClick);

            scope.$on('$destroy', () => {
                $document.unbind('click', closeOnClick);
            });
        }
    };
}
