// same as import {ITEM_STATE} from 'superdesk-api'
// but to be used as values at run time
export enum ITEM_STATE {
    DRAFT = 'draft',
    INGESTED = 'ingested',
    ROUTED = 'routed',
    FETCHED = 'fetched',
    SUBMITTED = 'submitted',
    IN_PROGRESS = 'in_progress',
    SPIKED = 'spiked',
    PUBLISHED = 'published',
    SCHEDULED = 'scheduled',
    CORRECTED = 'corrected',
    KILLED = 'killed',
    RECALLED = 'recalled',
    UNPUBLISHED = 'unpublished',
}
