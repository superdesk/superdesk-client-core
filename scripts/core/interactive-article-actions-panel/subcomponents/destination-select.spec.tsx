import React from 'react';
import {shallow} from 'enzyme';
import {IDesk} from 'superdesk-api';
import {OrderedMap} from 'immutable';
import {sdApi} from 'api';
import {SelectFilterable} from 'core/ui/components/select-filterable';
import {ISendToDestination} from '../interfaces';
import {DestinationSelect} from './destination-select';

const desks = OrderedMap<string, IDesk>({
    desk1: {_id: 'desk1', name: 'Sports'} as IDesk,
    desk2: {_id: 'desk2', name: 'Politics'} as IDesk,
});

function selectDesk(deskStages: OrderedMap<string, any>): ISendToDestination {
    spyOn(sdApi.desks, 'getAllDesks').and.returnValue(desks);
    spyOn(sdApi.desks, 'getCurrentUserDesks').and.returnValue([]);
    spyOn(sdApi.desks, 'getDeskStages').and.returnValue(deskStages);
    spyOn(sdApi.preferences, 'get').and.returnValue(null);

    let selected: ISendToDestination = null;

    const wrapper = shallow(
        <DestinationSelect
            value={{type: 'desk', desk: 'desk1', stage: 'stage1'}}
            onChange={(value) => {
                selected = value;
            }}
            includePersonalSpace={false}
            hideStages
        />,
    );

    wrapper.find(SelectFilterable).props().onChange({id: 'desk2', label: 'Politics'});

    return selected;
}

describe('DestinationSelect', () => {
    it('selects the first stage of the desk the user picked', () => {
        expect(selectDesk(OrderedMap({stage2: {_id: 'stage2'}}))).toEqual({
            type: 'desk',
            desk: 'desk2',
            stage: 'stage2',
        });
    });

    it('leaves the stage unselected when the picked desk has no resolvable stages', () => {
        expect(selectDesk(OrderedMap())).toEqual({
            type: 'desk',
            desk: 'desk2',
            stage: null,
        });
    });
});
