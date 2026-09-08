import {IArticle, IArticleSideWidget, IOpenSideWidget, IUser} from 'superdesk-api';
import {extensions} from 'appConfig';
import {sdApi} from 'api';
import ng from 'core/services/ng';

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

export interface ISideWidgetLockState {
    /**
     * The item is open for reading only: opened with a view action, or its lock is held elsewhere.
     */
    readOnly: boolean;

    /**
     * Someone else holds the lock and the user can not take it over.
     */
    lockedByAnotherUser: boolean;

    readOnlyStage: boolean;
}

// a locked widget can not be opened at all, as in authoring-angular
export function isSideWidgetLocked(
    widget: Pick<IArticleSideWidget, 'needEditable' | 'needUnlock'>,
    {readOnly, lockedByAnotherUser, readOnlyStage}: ISideWidgetLockState,
): boolean {
    if (widget.needUnlock === true && (lockedByAnotherUser || readOnlyStage)) {
        return true;
    }

    return widget.needEditable === true && (readOnly || readOnlyStage);
}

/**
 * `lock_user` holds either the id or the embedded user, depending on which endpoint served the
 * item. Angular's lock service reads both; `sdApi.article.isLockedByCurrentUser` compares strings
 * only and would report a lock held by the current user as somebody else's.
 */
function getLockedUserId(article: IArticle): IUser['_id'] | null {
    const lockUser: IUser['_id'] | IUser | null = article.lock_user as IUser['_id'] | IUser | null;

    if (lockUser == null) {
        return null;
    }

    return typeof lockUser === 'string' ? lockUser : lockUser._id;
}

export function getSideWidgetLockState(article: IArticle, readOnly: boolean): ISideWidgetLockState {
    const lockedByCurrentUser = getLockedUserId(article) === sdApi.user.getCurrentUserId();
    const canUnlock = lockedByCurrentUser
        || (article.state !== 'draft' && sdApi.user.hasPrivilege('unlock'));

    return {
        readOnly: readOnly,
        lockedByAnotherUser: sdApi.article.isLockedInOtherSession(article) && !canUnlock,
        readOnlyStage: article.task?.stage != null && ng.get('desks').isReadOnlyStage(article.task.stage) === true,
    };
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
