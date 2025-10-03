import {IPTCMetadata, XMPMetadata} from 'superdesk-api';
import {getInvertObject} from 'utils/object';

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
     * Correction, If Correction workflow is true, correction, copy of published article which we can edit.
     */
    CORRECTION = 'correction',

    /**
     * being_corrected, If Correction workflow is true, being_corrected, the item is being corrected.
    */
    BEING_CORRECTED = 'being_corrected',

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
