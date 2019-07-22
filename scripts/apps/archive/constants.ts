export enum ITEM_STATE {
    /**
     * Item created in user workspace.
     */
    DRAFT = 'draft',

    /**
     * Ingested item in ingest collection, not production.
     */
    INGESTED = 'ingested',

    /**
     * Automatically ingested to desk.
     */
    ROUTED = 'routed',

    /**
     * Item manually fetched from ingest to desk.
     */
    FETCHED = 'fetched',

    /**
     * Item is sent to a desk.
     */
    SUBMITTED = 'submitted',

    /**
     * Work started on a desk.
     */
    IN_PROGRESS = 'in_progress',

    /**
     * Removed from a desk.
     */
    SPIKED = 'spiked',

    /**
     * Published.
     */
    PUBLISHED = 'published',

    /**
     * Scheduled for publishing.
     */
    SCHEDULED = 'scheduled',

    /**
     * Correction is published.
     */
    CORRECTED = 'corrected',

    /**
     * Killed, never publish again.
     */
    KILLED = 'killed',

    /**
     * Sort of killed, never publish again.
     */
    RECALLED = 'recalled',

    /**
     * Unpublished, might be published again.
     */
    UNPUBLISHED = 'unpublished',
}

/**
 * Item was published once (or will be soon for scheduled)
 * 
 * PUBLISHED | SCHEDULED | CORRECTED | KILLED | RECALLED | UNPUBLISHED
 */
export const PUBLISHED_STATES = [
    ITEM_STATE.PUBLISHED,
    ITEM_STATE.SCHEDULED,
    ITEM_STATE.CORRECTED,

    ITEM_STATE.KILLED,
    ITEM_STATE.RECALLED,
    ITEM_STATE.UNPUBLISHED,
];

/**
 * Not published atm, but it was once
 *
 * KILLED | RECALLED | UNPUBLISHED
 */
export const KILLED_STATES = [
    ITEM_STATE.KILLED,
    ITEM_STATE.RECALLED,
    ITEM_STATE.UNPUBLISHED,
];

/**
 * Item is canceled before or after publishing
 * 
 * KILLED | RECALLED | UNPUBLISHED | SPIKED
 */
export const CANCELED_STATES = KILLED_STATES.concat([ITEM_STATE.SPIKED]);

/**
 * Such items can't be edited without further action (or ever)
 * 
 * KILLED | RECALLED | UNPUBLISHED | SPIKED | SCHEDULED
 */
export const READONLY_STATES = CANCELED_STATES.concat([ITEM_STATE.SCHEDULED]);
