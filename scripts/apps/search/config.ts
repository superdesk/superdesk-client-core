import {get} from 'lodash';

export function hideNestedItems(config) {
    return get(config, 'features.nestedItemsInOutputStage', false) === true;
}
