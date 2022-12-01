interface IAuthoringReactEditorEvents {
    find_and_replace__find: {
        editorId: string;
        text: string;
        caseSensitive: boolean;
    };

    find_and_replace__find_prev: {
        editorId: string;
    };
    find_and_replace__find_next: {
        editorId: string;
    };

    find_and_replace__replace: {
        editorId: string;
        replaceWith: string;
        replaceAllMatches: boolean;
    };

    spellchecker__request_status: null;
    spellchecker__set_status: boolean;
}

export function addEditorEventListener<T extends keyof IAuthoringReactEditorEvents>(
    eventName: T,
    handler: (event: CustomEvent<IAuthoringReactEditorEvents[T]>) => void,
) {
    window.addEventListener(eventName, handler);

    return () => {
        window.removeEventListener(eventName, handler);
    };
}

export function dispatchEditorEvent<T extends keyof IAuthoringReactEditorEvents>(
    eventName: T,
    payload: IAuthoringReactEditorEvents[T],
) {
    window.dispatchEvent(new CustomEvent(eventName, {detail: payload}));
}
