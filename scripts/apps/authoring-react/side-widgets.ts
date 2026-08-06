import {IArticle, IArticleSideWidget, IOpenSideWidget} from 'superdesk-api';
import {extensions} from 'appConfig';

export function getWidgetsFromExtensions(article: IArticle): Array<IArticleSideWidget> {
    return Object.values(extensions)
        .flatMap((extension) => extension.activationResult?.contributions?.authoringSideWidgets ?? [])
        .filter((widget) => widget.isAllowed?.(article) ?? true)
        .sort((a, b) => a.order - b.order);
}

/**
 * Ids arrive from storage shared with authoring-angular and from extensions, so one may reference a
 * widget that is not registered or not allowed for this article. Callers must handle `null`:
 * rendering an unresolved widget takes the whole authoring view down.
 */
export function findWidgetById(
    article: IArticle,
    widgetId: string | null | undefined,
): IArticleSideWidget | null {
    if (widgetId == null) {
        return null;
    }

    return getWidgetsFromExtensions(article).find((widget) => widget._id === widgetId) ?? null;
}

export const SIDE_WIDGET_STORAGE_KEY = 'SIDE_WIDGET';

export function readStoredSideWidget(): IOpenSideWidget | null {
    try {
        return JSON.parse(localStorage.getItem(SIDE_WIDGET_STORAGE_KEY) ?? 'null');
    } catch {
        return null;
    }
}

/**
 * The stored value belongs to the one widget `openArticle` was asked to open, but authoring
 * re-renders several times before the key is cleared, so a render of a different widget reaches it
 * too. That widget must not be handed another widget's state, so the stored id is resolved the same
 * tolerant way the rendered widget was and the two are compared. Returns `null` when the stored
 * value does not belong to `renderedWidget`; the returned wrapper is what distinguishes
 * "applies, with no state" from "does not apply".
 */
export function getStoredStateForWidget(
    article: IArticle,
    renderedWidget: IArticleSideWidget,
    storedSideWidget: IOpenSideWidget | null,
): {initialState: any} | null {
    const storedWidget = findWidgetById(article, storedSideWidget?.id);

    if (storedWidget == null || storedWidget._id !== renderedWidget._id) {
        return null;
    }

    return {initialState: storedSideWidget.initialState};
}
