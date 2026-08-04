import moment from 'moment-timezone';
import {IArticle} from 'superdesk-api';
import {isPublished} from 'apps/archive/utils';
import {appConfig} from 'appConfig';

export const RELATED_ITEMS_WIDGET_ID = 'related-item';

export const SLUGLINE_MATCH_STORAGE_KEY = 'sluglineMatch';
export const MODIFICATION_DATE_AFTER_STORAGE_KEY = 'modificationDateAfter';

export type ISluglineMatch = 'EXACT' | 'ANY' | 'PREFIX';
export type IModificationDateAfter = 'now-6h' | 'now-12h' | 'today' | 'now-24h' | 'now-48h';

export const DEFAULT_SLUGLINE_MATCH: ISluglineMatch = 'EXACT';
export const DEFAULT_MODIFICATION_DATE_AFTER: IModificationDateAfter = 'today';

/**
 * The metadata authoring-angular copies from the picked item onto the item being edited.
 */
export const COPIED_METADATA_FIELDS: Array<keyof IArticle> = [
    'subject',
    'anpa_category',
    'headline',
    'urgency',
    'priority',
    'slugline',
    'place',
];

/**
 * Port of the `display` map and of `isWidgetVisible` the angular widget is registered with. The
 * widget is hidden for packages, pictures, personal items, legal archive and archived items, and
 * for profiles without a slugline, which the whole widget searches on. Killed items keep it.
 *
 * An unknown profile counts as allowed: hiding the widget because a profile could not be read
 * would be a worse failure than showing a search the user can not use.
 */
export function isRelatedItemsWidgetAllowed(
    article: IArticle,
    profileSchema: {[field: string]: unknown} | null,
): boolean {
    const isLegal = article._type === 'legal_archive';
    const isArchived = article._type === 'archived';
    const isPersonal = article.task?.user != null && article.task?.desk == null;

    if (isLegal || isArchived || isPersonal) {
        return false;
    }

    if (article.type === 'composite' || article.type === 'picture') {
        return false;
    }

    return profileSchema == null || Object.prototype.hasOwnProperty.call(profileSchema, 'slugline');
}

interface IAssociateAsUpdateParams {
    currentItem: IArticle;
    hasRewritePrivilege: boolean;

    /**
     * `re_write` from the item actions of the picked item.
     */
    targetCanBeRewritten: boolean;
}

export function canAssociateAsUpdate({
    currentItem,
    hasRewritePrivilege,
    targetCanBeRewritten,
}: IAssociateAsUpdateParams): boolean {
    const currentItemCanBeRewrite = !isPublished(currentItem)
        && currentItem.type === 'text'
        && currentItem.rewrite_of == null
        && currentItem.broadcast?.master_id == null;

    return targetCanBeRewritten && currentItemCanBeRewrite && hasRewritePrivilege;
}

export function canAssociateMetadata(targetItem: IArticle): boolean {
    return targetItem.type !== 'composite';
}

/**
 * Fields absent from the destination content profile are skipped, so associating metadata can
 * not write a value the profile does not accept.
 */
export function getMetadataToCopy(
    source: IArticle,
    destinationProfileSchema: {[field: string]: unknown} | null,
): Partial<IArticle> {
    const patch: Partial<IArticle> = {related_to: source._id};

    for (const field of COPIED_METADATA_FIELDS) {
        const acceptedByProfile = destinationProfileSchema == null
            || Object.prototype.hasOwnProperty.call(destinationProfileSchema, field);

        if (acceptedByProfile) {
            patch[field as string] = source[field as string];
        }
    }

    return patch;
}

/**
 * Every option but `today` is elasticsearch date math and is sent as is; `today` has to become an
 * absolute local midnight, otherwise the day boundary would be the server's, not the user's.
 */
export function getModificationDateAfterQueryValue(value: IModificationDateAfter): string {
    if (value !== 'today') {
        return value;
    }

    if (appConfig.search?.useDefaultTimezone) {
        return moment().tz(appConfig.default_timezone).format('YYYY-MM-DD')
            + 'T00:00:00'
            + moment.tz(appConfig.default_timezone).format('ZZ');
    }

    return moment().format('YYYY-MM-DD') + 'T00:00:00' + moment().format('ZZ');
}

export function hasEnoughKeywords(keyword: string): boolean {
    return keyword.trim().length >= 2;
}
