/**
 * Exposes the relations that the `sd-line-input` and `sd-input` form field markup only shows visually:
 * the label names the control, the `--required` and `--invalid` modifiers become
 * `aria-required` and `aria-invalid`, and the `__message` and `__hint` texts describe the control.
 *
 * Fields with more than one control, or whose label already uses `for`, are left alone.
 * Controls added later by `ng-if` are picked up on the next class change of the field.
 *
 * Registered as class directives, so the names match the CSS blocks. The ui-framework also has an
 * `sdLineInput` element/attribute directive; the two do not interfere because the restrictions differ.
 */

const CONTROL_SELECTOR = 'input:not([type="hidden"]), select, textarea';

let lastId = 0;

function ensureId(el: Element, prefix: string): string {
    if (!el.id) {
        lastId += 1;
        el.id = `${prefix}-${lastId}`;
    }

    return el.id;
}

const STATE_MARKER = 'data-sd-field-state';

/**
 * Only removes attributes set here, so values written in the templates are kept.
 */
function toggleState(control: HTMLElement, attribute: string, on: boolean) {
    const marked = new Set((control.getAttribute(STATE_MARKER) ?? '').split(' ').filter(Boolean));

    if (on && !control.hasAttribute(attribute)) {
        control.setAttribute(attribute, 'true');
        marked.add(attribute);
    } else if (!on && marked.has(attribute)) {
        control.removeAttribute(attribute);
        marked.delete(attribute);
    }

    if (marked.size > 0) {
        control.setAttribute(STATE_MARKER, Array.from(marked).join(' '));
    } else {
        control.removeAttribute(STATE_MARKER);
    }
}

export function formFieldRelations(blockClass: string) {
    return () => ({
        restrict: 'C',
        link: (scope, element) => {
            const field: HTMLElement = element[0];

            // Elements of nested fields belong to those fields.
            const own = (selector: string): Array<HTMLElement> =>
                Array.from(field.querySelectorAll<HTMLElement>(selector))
                    .filter((el) => el.closest(`.${blockClass}`) === field);

            const update = () => {
                const controls = own(CONTROL_SELECTOR);

                if (controls.length !== 1) {
                    return;
                }

                const control = controls[0];
                const label = own(`.${blockClass}__label`)[0];

                if (
                    label != null
                    && label.tagName === 'LABEL'
                    && !label.hasAttribute('for')
                    && !control.hasAttribute('aria-label')
                    && !control.hasAttribute('aria-labelledby')
                ) {
                    label.setAttribute('for', ensureId(control, 'sd-field'));
                }

                toggleState(control, 'aria-required', field.classList.contains(`${blockClass}--required`)
                    && !control.hasAttribute('required'));
                toggleState(control, 'aria-invalid', field.classList.contains(`${blockClass}--invalid`));

                const describedBy = new Set(
                    (control.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean),
                );

                own(`.${blockClass}__message, .${blockClass}__hint`).forEach((message) => {
                    describedBy.add(ensureId(message, 'sd-field-message'));
                });

                if (describedBy.size > 0) {
                    control.setAttribute('aria-describedby', Array.from(describedBy).join(' '));
                }
            };

            scope.$watch(() => field.className, () => {
                scope.$applyAsync(update);
            });
        },
    });
}
