/**
 * The ui-framework `sd-switch` and `sd-check` directives render plain spans that only show their
 * state with CSS classes. These companion directives (same names, linked on the same element)
 * expose the role, state and keyboard focus, without changing the framework code.
 */

let lastId = 0;

function setDisabled(el: HTMLElement, disabled: boolean) {
    if (disabled) {
        el.setAttribute('aria-disabled', 'true');
        el.setAttribute('tabindex', '-1');
    } else {
        el.removeAttribute('aria-disabled');
        el.setAttribute('tabindex', '0');
    }
}

/**
 * Templates place the visible label right after the switch, as a sibling `<label>` without `for`.
 */
function labelFromNextSibling(el: HTMLElement) {
    if (el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')) {
        return;
    }

    const label = el.nextElementSibling;

    if (label?.tagName === 'LABEL' && !label.hasAttribute('for')) {
        if (!label.id) {
            lastId += 1;
            label.id = `sd-toggle-label-${lastId}`;
        }

        el.setAttribute('aria-labelledby', label.id);
    }
}

export function switchSemantics() {
    return {
        restrict: 'EA',
        link: (scope, element) => {
            const el: HTMLElement = element[0];

            el.setAttribute('role', 'switch');

            scope.$applyAsync(() => labelFromNextSibling(el));

            scope.$watch(() => el.className, () => {
                el.setAttribute('aria-checked', el.classList.contains('checked') ? 'true' : 'false');
                setDisabled(el, el.classList.contains('disabled'));
            });
        },
    };
}

/**
 * `sd-switch-inverted` (core directive, used for the ingest source Active/Closed toggle) renders the
 * same `.sd-toggle` span as the framework switch but only listens for clicks, so it also needs the
 * keyboard handling here. The `checked` class already reflects the visible (inverted) state.
 */
export function invertedSwitchSemantics() {
    return {
        restrict: 'EA',
        link: (scope, element) => {
            const el: HTMLElement = element[0];

            el.setAttribute('role', 'switch');
            el.setAttribute('tabindex', '0');

            scope.$applyAsync(() => labelFromNextSibling(el));

            const onKeyDown = (event: KeyboardEvent) => {
                if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault();
                    el.click();
                }
            };

            el.addEventListener('keydown', onKeyDown);

            scope.$watch(() => el.className, () => {
                el.setAttribute('aria-checked', el.classList.contains('checked') ? 'true' : 'false');
            });

            scope.$on('$destroy', () => {
                el.removeEventListener('keydown', onKeyDown);
            });
        },
    };
}

export function checkSemantics() {
    return {
        restrict: 'EA',
        link: (scope, element, attrs) => {
            const el: HTMLElement = element[0];

            el.setAttribute('role', attrs.type === 'radio' ? 'radio' : 'checkbox');

            // The framework only listens for clicks.
            const onKeyDown = (event: KeyboardEvent) => {
                if (event.key === ' ') {
                    event.preventDefault();
                    el.click();
                }
            };

            el.addEventListener('keydown', onKeyDown);

            scope.$watch(() => {
                const box = el.querySelector('.sd-checkbox');

                return [box?.classList.contains('checked'), !!attrs.disabled].join();
            }, () => {
                const box = el.querySelector('.sd-checkbox');

                el.setAttribute('aria-checked', box?.classList.contains('checked') ? 'true' : 'false');
                setDisabled(el, !!attrs.disabled);
            });

            scope.$on('$destroy', () => {
                el.removeEventListener('keydown', onKeyDown);
            });
        },
    };
}
