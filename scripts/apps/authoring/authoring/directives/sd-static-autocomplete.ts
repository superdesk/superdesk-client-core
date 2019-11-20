import {debounce} from 'lodash';
import {KEYS} from 'core/keyboard/keyboard';

interface IScope extends ng.IScope {
    value: string;
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
        value: '=',
        debounce: '=',
        available: '=',
        onSelect: '&',
    },
    link: (scope: IScope, elem) => {
        scope.suggestions = [];

        const updateSuggestions = (newVal: string, oldVal: string) => {
            if (newVal === oldVal) {
                return; // avoid render on init
            }

            if (newVal === scope.suggested) {
                scope.suggested = null;
                return; // don't suggest after selecting suggestion
            }

            if (scope.available?.length) {
                const search = newVal ? newVal.toLocaleLowerCase() : '';

                scope.suggestions = scope.available.filter(
                    (suggestion) => suggestion.toLocaleLowerCase().includes(search),
                );
                scope.activeSuggestion = null;
            }
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

        elem.on('focusout', () => {
            scope.$applyAsync(resetSuggestions);
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
