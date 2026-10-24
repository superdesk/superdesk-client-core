const TABBABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getTabbable(container: HTMLElement): Array<HTMLElement> {
    return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE))
        .filter((el) => el.tabIndex >= 0 && el.getClientRects().length > 0);
}

export function wrapTabWithin(container: HTMLElement, event: KeyboardEvent) {
    if (event.key !== 'Tab' || !container.contains(document.activeElement)) {
        return;
    }

    const tabbable = getTabbable(container);

    if (tabbable.length < 1) {
        event.preventDefault();
        return;
    }

    const first = tabbable[0];
    const last = tabbable[tabbable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

/**
 * superdesk-ui-framework's `sd-modal` opens without moving focus into the dialog, lets Tab walk
 * on to the page hidden behind it and leaves focus wherever it was when it closes. This adds
 * dialog semantics, moves focus in on open, wraps Tab and Shift+Tab inside the dialog and puts
 * focus back where it was on close.
 *
 * Focus that is outside the dialog (for example in a popup rendered into a portal) is left
 * alone, so dropdowns opened from inside a dialog keep working.
 */
export function decorateSdModalWithFocusManagement($provide) {
    $provide.decorator('sdModalDirective', ['$delegate', ($delegate) => {
        const directive = $delegate[0];
        const originalLink = directive.link;

        directive.compile = () => function(this: unknown, scope, element, ...rest) {
            originalLink.apply(this, [scope, element, ...rest]);

            // captured before sd-modal moves its markup to <body> on first open
            const modal: HTMLElement | null = element[0].querySelector('.modal');

            if (modal == null) {
                return;
            }

            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('tabindex', '-1');

            let focusBeforeOpening: HTMLElement | null = null;
            let shown = false;
            const onKeyDown = (event: KeyboardEvent) => wrapTabWithin(modal, event);

            modal.addEventListener('keydown', onKeyDown);

            scope.$watch('model', (model) => {
                const isOpen = Boolean(model);

                if (isOpen === shown) {
                    return;
                }

                shown = isOpen;

                if (isOpen) {
                    focusBeforeOpening = document.activeElement instanceof HTMLElement
                        ? document.activeElement
                        : null;

                    // the dialog body is rendered by ng-if and transcluded content may need a tick
                    setTimeout(() => {
                        if (modal.contains(document.activeElement)) {
                            return;
                        }

                        const preferred = modal.querySelector<HTMLElement>('[autofocus], [sd-autofocus]');

                        (preferred ?? getTabbable(modal)[0] ?? modal).focus();
                    }, 100);
                } else {
                    const focusWasInDialog = modal.contains(document.activeElement)
                        || document.activeElement === document.body;

                    if (focusWasInDialog && focusBeforeOpening?.isConnected) {
                        focusBeforeOpening.focus();
                    }

                    focusBeforeOpening = null;
                }
            });

            scope.$on('$destroy', () => {
                modal.removeEventListener('keydown', onKeyDown);
            });
        };

        return $delegate;
    }]);
}
