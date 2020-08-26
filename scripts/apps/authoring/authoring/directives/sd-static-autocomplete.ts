import {debounce, noop} from 'lodash';
import {appConfig} from 'appConfig';
import {KEYS} from 'core/keyboard/keyboard';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {IRestApiResponse} from 'superdesk-api';

interface IScope extends ng.IScope {
    value: string;
    field: string;
    language: string;
    available: Array<string>;
    suggestions: Array<string>;
    activeSuggestion?: number;
    select: (suggestion: string) => void;
    onSelect: ({suggestion}: {suggestion: string}) => void;
    suggested?: string;
}

export const sdStaticAutocompleteDirective = () => ({
    transclude: true,
    template: require('../views/sd-static-autocomplete.html'),
    scope: {
        field: '@',
        value: '=',
        language: '=',
        debounce: '=',
        onSelect: '&',
    },
    link: (scope: IScope, elem) => {
        scope.available = [];
        scope.suggestions = [];

        let loaded = null;

        const fetchSuggestions = () => {
            if (appConfig.archive_autocomplete) {
                return httpRequestJsonLocal<IRestApiResponse<{value: string}>>({
                    method: 'GET',
                    path: '/archive_autocomplete',
                    urlParams: {field: scope.field, language: scope.language},
                }).then((response) => {
                    scope.available = response._items.map((_item) => _item.value);
                    scope.suggestions = [];
                });
            } else {
                scope.available = [];
                scope.suggestions = [];

                return Promise.resolve();
            }
        };

        const filterSuggestions = () => {
            const search = scope.value ? scope.value.toLocaleLowerCase() : '';

            scope.activeSuggestion = null;
            scope.suggestions = scope.available.filter(
                (suggestion) => suggestion.toLocaleLowerCase().includes(search),
            );

            scope.$applyAsync();
        };

        const updateSuggestions = (newVal: string, oldVal: string) => {
            if (newVal === oldVal) {
                return; // avoid render on init
            }

            if (scope.suggested != null && newVal === scope.suggested) {
                scope.suggested = null;
                return; // don't suggest after selecting suggestion
            }

            if (loaded == null) {
                loaded = fetchSuggestions();
            }

            loaded.then(filterSuggestions);
        };

        scope.$watch('value', updateSuggestions);

        const selectPrev = () => {
            if (scope.suggestions.length) {
                scope.$applyAsync(() => {
                    const prev = scope.activeSuggestion != null ? scope.activeSuggestion - 1 : -1;

                    scope.activeSuggestion = prev !== -1 ? prev : scope.suggestions.length - 1;
                    scrollToActive();
                });
            }
        };

        const selectNext = () => {
            if (scope.suggestions.length) {
                scope.$applyAsync(() => {
                    const next = scope.activeSuggestion != null ? scope.activeSuggestion + 1 : 0;

                    scope.activeSuggestion = next < scope.suggestions.length ? next : 0;
                    scrollToActive();
                });
            }
        };

        const scrollToActive = debounce(() => {
            if (scope.activeSuggestion != null) {
                const active = elem.find('li').get(scope.activeSuggestion);

                active.scrollIntoView({block: 'nearest'});
            }
        }, 100);

        const resetSuggestions = () => {
            scope.suggestions = [];
            scope.activeSuggestion = null;
        };

        scope.select = (suggestion) => {
            resetSuggestions();
            scope.suggested = suggestion;
            scope.onSelect({suggestion});
        };

        const renderSuggestions = () => {
            if (scope.suggestions.length === 0) {
                updateSuggestions(scope.value, null);
            }
        };

        elem.on('click', renderSuggestions);

        elem.on('focusout', () => {
            if (scope.suggestions.length) {
                // it is triggered also when clicking a suggestion,
                // but if it runs first it destroys the list so the
                // select is not fired. thus call it later.
                setTimeout(() => {
                    if (scope.suggestions.length) {
                        scope.$applyAsync(resetSuggestions);
                    }
                }, 200);
            }
        });

        elem.on('keydown', (event: KeyboardEvent) => {
            switch (event.keyCode) {
            case KEYS.up:
                selectPrev();
                break;

            case KEYS.down:
                selectNext();
                break;
            }
        });

        elem.on('keyup', (event: KeyboardEvent) => {
            switch (event.keyCode) {
            case KEYS.enter:
                if (scope.activeSuggestion != null) {
                    scope.$applyAsync(() => {
                        scope.select(scope.suggestions[scope.activeSuggestion]);
                    });
                } else {
                    renderSuggestions();
                }
                break;

            case KEYS.escape:
                scope.$applyAsync(resetSuggestions);
                break;
            }
        });

        scope.$on('$destroy', () => {
            elem.off();
        });
    },
});
