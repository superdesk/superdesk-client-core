import {IArticle, IStage} from 'superdesk-api';
import {OrderedMap} from 'immutable';
import {sdApi} from 'api';
import {article} from './article';

const item = {_id: 'article1', task: {desk: 'desk1', stage: 'stage1'}} as IArticle;

describe('sdApi.article.sendItemToNextStage', () => {
    it('rejects legibly when the desk stages are not available', async () => {
        spyOn(sdApi.desks, 'getDeskStages').and.returnValue(OrderedMap());
        spyOn(sdApi.article, 'sendItems');

        await expectAsync(article.sendItemToNextStage(item))
            .toBeRejectedWithError(/is not a stage of desk "desk1"/);

        expect(sdApi.article.sendItems).not.toHaveBeenCalled();
    });

    it('refuses to guess when the item is on a stage the desk does not have', async () => {
        spyOn(sdApi.desks, 'getDeskStages').and.returnValue(
            OrderedMap({stage9: {_id: 'stage9'} as IStage}),
        );
        spyOn(sdApi.article, 'sendItems');

        // without the guard the item would silently be sent to `stage9`
        await expectAsync(article.sendItemToNextStage(item))
            .toBeRejectedWithError(/is not a stage of desk "desk1"/);

        expect(sdApi.article.sendItems).not.toHaveBeenCalled();
    });

    // the declared return type is a promise, so a caller holding it has to be able to catch;
    // `AuthoringDirective` calls this outside a promise chain
    it('rejects rather than throwing for a personal item', async () => {
        await expectAsync(article.sendItemToNextStage({_id: 'article1'} as IArticle))
            .toBeRejectedWithError(/personal item/);
    });
});
