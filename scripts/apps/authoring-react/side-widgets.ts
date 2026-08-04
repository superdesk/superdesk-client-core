import {IArticle, IArticleSideWidget} from 'superdesk-api';
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
export function findWidgetById(article: IArticle, widgetId: string | null): IArticleSideWidget | null {
    if (widgetId == null) {
        return null;
    }

    return getWidgetsFromExtensions(article).find((widget) => widget._id === widgetId) ?? null;
}
