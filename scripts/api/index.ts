import {article} from './article';
import {desks} from './desks';
import {time} from './time';
import {preferences} from './preferences';
import {user} from './user';
import {vocabularies} from './vocabularies';
import {navigation} from './navigation';
import {templates} from './templates';

/**
 * This is core API, not extensions API.
 * Most of the things in extensions API are generic and they should be moved here to be able to use it internally.
 * Extensions API would then be core API + a few extension specific things like communication between extensions.
 */
export const sdApi = {
    article,
    desks,
    time,
    preferences,
    user,
    vocabularies,
    navigation,
    templates,
};
