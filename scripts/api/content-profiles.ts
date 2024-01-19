import {IContentProfile} from 'superdesk-api';
import ng from 'core/services/ng';

interface IContentProfilesApi {
    get(id: IContentProfile['_id']): Promise<IContentProfile>;
}

export const contentProfiles: IContentProfilesApi = {
    get: (id) => ng.get('content').getType(id),
};
