import {IDefaultApiFields} from 'types/RestApi';

export interface IInternalDestination extends IDefaultApiFields {
    name: string;
    is_active: boolean;
    filter?: string;
    desk: string;
    stage?: string;
    macro?: string;
}
