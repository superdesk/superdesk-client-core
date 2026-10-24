/**
 * Icon font glyphs are private-use characters: screen readers either skip them or read them as
 * unknown symbols, and they leak into the accessible names of the controls around them.
 *
 * - An `<i class="icon-...">` without its own label or tooltip is decorative and gets hidden.
 * - An icon with `sd-tooltip` (a CSS-only tooltip) is informative and becomes an image named by the tooltip.
 * - A button or link whose only content is icons gets its `sd-tooltip` as its name.
 *
 * Icons that are interactive themselves (`ng-click`, `tabindex`, a role) are left alone.
 */

const ICON_CLASS = /(^|\s)(icon-|svg-icon-)/;

function hasText(el: HTMLElement): boolean {
    return (el.textContent ?? '').trim().length > 0;
}

function isIcon(el: HTMLElement, attrs): boolean {
    return el.tagName === 'I' && ICON_CLASS.test(attrs.class ?? el.className ?? '');
}

function isInteractive(el: HTMLElement): boolean {
    return ['ng-click', 'tabindex', 'role', 'href'].some((attribute) => el.hasAttribute(attribute));
}

function isNamed(el: HTMLElement): boolean {
    return el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby');
}

export function decorativeIcon() {
    return {
        restrict: 'E',
        link: (_scope, element, attrs) => {
            const el: HTMLElement = element[0];

            if (
                isIcon(el, attrs)
                && !isInteractive(el)
                && !isNamed(el)
                && !el.hasAttribute('title')
                && !el.hasAttribute('sd-tooltip')
                && !el.hasAttribute('aria-hidden')
                && !hasText(el)
            ) {
                el.setAttribute('aria-hidden', 'true');
            }
        },
    };
}

export function tooltipName() {
    return {
        restrict: 'A',
        link: (scope, element, attrs) => {
            const el: HTMLElement = element[0];

            if (isNamed(el) || el.hasAttribute('aria-hidden')) {
                return;
            }

            const icon = isIcon(el, attrs) && !isInteractive(el);
            const control = el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button';

            if (!icon && !control) {
                return;
            }

            let tooltip = '';

            // Runs after the digest so that text rendered by `ng-if` or bindings is already there.
            const update = () => {
                if (tooltip && !hasText(el)) {
                    if (icon) {
                        el.setAttribute('role', 'img');
                    }
                    el.setAttribute('aria-label', tooltip);
                } else {
                    el.removeAttribute('aria-label');
                }
            };

            attrs.$observe('sdTooltip', (value?: string) => {
                tooltip = (value ?? '').trim();
                scope.$applyAsync(update);
            });
        },
    };
}
