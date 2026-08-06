import {IArticle} from 'superdesk-api';
import {sdApi} from 'api';
import {ITEM_STATE} from 'apps/archive/constants';
import {canOpenInteractiveActions} from '../authoring-angular-integration';

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
});
