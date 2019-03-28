import {IDefaultApiFields} from 'types/RestApi';

// It's not entirely correct to extend from IDefaultApiFields since macro doesn't have an _id
// I'm still extending to make it compatible with other types depending on IDefaultApiFields
export interface IMacro extends IDefaultApiFields {
    access_type: string;
    action_type: string;
    description?: string;
    label: string;
    name: string;
    replace_type: string;
}
