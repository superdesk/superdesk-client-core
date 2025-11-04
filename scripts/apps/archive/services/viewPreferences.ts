import {COMPACT_LIST_VIEW} from '../utils';

/**
 * Handles legacy 'mgrid' view preference
 */
export async function getViewPreference(preferencesService): Promise<string> {
    const result = await preferencesService.get('archive:view');

    // If users still have 'mgrid' set in preferences, override that
    // so the new view takes place. At some point in the future we can drop this
    // after all users have set their view preferences to another option.
    if (result.view === 'mgrid') {
        return COMPACT_LIST_VIEW;
    }

    return result.view ?? COMPACT_LIST_VIEW;
}
