import {IBaseRestApiResponse} from 'superdesk-api';

export interface IPublishQueueItem extends IBaseRestApiResponse {
    published_seq_num?: any;
    formatted_item?: any;
    item_id?: any;
    item_version?: any;
    subscriber_id?: any;
    codes?: any;
    publish_schedule?: any;
    unique_name?: any;
    content_type?: any;
    headline?: any;
    publishing_action?: any;
    ingest_provider?: any;
    associated_items?: any;
    priority?: any;
    moved_to_legal?: any;
    retry_attempt?: any;
    state?: any;
    transmit_started_at?: any;
    next_retry_attempt_at?: any;
    completed_at?: any;
    destination?: {
        name?: string;
        format?: string;
        delivery_type?: string;
        config?: {
            resource_url?: string;
        }
    };
}
