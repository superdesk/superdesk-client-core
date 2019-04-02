
import {get} from 'lodash';
import {IPlacesService} from './PlacesService';

function getCode(item) {
    return get(item, 'code', get(item, 'qcode'));
}

MetaPlaceDirective.$inject = ['places'];
export default function MetaPlaceDirective(places: IPlacesService) {
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

            scope.searchTerms = (name) => {
                if (!name) {
                    scope.terms = [];
                    return;
                }

                scope.loading = true;
                places.searchGeonames(name, scope.item.language)
                    .then((results) => {
                        scope.loading = false;
                        scope.terms = results;
                    })
                    .finally(() => {
                        scope.loading = false;
                    });
            };

            scope.selectTerm = (term) => {
                if (!getCode(term)) { // when search is in progress and user hits enter this gets called
                    return;
                }

                scope.terms = [];

                if (!scope.item[scope.field]) {
                    scope.item[scope.field] = [];
                }

                if (!scope.item[scope.field].find((item) => getCode(item) === getCode(term))) {
                    scope.$applyAsync(() => {
                        scope.item[scope.field] = scope.item[scope.field].concat([term]);
                        scope.change({item: scope.item, field: scope.field});
                    });
                }
            };

            scope.removeTerm = (term) => {
                scope.$applyAsync(() => {
                    scope.item[scope.field] = scope.item[scope.field].filter((item) => getCode(term) !== getCode(item));
                    scope.change({item: scope.item, field: scope.field});
                });
            };
        },
    };
}
