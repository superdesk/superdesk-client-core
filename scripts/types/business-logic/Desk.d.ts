import {User} from "./User";
import {Stage} from "./Stage";

export interface Desk {
    _id: string;
    incoming_stage: Stage['_id'];
    members: Array<User['id']>;
    name: string;
    desk_type: 'authoring' | 'production';
    working_stage: Stage['_id'];
}
