import {article} from './article';
import {desks} from './desks';

/**
 * This is core API, not extensions API.
 * Most of the things in extensions API are generic and they should be moved here to be able to use it internally.
 * Extensions API would then be core API + a few extension specific things like communication between extensions.
 */
export const sdApi = {
    article,
    desks,
};
