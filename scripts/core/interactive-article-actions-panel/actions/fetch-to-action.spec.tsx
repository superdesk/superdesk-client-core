import {IDesk, IStage} from 'superdesk-api';
import {OrderedMap} from 'immutable';
import {sdApi} from 'api';
import {canFetchToDestination} from './fetch-to-action';

const destination = {type: 'desk', desk: 'desk1', stage: 'stage1'} as const;

describe('canFetchToDestination', () => {
    it('allows fetching to a visible stage', () => {
        spyOn(sdApi.desks, 'getDeskStages').and.returnValue(
            OrderedMap({stage1: {_id: 'stage1', is_visible: true} as IStage}),
        );
        spyOn(sdApi.desks, 'getCurrentUserDesks').and.returnValue([]);

        expect(canFetchToDestination(destination)).toBe(true);
    });

    it('falls back to desk membership when the stage can not be resolved', () => {
        spyOn(sdApi.desks, 'getDeskStages').and.returnValue(OrderedMap());
        spyOn(sdApi.desks, 'getCurrentUserDesks').and.returnValue([{_id: 'desk1'} as IDesk]);

        expect(canFetchToDestination(destination)).toBe(true);
    });

    it('does not allow fetching when the stage can not be resolved and the user is not a member', () => {
        spyOn(sdApi.desks, 'getDeskStages').and.returnValue(OrderedMap());
        spyOn(sdApi.desks, 'getCurrentUserDesks').and.returnValue([{_id: 'another-desk'} as IDesk]);

        expect(canFetchToDestination(destination)).toBe(false);
    });
});
