import {IArticle, IStage} from 'superdesk-api';
import {OrderedMap} from 'immutable';
import {sdApi} from 'api';
import {article} from './article';

const item = {_id: 'article1', task: {desk: 'desk1', stage: 'stage1'}} as IArticle;

describe('sdApi.article.sendItemToNextStage', () => {
    it('refuses legibly when the desk stages are not available', () => {
        spyOn(sdApi.desks, 'getDeskStages').and.returnValue(OrderedMap());
        spyOn(sdApi.article, 'sendItems');

        expect(() => article.sendItemToNextStage(item))
            .toThrowError(/is not a stage of desk "desk1"/);
        expect(sdApi.article.sendItems).not.toHaveBeenCalled();
    });

    it('refuses to guess when the item is on a stage the desk does not have', () => {
        spyOn(sdApi.desks, 'getDeskStages').and.returnValue(
            OrderedMap({stage9: {_id: 'stage9'} as IStage}),
        );
        spyOn(sdApi.article, 'sendItems');

        // without the guard the item would silently be sent to `stage9`
        expect(() => article.sendItemToNextStage(item))
            .toThrowError(/is not a stage of desk "desk1"/);
        expect(sdApi.article.sendItems).not.toHaveBeenCalled();
    });
});
