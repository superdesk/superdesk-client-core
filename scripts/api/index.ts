import {highlights} from './highlights';
import {article} from './article';
import {config} from './config';
import {desks} from './desks';
import {ingest} from './ingest';
import {localStorage} from './local-storage';
import {navigation} from './navigation';
import {preferences} from './preferences';
import {templates} from './templates';
import {time} from './time';
import {user} from './user';
import {vocabularies} from './vocabularies';
import {contentProfiles} from './content-profiles';

/**
 * This is core API, not extensions API.
 * Most of the things in extensions API are generic and they should be moved here to be able to use it internally.
 * Extensions API would then be core API + a few extension specific things like communication between extensions.
 */
export const sdApi = {
    article,
    config,
    desks,
    ingest,
    localStorage,
    navigation,
    preferences,
    templates,
    time,
    user,
    vocabularies,
    highlights,
    contentProfiles,
};
