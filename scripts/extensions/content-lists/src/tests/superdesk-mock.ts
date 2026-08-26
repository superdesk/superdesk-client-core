/**
 * Installs a mock of the extension API instance
 * (`window['extensionsApiInstances']['content-lists']`) that production code
 * reads in `src/superdesk.ts`.
 *
 * Modules destructure API methods at import time (e.g. `api.ts` captures
 * `httpRequestJsonLocal` when first imported), so the installed instance must
 * never be replaced. Instead, every method delegates to `superdeskMock`, whose
 * properties tests can override with `spyOn(superdeskMock, ...)` — jasmine
 * restores those automatically after each spec.
 */

interface IHttpRequestOptions {
    method: string;
    path: string;
    payload?: unknown;
    headers?: {[key: string]: string};
    urlParams?: {[key: string]: unknown};
}

type IWebsocketHandler = (event: CustomEvent) => void;

const websocketListeners = new Map<string, Set<IWebsocketHandler>>();
const urlParamsStore = new Map<string, string>();

export const superdeskMock = {
    httpRequestJsonLocal: (options: IHttpRequestOptions): Promise<unknown> => {
        return Promise.reject(new Error(`unexpected http request: ${options.method} ${options.path}`));
    },
    httpRequestVoidLocal: (options: IHttpRequestOptions): Promise<void> => {
        return Promise.reject(new Error(`unexpected http request: ${options.method} ${options.path}`));
    },
    confirm: (_message: string): Promise<boolean> => Promise.resolve(true),
    notifySuccess: (_message: string): void => undefined,
    notifyError: (_message: string): void => undefined,
    hasPrivilege: (_privilege: string): boolean => true,
};

/**
 * Simulates a websocket message pushed by the server.
 */
export function dispatchWebsocketEvent(eventName: string, extra?: {}): void {
    const event = new CustomEvent(eventName, {detail: {event: eventName, extra}});

    Array.from(websocketListeners.get(eventName) ?? []).forEach((handler) => {
        handler(event);
    });
}

export function getWebsocketListenersCount(eventName: string): number {
    return websocketListeners.get(eventName)?.size ?? 0;
}

export function getUrlParam(field: string): string | undefined {
    return urlParamsStore.get(field);
}

export function setUrlParam(field: string, value?: string): void {
    if (value == null) {
        urlParamsStore.delete(field);
    } else {
        urlParamsStore.set(field, value);
    }
}

/**
 * Registered as a global `beforeEach` in `tests.ts`.
 */
export function resetSuperdeskMock(): void {
    websocketListeners.clear();
    urlParamsStore.clear();
}

function gettextMock(text: string, params?: {[key: string]: string | number}): string {
    if (params == null) {
        return text;
    }

    return Object.keys(params).reduce(
        (result, param) => result.split(`{{${param}}}`).join(String(params[param])),
        text,
    );
}

function gettextPluralMock(
    count: number,
    singular: string,
    plural: string,
    params?: {[key: string]: string | number},
): string {
    return gettextMock(count === 1 ? singular : plural, params);
}

const instance = {
    httpRequestJsonLocal: (options: IHttpRequestOptions) => superdeskMock.httpRequestJsonLocal(options),
    httpRequestVoidLocal: (options: IHttpRequestOptions) => superdeskMock.httpRequestVoidLocal(options),
    localization: {
        gettext: gettextMock,
        gettextPlural: gettextPluralMock,
        getRelativeOrAbsoluteDateTime: (dateString: string, format: string) => `${dateString}|${format}`,
    },
    ui: {
        confirm: (message: string) => superdeskMock.confirm(message),
        notify: {
            success: (message: string) => superdeskMock.notifySuccess(message),
            error: (message: string) => superdeskMock.notifyError(message),
        },
    },
    utilities: {
        CSS: {
            getClass: (name: string) => name,
        },
    },
    browser: {
        location: {
            urlParams: {
                getString: (field: string) => urlParamsStore.get(field),
                setString: (field: string, value?: string) => {
                    setUrlParam(field, value);
                },
            },
        },
    },
    privileges: {
        hasPrivilege: (privilege: string) => superdeskMock.hasPrivilege(privilege),
    },
    addWebsocketMessageListener: (eventName: string, handler: IWebsocketHandler): (() => void) => {
        if (!websocketListeners.has(eventName)) {
            websocketListeners.set(eventName, new Set());
        }

        const handlers = websocketListeners.get(eventName) as Set<IWebsocketHandler>;

        handlers.add(handler);

        return () => {
            handlers.delete(handler);
        };
    },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _window = window as any;

_window['extensionsApiInstances'] = {
    ..._window['extensionsApiInstances'],
    'content-lists': instance,
};
