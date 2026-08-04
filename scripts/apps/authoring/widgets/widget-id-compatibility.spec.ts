import {getCanonicalWidgetId} from './widget-id-compatibility';

describe('getCanonicalWidgetId', () => {
    it('maps a widget id removed from authoring-react to its authoring-angular id', () => {
        expect(getCanonicalWidgetId('comments-widget')).toBe('comments');
        expect(getCanonicalWidgetId('inline-comments-widget')).toBe('inline-comments');
        expect(getCanonicalWidgetId('editor3-suggestions-widget')).toBe('suggestions');
        expect(getCanonicalWidgetId('find-and-replace-widget')).toBe('find-replace');
        expect(getCanonicalWidgetId('macros-widget')).toBe('macros');
        expect(getCanonicalWidgetId('metadata-widget')).toBe('metadata');
        expect(getCanonicalWidgetId('packages-widget')).toBe('packages');
        expect(getCanonicalWidgetId('translation-widget')).toBe('translations');
        expect(getCanonicalWidgetId('versions-and-item-history')).toBe('versioning');
    });

    it('leaves a canonical id untouched', () => {
        expect(getCanonicalWidgetId('comments')).toBe('comments');
        expect(getCanonicalWidgetId('attachments')).toBe('attachments');
        expect(getCanonicalWidgetId('related-item')).toBe('related-item');
    });

    it('leaves an id owned by an extension untouched', () => {
        expect(getCanonicalWidgetId('planning_details')).toBe('planning_details');
        expect(getCanonicalWidgetId('imatrics-auto-tagging-widget')).toBe('imatrics-auto-tagging-widget');
        expect(getCanonicalWidgetId('ai-widget')).toBe('ai-widget');
    });

    it('maps in one direction only, so a canonical id never resolves back to a removed one', () => {
        expect(getCanonicalWidgetId(getCanonicalWidgetId('comments-widget'))).toBe('comments');
        expect(getCanonicalWidgetId('versioning')).toBe('versioning');
        expect(getCanonicalWidgetId('find-replace')).toBe('find-replace');
    });

    it('passes null and undefined through instead of throwing', () => {
        expect(getCanonicalWidgetId(null)).toBe(null);
        expect(getCanonicalWidgetId(undefined)).toBe(undefined);
    });

    it('does not inherit ids from Object.prototype', () => {
        expect(getCanonicalWidgetId('constructor')).toBe('constructor');
        expect(getCanonicalWidgetId('toString')).toBe('toString');
    });
});
