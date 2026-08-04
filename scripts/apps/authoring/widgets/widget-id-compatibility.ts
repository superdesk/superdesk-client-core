/**
 * TEMPORARY, DELETE AFTER ONE RELEASE.
 *
 * SDESK-7816 renamed the authoring-react widget ids onto the authoring-angular ones. Two stores can
 * still hold an old id, and this maps it back on read. Nothing is written back.
 *
 *  1. `editor:pinned_widget`, read in `AuthoringIntegrationWrapper.loadWidgetFromPreferences`.
 *  2. a content profile's `widgets_config`, read in `isWidgetVisibleForContentProfile`.
 *
 * Removing it means deleting this file and unwrapping those two calls. Removing it early is not
 * equally harmless: a stale pin is just ignored and the user re-pins, but a stale `widgets_config`
 * entry falls back to the default and silently un-hides a widget an admin hid.
 *
 * Do NOT add entries for new widgets. A widget has one id, and extensions own theirs.
 */
const REMOVED_AUTHORING_REACT_WIDGET_IDS = new Map<string, string>([
    ['comments-widget', 'comments'],
    ['inline-comments-widget', 'inline-comments'],
    ['editor3-suggestions-widget', 'suggestions'],
    ['find-and-replace-widget', 'find-replace'],
    ['macros-widget', 'macros'],
    ['metadata-widget', 'metadata'],
    ['packages-widget', 'packages'],
    ['translation-widget', 'translations'],
    ['versions-and-item-history', 'versioning'],
]);

export function getCanonicalWidgetId<T extends string | null | undefined>(widgetId: T): T {
    if (widgetId == null) {
        return widgetId;
    }

    return (REMOVED_AUTHORING_REACT_WIDGET_IDS.get(widgetId) ?? widgetId) as T;
}
