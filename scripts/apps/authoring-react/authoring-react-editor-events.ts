import {EditorState} from 'draft-js';
import {IArticle} from 'superdesk-api';

interface IAuthoringReactEditorEvents {
    find_and_replace__find: {
        editorId: string;
        text: string;
        caseSensitive: boolean;
    };

    find_and_replace__request_for_current_selection_index: null;

    find_and_replace__receive_current_selection_index: {
        selectionIndex: number;
        editorId: string;
    };

    find_and_replace__find_distinct: {
        editorId: string;

        // strings that we want to highlight in the editor
        matches: Array<string>;
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

    find_and_replace__multi_replace: {
        editorId: string;
        replaceWith: {[key: string]: string};
    };

    macros__patch_html: {
        editorId: string;
        editorState: EditorState;
        html: string;
    };

    macros__update_state: {
        editorId: string;
        article: IArticle;
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
