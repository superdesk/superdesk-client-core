import {IUser} from './User';
import {IStage} from './Stage';
import {IDefaultApiFields} from "superdesk-api";

export interface IDesk extends IDefaultApiFields {
    incoming_stage: IStage['_id'];
    members: Array<IUser['_id']>;
    name: string;
    desk_type: 'authoring' | 'production';
    working_stage: IStage['_id'];
}
