import {IArticle, IArticleSideWidget, IOpenSideWidget, IUser} from 'superdesk-api';
import {appConfig, extensions} from 'appConfig';
import ng from 'core/services/ng';
import {
    registerContributionsFromCustomFields,
    registerInternalExtension,
    unregisterInternalExtension,
} from 'core/helpers/register-internal-extension';
import {authoringReactWidgetsExtension, registerAuthoringReactWidgets} from './manage-widget-registration';
import {getAttachmentsField} from './fields/attachments';
import {
    SIDE_WIDGET_STORAGE_KEY,
    findWidgetById,
    getSideWidgetLockState,
    getStoredStateForWidget,
    getWidgetsFromExtensions,
    isSideWidgetLocked,
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

describe('the order side widgets are listed in', () => {
    afterEach(() => {
        delete extensions['test-extension'];
        unregisterInternalExtension('test-core-widgets');
    });

    it('is ascending by order', () => {
        registerWidgets([widget('c', {order: 3}), widget('a', {order: 1}), widget('b', {order: 2})]);

        expect(getWidgetsFromExtensions(article).map((w) => w._id)).toEqual(['a', 'b', 'c']);
    });

    it('keeps registration order for widgets that share an order', () => {
        registerWidgets([
            widget('registered-first', {order: 7}),
            widget('registered-second', {order: 7}),
            widget('later', {order: 8}),
        ]);

        expect(getWidgetsFromExtensions(article).map((w) => w._id))
            .toEqual(['registered-first', 'registered-second', 'later']);
    });

    // extensions pick their own numbers and collide with core widgets; authoring-angular puts
    // core first on a tie, and extensions are registered before the core widgets are
    it('puts a core widget before an extension widget that shares its order', () => {
        registerWidgets([widget('from-an-extension', {order: 1})]);
        registerInternalExtension('test-core-widgets', {
            contributions: {authoringSideWidgets: [widget('core', {order: 1})]},
        });

        expect(getWidgetsFromExtensions(article).map((w) => w._id)).toEqual(['core', 'from-an-extension']);
    });
});

/**
 * Both rails sort on the same `order` numbers, so a widget whose number drifts from the one
 * authoring-angular gives it lands in a different place in authoring-react. authoring-angular is
 * the reference; these are the numbers its widgets are registered with.
 */
describe('side widget order parity with authoring-angular', () => {
    const orderInAuthoringAngular = {
        metadata: 1,
        'find-replace': 2,
        comments: 3,
        versioning: 4,
        packages: 5,
        macros: 6,
        'related-item': 7,
        translations: 7,
        attachments: 8,
        'inline-comments': 9,
        suggestions: 10,
    };

    let featuresBeforeSpec: typeof appConfig.features;

    beforeEach(() => {
        featuresBeforeSpec = appConfig.features;

        // both are optional widgets; the rail is only comparable with angular's when they are on
        appConfig.features = {
            ...(appConfig.features ?? {}),
            editorInlineComments: true,
            editorSuggestions: true,
        } as typeof appConfig.features;

        registerAuthoringReactWidgets();

        // attachments is contributed by the field, not by the widget registration
        registerContributionsFromCustomFields([getAttachmentsField()]);
    });

    afterEach(() => {
        unregisterInternalExtension(authoringReactWidgetsExtension);
        unregisterInternalExtension('field-type--attachments');
        appConfig.features = featuresBeforeSpec;
    });

    it('registers every widget with the order authoring-angular gives it', () => {
        const orders: {[widgetId: string]: number} = {};

        for (const registered of getWidgetsFromExtensions(article)) {
            orders[registered._id] = registered.order;
        }

        expect(orders).toEqual(orderInAuthoringAngular);
    });

    /**
     * Related items and translations are both order 7 in authoring-angular, which resolves the tie
     * by registration order: `superdesk.apps.archive` pulls in the related items widget before
     * `superdesk.apps.authoring` pulls in translations.
     */
    it('lists the widgets in the order authoring-angular shows them', () => {
        expect(getWidgetsFromExtensions(article).map((registered) => registered._id)).toEqual([
            'metadata',
            'find-replace',
            'comments',
            'versioning',
            'packages',
            'macros',
            'related-item',
            'translations',
            'attachments',
            'inline-comments',
            'suggestions',
        ]);
    });
});

describe('locking a side widget', () => {
    const unlockedAndEditable = {readOnly: false, lockedByAnotherUser: false, readOnlyStage: false};

    it('leaves a widget that declares neither requirement open in every state', () => {
        const plain = widget('comments');

        expect(isSideWidgetLocked(plain, unlockedAndEditable)).toBe(false);
        expect(isSideWidgetLocked(plain, {readOnly: true, lockedByAnotherUser: true, readOnlyStage: true}))
            .toBe(false);
    });

    it('locks a widget that needs the item editable while the item is read only', () => {
        const needsEditable = widget('related-item', {needEditable: true});

        expect(isSideWidgetLocked(needsEditable, unlockedAndEditable)).toBe(false);
        expect(isSideWidgetLocked(needsEditable, {...unlockedAndEditable, readOnly: true})).toBe(true);
    });

    it('locks a widget that needs the item unlocked while someone else holds the lock', () => {
        const needsUnlock = widget('related-item', {needUnlock: true});

        expect(isSideWidgetLocked(needsUnlock, unlockedAndEditable)).toBe(false);
        expect(isSideWidgetLocked(needsUnlock, {...unlockedAndEditable, lockedByAnotherUser: true})).toBe(true);

        // needUnlock looks at the lock only, not at whether the item is read only
        expect(isSideWidgetLocked(needsUnlock, {...unlockedAndEditable, readOnly: true})).toBe(false);
    });

    it('locks either requirement on a read-only stage', () => {
        const onReadOnlyStage = {...unlockedAndEditable, readOnlyStage: true};

        expect(isSideWidgetLocked(widget('a', {needEditable: true}), onReadOnlyStage)).toBe(true);
        expect(isSideWidgetLocked(widget('b', {needUnlock: true}), onReadOnlyStage)).toBe(true);
        expect(isSideWidgetLocked(widget('c'), onReadOnlyStage)).toBe(false);
    });
});

describe('the lock state a side widget is gated on', () => {
    const currentSession = 'session-1';
    const currentUser = 'user-1';

    function stubAngularServices(
        {unlockPrivilege = false, readOnlyStages = []}: {unlockPrivilege?: boolean, readOnlyStages?: Array<string>},
    ) {
        spyOn(ng, 'get').and.callFake((service: string) => {
            switch (service) {
                case 'session':
                    return {sessionId: currentSession, identity: {_id: currentUser}};
                case 'privileges':
                    return {userHasPrivileges: (required) => required.unlock === 1 && unlockPrivilege};
                case 'desks':
                    return {isReadOnlyStage: (stageId) => readOnlyStages.includes(stageId)};
                default:
                    return null;
            }
        });
    }

    function lockedArticle(overrides: Partial<IArticle>): IArticle {
        return {
            _id: 'article1',
            state: 'in_progress',
            task: {desk: 'desk1', stage: 'stage1'},
            lock_session: 'session-2',
            lock_user: 'user-2',
            ...overrides,
        } as IArticle;
    }

    it('reports an unlocked item on a writable stage as open', () => {
        stubAngularServices({});

        expect(getSideWidgetLockState(lockedArticle({lock_session: null, lock_user: null}), false)).toEqual({
            readOnly: false,
            lockedByAnotherUser: false,
            readOnlyStage: false,
        });
    });

    it('passes the read-only state of the item through', () => {
        stubAngularServices({});

        expect(getSideWidgetLockState(lockedArticle({lock_session: null, lock_user: null}), true).readOnly).toBe(true);
    });

    it('reports a lock held elsewhere as another user holding it, when it can not be taken over', () => {
        stubAngularServices({unlockPrivilege: false});

        expect(getSideWidgetLockState(lockedArticle({}), true).lockedByAnotherUser).toBe(true);
    });

    it('does not, when the user holds the unlock privilege', () => {
        stubAngularServices({unlockPrivilege: true});

        expect(getSideWidgetLockState(lockedArticle({}), true).lockedByAnotherUser).toBe(false);
    });

    // a draft can not be unlocked by anyone but the user holding the lock, privilege or not
    it('does, for a draft, even when the user holds the unlock privilege', () => {
        stubAngularServices({unlockPrivilege: true});

        expect(
            getSideWidgetLockState(lockedArticle({state: 'draft' as IArticle['state']}), true).lockedByAnotherUser,
        ).toBe(true);
    });

    it('does not, when the lock belongs to the current user but was taken in another session', () => {
        stubAngularServices({unlockPrivilege: false});

        expect(getSideWidgetLockState(lockedArticle({lock_user: currentUser}), true).lockedByAnotherUser).toBe(false);
    });

    // some endpoints embed the user in `lock_user` instead of sending its id
    it('reads a lock held by the current user whether `lock_user` holds an id or an embedded user', () => {
        stubAngularServices({unlockPrivilege: false});

        const embedded = lockedArticle({lock_user: {_id: currentUser} as unknown as IUser['_id']});

        expect(getSideWidgetLockState(embedded, true).lockedByAnotherUser).toBe(false);
    });

    it('reports a read-only stage', () => {
        stubAngularServices({readOnlyStages: ['stage1']});

        expect(getSideWidgetLockState(lockedArticle({}), false).readOnlyStage).toBe(true);
    });

    it('reports no read-only stage for an item that is on none', () => {
        stubAngularServices({readOnlyStages: ['stage1']});

        expect(
            getSideWidgetLockState(lockedArticle({task: {desk: 'desk1'} as IArticle['task']}), false).readOnlyStage,
        ).toBe(false);
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
