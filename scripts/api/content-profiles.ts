import {IContentProfile} from 'superdesk-api';
import {dataStore} from 'data-store';

interface IContentProfilesApi {
    get(id: IContentProfile['_id']): IContentProfile;
}

export const contentProfiles: IContentProfilesApi = {
    get: (id) => dataStore.contentProfiles.get(id),
};
