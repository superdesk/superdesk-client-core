import {IArticle} from 'superdesk-api';

interface IInternalEvents {
    addImage: {
        field: string;
        image: IArticle;
    };
    saveArticleInEditMode: void;
    dangerouslyOverwriteAuthoringData: Partial<IArticle>;
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
