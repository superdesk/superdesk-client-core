import {IArticle, IArticleSideWidget, IOpenSideWidget} from 'superdesk-api';
import {extensions} from 'appConfig';
import {
    SIDE_WIDGET_STORAGE_KEY,
    findWidgetById,
    getStoredStateForWidget,
    getWidgetsFromExtensions,
    readStoredSideWidget,
} from './side-widgets';

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

    it('returns null when the widget is registered but not allowed for the article', () => {
        registerWidgets([widget('comments', {isAllowed: () => false})]);

        expect(getWidgetsFromExtensions(article).length).toBe(0);
        expect(findWidgetById(article, 'comments')).toBe(null);
    });
});

describe('the side widget state kept in local storage', () => {
    const comments = widget('comments');
    const metadata = widget('metadata');

    beforeEach(() => {
        registerWidgets([comments, metadata]);
    });

    afterEach(() => {
        delete extensions['test-extension'];
        localStorage.removeItem(SIDE_WIDGET_STORAGE_KEY);
    });

    it('is applied to the widget it was stored for', () => {
        const stored = {id: 'comments', initialState: {commentId: 'comment1'}};

        expect(getStoredStateForWidget(article, comments, stored))
            .toEqual({initialState: {commentId: 'comment1'}});
    });

    it('is not applied to a different widget', () => {
        const stored = {id: 'comments', initialState: {commentId: 'comment1'}};

        // authoring re-renders while the key is still there, so a render of another widget
        // reaches this and must not be handed the comments widget's state
        expect(getStoredStateForWidget(article, metadata, stored)).toBe(null);
    });

    it('is not applied when the stored id resolves to no widget', () => {
        expect(getStoredStateForWidget(article, comments, {id: 'an-uninstalled-widget'})).toBe(null);
    });

    it('is not applied when nothing is stored', () => {
        expect(getStoredStateForWidget(article, comments, null)).toBe(null);
        expect(getStoredStateForWidget(article, comments, {id: null} as IOpenSideWidget)).toBe(null);
    });

    it('applies with no state when the stored value carries none', () => {
        expect(getStoredStateForWidget(article, comments, {id: 'comments'}))
            .toEqual({initialState: undefined});
    });

    it('is read back as null when the stored value is not valid JSON', () => {
        localStorage.setItem(SIDE_WIDGET_STORAGE_KEY, 'not json');

        expect(readStoredSideWidget()).toBe(null);
    });

    it('is read back as the stored value', () => {
        localStorage.setItem(SIDE_WIDGET_STORAGE_KEY, JSON.stringify({id: 'comments'}));

        expect(readStoredSideWidget()).toEqual({id: 'comments'});
    });
});
