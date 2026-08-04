import {IArticle, IArticleSideWidget} from 'superdesk-api';
import {extensions} from 'appConfig';
import {getCanonicalWidgetId} from 'apps/authoring/widgets/widget-id-compatibility';
import {findWidgetById, getWidgetsFromExtensions} from './side-widgets';

const article = {_id: 'article1', _type: 'archive'} as IArticle;

function widget(_id: string, overrides: Partial<IArticleSideWidget> = {}): IArticleSideWidget {
    return {
        _id,
        label: _id,
        order: 1,
        icon: 'chat',
        component: (() => null) as any,
        ...overrides,
    };
}

function registerWidgets(widgets: Array<IArticleSideWidget>) {
    extensions['test-extension'] = {
        extension: {activate: () => Promise.resolve({})},
        activationResult: {contributions: {authoringSideWidgets: widgets}},
        configuration: {},
    } as any;
}

describe('authoring-react side widget resolution', () => {
    afterEach(() => {
        delete extensions['test-extension'];
    });

    it('resolves a widget registered under the given id', () => {
        registerWidgets([widget('comments'), widget('metadata')]);

        expect(findWidgetById(article, 'metadata')._id).toBe('metadata');
    });

    it('returns null for an id no registered widget matches', () => {
        registerWidgets([widget('comments')]);

        // an authoring-angular only widget, and an id left over from an earlier authoring-react
        expect(findWidgetById(article, 'related-item')).toBe(null);
        expect(findWidgetById(article, 'comments-widget')).toBe(null);
        expect(findWidgetById(article, 'a-widget-from-an-uninstalled-extension')).toBe(null);
    });

    it('returns null for a null or undefined id', () => {
        registerWidgets([widget('comments')]);

        expect(findWidgetById(article, null)).toBe(null);
        expect(findWidgetById(article, undefined)).toBe(null);
    });

    // mirrors what `AuthoringIntegrationWrapper.loadWidgetFromPreferences` does with
    // `editor:pinned_widget`, the one surface that can still hold a removed authoring-react id
    it('resolves a pinned widget stored under a removed authoring-react id once normalised', () => {
        registerWidgets([widget('comments')]);

        expect(findWidgetById(article, getCanonicalWidgetId('comments-widget'))._id).toBe('comments');
    });

    it('returns null when the widget is registered but not allowed for the article', () => {
        registerWidgets([widget('comments', {isAllowed: () => false})]);

        expect(getWidgetsFromExtensions(article).length).toBe(0);
        expect(findWidgetById(article, 'comments')).toBe(null);
    });
});
