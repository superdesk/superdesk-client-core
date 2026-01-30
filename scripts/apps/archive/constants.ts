import {IPTCMetadata, XMPMetadata} from 'superdesk-api';
import {getInvertObject} from 'utils/object';

export enum ITEM_STATE {
    /**
     * ROOT STATE
     * DRAFT is the first state for manually created items. Drafts can only be autosaved.
     * When a draft is saved manually, the state switches to IN_PROGRESS.
     */
    DRAFT = 'draft',

    /**
     * READ-ONLY, ROOT STATE
     * Ingested item in ingest collection, not production.
     * The only action that can be performed on ingested items is to fetch them.
     * After fetching, state switches to FETCHED.
     */
    INGESTED = 'ingested',

    /**
     * Item manually fetched from ingest to desk.
     * Similar to ROUTED, except that fetching is manual and routing is automatic.
     * Same actions are available as for items that are IN_PROGRESS
     */
    FETCHED = 'fetched', // becomes IN_PROGRESS when you start editing it

    /**
     * Automatically ingested to desk.
     * Similar to FETCHED, except that routing is automatic and fetching is manual.
     * Same actions are available as for items that are IN_PROGRESS
     */
    ROUTED = 'routed',

    /**
     * Item is sent to a desk.
     * Same actions are available as for items that are IN_PROGRESS
     * becomes IN_PROGRESS when a change is saved
     */
    SUBMITTED = 'submitted',

    /**
     * Main workflow state.
     */
    IN_PROGRESS = 'in_progress',

    /**
     * Removed from a desk.
     * The only action that can be performed on SPIKED items is to un-spike.
     * SPIKED items may also be removed by the system after a certain period of time.
     */
    SPIKED = 'spiked',

    /**
     * Published.
     *
     * update - creates a copy -> IN_PROGRESS
     * correct - creates a new item with state CORRECTED, can only publish correction, can't get it back to workflow
     * takedown -> RECALLED
     * kill -> KILLED
     * unpublish -> UNPUBLISHED will go in workflow and become IN_PROGRESS when edited
     *
     */
    PUBLISHED = 'published',

    /**
     * Scheduled for publishing. Always displayed in output stage.
     * The only available action is to de-schedule. Item will then become IN_PROGRESS.
     * Unless de-scheduled, the item will become PUBLISHED at set date.
     */
    SCHEDULED = 'scheduled',

    /**
     * Correction is published.
     * Will only be displayed in output stage
     * Same actions are available as for items that are PUBLISHED
     */
    CORRECTED = 'corrected',

    /**
     * Only available when correction workflow is enabled.
     * BEING_CORRECTED state will be set for a formerly published item which is in the output.
     * The original item will remain in the output.
     * A new item will be created on a stage with status CORRECTION.
    */
    BEING_CORRECTED = 'being_corrected',

    /**
     * Only available when correction workflow is enabled.
     * Item with state CORRECTION will be displayed on a stage.
     * The original item that is being corrected will remain in the output with state BEING_CORRECTED.
     * When published, becomes CORRECTED.
    */
    CORRECTION = 'correction',

    /**
     * FINAL STATE
     * No actions are available.
     */
    KILLED = 'killed',

    /**
     * FINAL STATE
     * No actions are available.
     */
    RECALLED = 'recalled',

    /**
     * When unpublished, item goes back to workflow and will become IN_PROGRESS if changed and saved.
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
    ITEM_STATE.BEING_CORRECTED,
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

export const IPTC_XMP_TAGS = {
    'IPTC:Destination': 'XMP:Destination',
    'IPTC:ServiceIdentifier': 'XMP:ServiceIdentifier',
    'IPTC:ProductID': 'XMP:ProductID',
    'IPTC:DateSent': 'XMP:DateSent',
    'IPTC:TimeSent': 'XMP:TimeSent',
    'IPTC:ObjectName': 'XMP:Title',
    'IPTC:EditStatus': 'XMP:EditStatus',
    'IPTC:Urgency': 'XMP:Urgency',
    'IPTC:SubjectReference': 'XMP:SubjectCode',
    'IPTC:Category': 'XMP:Category',
    'IPTC:SupplementalCategories': 'XMP:SupplementalCategories',
    'IPTC:Keywords': 'XMP:Subject',
    'IPTC:ContentLocationCode': 'XMP:LocationCode',
    'IPTC:ContentLocationName': 'XMP:LocationName',
    'IPTC:ReleaseDate': 'XMP:ReleaseDate',
    'IPTC:ReleaseTime': 'XMP:ReleaseTime',
    'IPTC:ExpirationDate': 'XMP:ExpirationDate',
    'IPTC:ExpirationTime': 'XMP:ExpirationTime',
    'IPTC:SpecialInstructions': 'XMP:Instructions',
    'IPTC:DateCreated': 'XMP:DateCreated',
    'IPTC:TimeCreated': 'XMP:DateCreated',
    'IPTC:By-line': 'XMP:Creator',
    'IPTC:By-lineTitle': 'XMP:AuthorsPosition',
    'IPTC:City': 'XMP:City',
    'IPTC:Sub-location': 'XMP:Location',
    'IPTC:Province-State': 'XMP:State',
    'IPTC:Country-PrimaryLocationCode': 'XMP:CountryCode',
    'IPTC:Country-PrimaryLocationName': 'XMP:Country',
    'IPTC:OriginalTransmissionReference': 'XMP:TransmissionReference',
    'IPTC:Headline': 'XMP:Headline',
    'IPTC:Credit': 'XMP:Credit',
    'IPTC:Source': 'XMP:Source',
    'IPTC:CopyrightNotice': 'XMP:Rights',
    'IPTC:Contact': 'XMP:CreatorContactInfo',
    'IPTC:Caption-Abstract': 'XMP:Description',
    'IPTC:Writer-Editor': 'XMP:CaptionWriter',
    'IPTC:LanguageIdentifier': 'XMP:Language',
} as const satisfies Record<`IPTC:${keyof IPTCMetadata}`, `XMP:${XMPMetadata}`>;
export const XMP_IPTC_TAGS = getInvertObject(IPTC_XMP_TAGS);

export const EXIFTOOL_ARGS = {
    COMPOSITE: ['-use MWG', '-mwg:all'],
    IPTC: '-iptc:all',
    JSON: '-j',
    showDuplicates: '-a',
    showGroupNames: '-G',
    XMP: '-xmp:all',
} as const;
