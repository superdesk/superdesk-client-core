import {registerNavigationGuard} from './navigation-guard';

type ILocationChangeListener = (event: {preventDefault(): void}, nextUrl: string) => void;

interface IFakeRootScope {
    listeners: Array<ILocationChangeListener>;
    $on(eventName: string, listener: ILocationChangeListener): () => void;
}

function stubAngular(): IFakeRootScope {
    const rootScope: IFakeRootScope = {
        listeners: [],
        $on: (eventName, listener) => {
            if (eventName !== '$locationChangeStart') {
                return () => undefined;
            }

            rootScope.listeners.push(listener);

            return () => {
                rootScope.listeners = rootScope.listeners.filter((item) => item !== listener);
            };
        },
    };

    (window as any).angular = {
        element: () => ({injector: () => ({get: () => rootScope})}),
    };

    return rootScope;
}

// the handler is invoked directly instead of dispatching a real event -
// karma reports a synthetic `beforeunload` as an unexpected page reload
const beforeUnloadListeners: Array<(event: any) => any> = [];

function dispatchBeforeUnload(): boolean {
    let prevented = false;

    beforeUnloadListeners.forEach((listener) => {
        listener({preventDefault: () => {
            prevented = true;
        }, returnValue: undefined});
    });

    return prevented;
}

function dispatchLocationChange(rootScope: IFakeRootScope, nextUrl: string): boolean {
    let prevented = false;

    rootScope.listeners.forEach((listener) => {
        listener({preventDefault: () => {
            prevented = true;
        }}, nextUrl);
    });

    return prevented;
}

describe('navigation guard', () => {
    let angularBackup: any;
    let removeGuard: (() => void) | null;

    beforeEach(() => {
        angularBackup = (window as any).angular;
        removeGuard = null;
        beforeUnloadListeners.length = 0;

        spyOn(window, 'addEventListener').and.callFake((eventName: string, listener: any) => {
            if (eventName === 'beforeunload') {
                beforeUnloadListeners.push(listener);
            }
        });
        spyOn(window, 'removeEventListener').and.callFake((eventName: string, listener: any) => {
            if (eventName === 'beforeunload') {
                const index = beforeUnloadListeners.indexOf(listener);

                if (index >= 0) {
                    beforeUnloadListeners.splice(index, 1);
                }
            }
        });
    });

    afterEach(() => {
        removeGuard?.();
        (window as any).angular = angularBackup;
    });

    it('prompts on unload only while there are unsaved changes', () => {
        let unsaved = false;

        removeGuard = registerNavigationGuard(() => unsaved, () => Promise.resolve(true));

        expect(dispatchBeforeUnload()).toBe(false);

        unsaved = true;

        expect(dispatchBeforeUnload()).toBe(true);
    });

    it('stops listening once the guard is removed', () => {
        const rootScope = stubAngular();

        removeGuard = registerNavigationGuard(() => true, () => Promise.resolve(true));
        removeGuard();
        removeGuard = null;

        expect(dispatchBeforeUnload()).toBe(false);
        expect(rootScope.listeners.length).toBe(0);
    });

    it('lets in-app navigation through when there are no unsaved changes', () => {
        const rootScope = stubAngular();

        removeGuard = registerNavigationGuard(() => false, () => Promise.resolve(true));

        expect(dispatchLocationChange(rootScope, '/#/workspace')).toBe(false);
    });

    it('cancels in-app navigation and asks for confirmation', async () => {
        const rootScope = stubAngular();
        const confirm = jasmine.createSpy('confirm').and.returnValue(Promise.resolve(false));

        removeGuard = registerNavigationGuard(() => true, confirm);

        expect(dispatchLocationChange(rootScope, '/#/workspace')).toBe(true);
        expect(confirm).toHaveBeenCalled();

        await Promise.resolve();

        // a second attempt while the first prompt is open doesn't stack modals
        expect(dispatchLocationChange(rootScope, '/#/workspace')).toBe(true);
        expect(confirm.calls.count()).toBe(2);
    });

    it('does nothing beyond the unload prompt when angular is unreachable', () => {
        (window as any).angular = undefined;

        removeGuard = registerNavigationGuard(() => true, () => Promise.resolve(true));

        expect(dispatchBeforeUnload()).toBe(true);
    });
});
