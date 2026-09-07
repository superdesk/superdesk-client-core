import React from 'react';
import {shallow} from 'enzyme';
import {IArticle, IDesk, IStage} from 'superdesk-api';
import {OrderedMap} from 'immutable';
import {sdApi} from 'api';
import {DeskAndStage} from './desk-and-stage';

const article = {_id: 'article1', task: {desk: 'desk1', stage: 'stage1'}} as IArticle;
const sportsDesk = OrderedMap<string, IDesk>({desk1: {_id: 'desk1', name: 'Sports'} as IDesk});
const workingStage = OrderedMap<string, IStage>({stage1: {_id: 'stage1', name: 'Working'} as IStage});

function renderWith(desks: OrderedMap<string, IDesk>, stages: OrderedMap<string, IStage>) {
    spyOn(sdApi.desks, 'getAllDesks').and.returnValue(desks);
    spyOn(sdApi.desks, 'getDeskStages').and.returnValue(stages);

    return shallow(<DeskAndStage article={article} />);
}

describe('DeskAndStage', () => {
    it('renders the desk and the stage name', () => {
        expect(renderWith(sportsDesk, workingStage).text()).toContain('Working');
    });

    it('renders nothing when the stage can not be resolved', () => {
        expect(renderWith(sportsDesk, OrderedMap()).isEmptyRender()).toBe(true);
    });

    it('renders nothing when the desk can not be resolved', () => {
        expect(renderWith(OrderedMap(), workingStage).isEmptyRender()).toBe(true);
    });
});
