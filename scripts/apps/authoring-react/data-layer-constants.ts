import {IArticle} from 'superdesk-api';

/**
 * Content-profile field ids that don't map 1:1 to a stored article field. They can be enabled in
 * profiles but are not part of the `archive` resource schema, so they must not be sent verbatim in
 * a PATCH or the server rejects the request with "unknown field".
 *
 * Kept in a dependency-light module so it can be imported without dragging in the full data-layer.
 */

// companion/unused fields with no backing data of their own; drop them before saving
export const COMPANION_FIELD_IDS = ['footer', 'media_description'];

// profile field id -> the article field its value is actually stored in
export const FIELD_ID_TO_STORED_FIELD: Partial<Record<string, keyof IArticle>> = {sms: 'sms_message'};
