/**
 * Confirmation for navigation that happens outside of the extension's own
 * back / list-switch buttons.
 *
 * Two things can take the user away from an unsaved list:
 *
 * - leaving the page entirely (reload, closing the tab, following a link out
 *   of the app) - covered by `beforeunload`;
 * - an in-app route change (side menu, browser back button) - the host is an
 *   AngularJS SPA with hash based routing, so this never unmounts the browser
 *   page. There is no navigation guard in the extension API, so Angular's
 *   cancellable `$locationChangeStart` is used directly; if the injector
 *   cannot be reached the in-app part of the guard is simply skipped.
 */
export function registerNavigationGuard(
    hasUnsavedChanges: () => boolean,
    confirmDiscardingChanges: () => Promise<boolean>,
): () => void {
    const removeListenerFunctions: Array<() => void> = [];

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
        if (!hasUnsavedChanges()) {
            return undefined;
        }

        // browsers show their own generic message; a non-empty return value
        // is what triggers the prompt
        event.preventDefault();
        event.returnValue = '';

        return '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    removeListenerFunctions.push(() => window.removeEventListener('beforeunload', onBeforeUnload));

    const rootScope = getAngularRootScope();

    if (rootScope != null) {
        // url the user already confirmed leaving for, so the retried
        // navigation isn't intercepted a second time
        let confirmedUrl: string | null = null;
        let confirmationPending = false;

        const removeAngularListener = rootScope.$on('$locationChangeStart', (event: {preventDefault(): void}, nextUrl: string) => {
            if (!hasUnsavedChanges()) {
                return;
            }

            if (nextUrl === confirmedUrl) {
                confirmedUrl = null;

                return;
            }

            event.preventDefault();

            if (confirmationPending) {
                return;
            }

            confirmationPending = true;

            confirmDiscardingChanges().then((confirmed) => {
                confirmationPending = false;

                if (confirmed) {
                    confirmedUrl = nextUrl;

                    // hash based routing, so this is a route change and not a
                    // page load; it re-enters the listener above, which lets
                    // the confirmed url through
                    window.location.href = nextUrl;
                }
            });
        });

        removeListenerFunctions.push(removeAngularListener);
    }

    return () => removeListenerFunctions.forEach((removeListener) => removeListener());
}

function getAngularRootScope(): any {
    try {
        const angular = (window as any).angular;
        const injector = angular?.element(document.body)?.injector();

        return injector?.get('$rootScope') ?? null;
    } catch {
        return null;
    }
}
