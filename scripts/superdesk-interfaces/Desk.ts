import {IUser} from "./User";
import {IStage} from "./Stage";

export interface IDesk {
    _id: string;
    incoming_stage: IStage['_id'];
    members: Array<IUser['_id']>;
    name: string;
    desk_type: 'authoring' | 'production';
    working_stage: IStage['_id'];
}
