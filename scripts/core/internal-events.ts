import {IArticle} from 'superdesk-api';
import {IPanelAction} from './interactive-article-actions-panel/interfaces';

interface IInternalEvents {
    addImage: {
        field: string;
        image: IArticle;
    };
    saveArticleInEditMode: void;
    dangerouslyOverwriteAuthoringData: {item: Partial<IArticle>; setDirty?: boolean};
    replaceAuthoringDataWithChanges: Partial<unknown>;

    /**
     * Unsaved changes will be lost.
     * Only applies to authoring-react.
     */
    dangerouslyForceReloadAuthoring: void;

    changeUserPreferences: {[preferenceId: string]: any};
    openExportView: Array<IArticle['_id']>;
    extensionsHaveLoaded: true;

    interactiveArticleActionStart: IPanelAction;
    interactiveArticleActionEnd: void;

    editor3SpellcheckerActionWasExecuted: void;
}

export function addInternalEventListener<T extends keyof IInternalEvents>(
    eventName: T,
    handler: (event: CustomEvent<IInternalEvents[T]>) => void,
) {
    window.addEventListener(eventName, handler);

    return () => {
        window.removeEventListener(eventName, handler);
    };
}

export function dispatchInternalEvent<T extends keyof IInternalEvents>(eventName: T, payload: IInternalEvents[T]) {
    window.dispatchEvent(new CustomEvent(eventName, {detail: payload}));
}
