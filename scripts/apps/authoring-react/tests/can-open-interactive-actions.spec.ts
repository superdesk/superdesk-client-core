import {IArticle} from 'superdesk-api';
import {sdApi} from 'api';
import {appConfig} from 'appConfig';
import {ITEM_STATE} from 'apps/archive/constants';
import {canOpenInteractiveActions, getInteractiveActionsTabs} from '../authoring-angular-integration';

function article(overrides: Partial<IArticle>): IArticle {
    return {_id: 'article-1', state: ITEM_STATE.IN_PROGRESS, ...overrides} as IArticle;
}

describe('send to / publish availability in authoring-react', () => {
    it('is offered for an item that can still be published', () => {
        spyOn(sdApi.article, 'canPublish').and.returnValue(true);

        expect(canOpenInteractiveActions(article({}))).toBe(true);
    });

    it('is offered for a non-archived item that cannot be published, so it can still be sent', () => {
        spyOn(sdApi.article, 'canPublish').and.returnValue(false);

        expect(canOpenInteractiveActions(article({_type: 'archive'}))).toBe(true);
    });

    it('is withheld once the item has been killed or recalled', () => {
        spyOn(sdApi.article, 'canPublish').and.returnValue(true);

        expect(canOpenInteractiveActions(article({state: ITEM_STATE.KILLED}))).toBe(false);
        expect(canOpenInteractiveActions(article({state: ITEM_STATE.RECALLED}))).toBe(false);
    });

    it('is withheld for an archived item with no publishing action left', () => {
        spyOn(sdApi.article, 'canPublish').and.returnValue(false);

        expect(canOpenInteractiveActions(article({_type: 'archived'}))).toBe(false);
    });

    it('is withheld in the kill editor, which sends the kill from its own button', () => {
        spyOn(sdApi.article, 'canPublish').and.returnValue(true);

        expect(canOpenInteractiveActions(article({}), 'kill')).toBe(false);
    });

    it('is offered in the correct editor, which sends the correction through the panel', () => {
        spyOn(sdApi.article, 'canPublish').and.returnValue(false);

        expect(canOpenInteractiveActions(article({_type: 'archived'}), 'correct')).toBe(true);
    });
});

describe('send to / publish tabs in authoring-react', () => {
    const correctionsWorkflowInitial = appConfig.corrections_workflow;

    afterEach(() => {
        Object.assign(appConfig, {corrections_workflow: correctionsWorkflowInitial});
    });

    it('offers publish as the active tab when the item can be published', () => {
        spyOn(sdApi.article, 'canPublish').and.returnValue(true);

        expect(getInteractiveActionsTabs(article({}), 'edit')).toEqual({
            tabs: ['send_to', 'publish'],
            activeTab: 'publish',
        });
    });

    it('offers send to alone when the item cannot be published', () => {
        spyOn(sdApi.article, 'canPublish').and.returnValue(false);

        expect(getInteractiveActionsTabs(article({}), 'edit')).toEqual({
            tabs: ['send_to'],
            activeTab: 'send_to',
        });
    });

    it('offers correct rather than publish in the correct editor', () => {
        spyOn(sdApi.article, 'canPublish').and.returnValue(true);

        expect(getInteractiveActionsTabs(article({}), 'correct')).toEqual({
            tabs: ['send_to', 'correct'],
            activeTab: 'correct',
        });
    });

    it('offers correct rather than publish while an item is being corrected', () => {
        spyOn(sdApi.article, 'canPublish').and.returnValue(true);
        Object.assign(appConfig, {corrections_workflow: true});

        expect(getInteractiveActionsTabs(article({state: ITEM_STATE.CORRECTION}), 'edit')).toEqual({
            tabs: ['send_to', 'correct'],
            activeTab: 'correct',
        });
    });

    it('offers ordinary publishing for a correction state when the workflow is off', () => {
        spyOn(sdApi.article, 'canPublish').and.returnValue(true);
        Object.assign(appConfig, {corrections_workflow: false});

        expect(getInteractiveActionsTabs(article({state: ITEM_STATE.CORRECTION}), 'edit')).toEqual({
            tabs: ['send_to', 'publish'],
            activeTab: 'publish',
        });
    });
});
