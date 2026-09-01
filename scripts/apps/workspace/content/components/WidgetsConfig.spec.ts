import {IContentProfile} from 'superdesk-api';
import {isWidgetVisibleForContentProfile} from './WidgetsConfig';

type IWidgetsConfig = IContentProfile['widgets_config'];

describe('isWidgetVisibleForContentProfile', () => {
    it('defaults to visible when the profile has no widgets config', () => {
        expect(isWidgetVisibleForContentProfile(null, 'comments')).toBe(true);
        expect(isWidgetVisibleForContentProfile([], 'comments')).toBe(true);
    });

    it('defaults to visible when no entry matches the widget', () => {
        const config: IWidgetsConfig = [{widget_id: 'macros', is_displayed: false}];

        expect(isWidgetVisibleForContentProfile(config, 'comments')).toBe(true);
    });

    it('respects an entry stored under the widget id', () => {
        expect(isWidgetVisibleForContentProfile([{widget_id: 'comments', is_displayed: false}], 'comments'))
            .toBe(false);
        expect(isWidgetVisibleForContentProfile([{widget_id: 'comments', is_displayed: true}], 'comments'))
            .toBe(true);
    });

    it('leaves an id owned by an extension untouched', () => {
        const config: IWidgetsConfig = [{widget_id: 'imatrics-auto-tagging-widget', is_displayed: false}];

        expect(isWidgetVisibleForContentProfile(config, 'imatrics-auto-tagging-widget')).toBe(false);
    });
});
