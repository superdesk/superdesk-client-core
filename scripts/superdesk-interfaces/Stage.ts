import {IBaseRestApiResponse} from "superdesk-api";

export interface IStage extends IBaseRestApiResponse {
    name: string;
    description: string;
    working_stage: boolean;
    default_incoming: boolean;
    task_status: 'todo' | 'in_progress' | 'done';
    desk_order: number;
    desk: any;
    content_expiry: number;
    is_visible: boolean;
    local_readonly: boolean;
    incoming_macro: string;
    outgoing_macro: string;
    onstage_macro: string;
}
