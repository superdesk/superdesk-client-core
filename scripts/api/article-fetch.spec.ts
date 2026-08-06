import {IArticle} from 'superdesk-api';
import {OrderedMap} from 'immutable';
import {notify} from 'core/notify/notify';
import {sdApi} from 'api';
import {fetchItemsToCurrentDesk} from './article-fetch';

describe('fetchItemsToCurrentDesk', () => {
    it('reports the problem instead of crashing when the current desk has no incoming stage', async () => {
        spyOn(sdApi.desks, 'getCurrentDeskId').and.returnValue('desk1');
        spyOn(sdApi.desks, 'getDeskDefaultIncomingStageId').and.returnValue(null);

        // the pre-fix implementation read the stage off `getDeskStages` directly
        spyOn(sdApi.desks, 'getDeskStages').and.returnValue(OrderedMap());
        spyOn(notify, 'error');

        await expectAsync(
            fetchItemsToCurrentDesk([{_id: 'article1'} as IArticle]),
        ).toBeRejectedWithError(/no incoming stage/);

        expect(notify.error).toHaveBeenCalled();
    });
});
