import {IContentProfile} from 'superdesk-api';
import {dataStore} from 'data-store';

interface IContentProfilesApi {
    get(id: IContentProfile['_id']): IContentProfile;
    getAll(): Array<IContentProfile>;
}

export const contentProfiles: IContentProfilesApi = {
    get: (id) => dataStore.contentProfiles.get(id),
    getAll: () => dataStore.contentProfiles.toArray(),
};
