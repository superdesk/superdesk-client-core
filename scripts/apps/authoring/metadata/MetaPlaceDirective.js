
import {debounce, omit, get} from 'lodash';

MetaPlaceDirective.$inject = ['api'];
export default function MetaPlaceDirective(api) {
    return {
        scope: {
            item: '=',
            field: '@',
            disabled: '=ngDisabled',
            change: '&',
            tabindex: '=',
            language: '=',
        },
        template: require('./views/meta-place-directive.html'),
        link: (scope) => {
            scope.terms = [];

            scope.searchTerms = debounce((name) => {
                if (!name) {
                    scope.terms = [];
                    return;
                }

                scope.loading = true;
                api.query('places_autocomplete', {name: name, lang: scope.item.language})
                    .then((response) => {
                        scope.loading = false;
                        scope.terms = response._items.map((place) => omit(place, ['_created', '_updated', '_etag']));
                    })
                    .finally(() => {
                        scope.loading = false;
                    });
            }, 1000);

            scope.selectTerm = (term) => {
                if (!get(term, 'code')) { // when search is in progress and user hits enter this gets called
                    return;
                }

                scope.terms = [];

                if (!scope.item[scope.field]) {
                    scope.item[scope.field] = [];
                }


                if (!scope.item[scope.field].find((item) => item.code === term.code)) {
                    scope.$applyAsync(() => {
                        scope.item[scope.field] = scope.item[scope.field].concat([term]);
                        scope.change({item: scope.item, field: scope.field});
                    });
                }
            };

            scope.removeTerm = (term) => {
                scope.$applyAsync(() => {
                    scope.item[scope.field] = scope.item[scope.field].filter((item) => term.code !== item.code);
                    scope.change({item: scope.item, field: scope.field});
                });
            };
        },
    };
}