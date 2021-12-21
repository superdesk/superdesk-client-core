import {IDesk, IStage} from 'superdesk-api';

export interface ISendToDestinationDesk {
    type: 'desk';
    desk: IDesk['_id'];
    stage: IStage['_id'];
}

export interface ISendToDestinationPersonalSpace {
    type: 'personal-space';
}

export type ISendToDestination = ISendToDestinationDesk | ISendToDestinationPersonalSpace;
