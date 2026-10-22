import {IArticle} from 'superdesk-api';
import {IPanelAction} from './interactive-article-actions-panel/interfaces';

interface IInternalEvents {
    addImage: {
        field: string;
        image: IArticle;
    };
    saveArticleInEditMode: void;
    dangerouslyOverwriteAuthoringData: {item: Partial<IArticle>;};
    dangerouslyOverwriteAuthoringField: {
        itemId: IArticle['_id'];
        field: {key: string, value: valueof<IArticle>};
    };
    replaceAuthoringDataWithChanges: Partial<unknown>;

    // "Add to current package" and story labels, for a package open in authoring-react
    addItemsToPackageInAuthoringReact: {
        packageId: IArticle['_id'];
        groupId: string;
        items: Array<IArticle>;
    };
    setPackageItemLabelInAuthoringReact: {
        packageId: IArticle['_id'];
        itemId: IArticle['_id'];
        label: string | null;
    };

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
