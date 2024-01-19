import {OrderedMap} from 'immutable';
import {IContentProfileV2} from 'superdesk-api';

export const testContentProfileV2: IContentProfileV2 = {
    id: 'profile-1',
    name: 'Profile 1',
    header: OrderedMap(),
    content: OrderedMap(),
};
