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

    // an admin hid the widget through the authoring-react row before the ids were unified;
    // ignoring that entry would un-hide it
    it('keeps a widget hidden when it was hidden under a removed authoring-react id', () => {
        const config: IWidgetsConfig = [{widget_id: 'comments-widget', is_displayed: false}];

        expect(isWidgetVisibleForContentProfile(config, 'comments')).toBe(false);
    });

    it('keeps a widget hidden when it was hidden under a removed id that is not a suffix change', () => {
        const config: IWidgetsConfig = [{widget_id: 'versions-and-item-history', is_displayed: false}];

        expect(isWidgetVisibleForContentProfile(config, 'versioning')).toBe(false);
    });

    it('prefers an entry stored under the current id over one under a removed id', () => {
        const config: IWidgetsConfig = [
            {widget_id: 'comments-widget', is_displayed: false},
            {widget_id: 'comments', is_displayed: true},
        ];

        expect(isWidgetVisibleForContentProfile(config, 'comments')).toBe(true);
    });

    it('does not let a removed id match a widget it was never an alias for', () => {
        const config: IWidgetsConfig = [{widget_id: 'comments-widget', is_displayed: false}];

        expect(isWidgetVisibleForContentProfile(config, 'inline-comments')).toBe(true);
        expect(isWidgetVisibleForContentProfile(config, 'planning_details')).toBe(true);
    });

    it('leaves an id owned by an extension untouched', () => {
        const config: IWidgetsConfig = [{widget_id: 'imatrics-auto-tagging-widget', is_displayed: false}];

        expect(isWidgetVisibleForContentProfile(config, 'imatrics-auto-tagging-widget')).toBe(false);
    });
});
