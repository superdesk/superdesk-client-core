import moment from 'moment-timezone';
import {IArticle, IAuthoringActionType} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {ITEM_STATE} from 'apps/archive/constants';

function isCorrection(item: IArticle, action: IAuthoringActionType | null): boolean {
    return appConfig.corrections_workflow === true
        && item.state === ITEM_STATE.CORRECTION
        && action === 'edit';
}

/**
 * Port of `isMissingLink` in AuthoringHeaderDirective, where the local names (`isUpdated`,
 * `isCorrection`) hold the negation of what they read like. Falsy rather than null checks are
 * deliberate: legacy relied on `correction_sequence` of 0 meaning "no correction yet".
 */
export function isMissingLink(item: IArticle, action: IAuthoringActionType | null): boolean {
    const notPartOfRewriteChain = !item.rewrite_of && !item.rewritten_by;
    const notPartOfCorrection = action !== 'correct'
        && !isCorrection(item, action)
        && !item.correction_sequence;

    return notPartOfRewriteChain && notPartOfCorrection;
}

/**
 * `noMissingLink` is folded in here rather than checked after the request as legacy did; the only
 * difference is that a request nobody can act on is never sent.
 */
export function shouldQueryRelatedItems(item: IArticle): boolean {
    return item._type !== 'legal_archive'
        && item.type === 'text'
        && (item.slugline ?? '').trim().length > 0
        && appConfig.features?.noMissingLink !== true;
}

/** Midnight in the instance timezone, not the user's, so everyone gets the same cutoff. */
export function getRelatedItemsFromDateTime(): string {
    return moment().tz(appConfig.default_timezone)
        .format(appConfig.view.dateformat);
}
