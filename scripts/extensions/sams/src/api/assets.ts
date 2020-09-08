// Types
import {ISuperdesk} from 'superdesk-api';
import {IAssetItem} from '../interfaces';

const resource = '/sams/assets';
const countResource = 'sams/assets/counts/';

export function uploadAsset(
    superdesk: ISuperdesk,
    data: FormData,
    onProgress: (event: ProgressEvent) => void,
): Promise<IAssetItem> {
    return superdesk.dataApi.uploadFileWithProgress(
        resource,
        data,
        onProgress,
    );
}

export function getAssetsCount(superdesk: ISuperdesk, set_ids: string[]): Promise<object> {
    const {gettext} = superdesk.localization;
    const {notify} = superdesk.ui;

    return superdesk.dataApi.query<any>(
        countResource + JSON.stringify(set_ids),
        1,
        {field: 'name', direction: 'ascending'},
        {}
    )
        .then((response: object) => {
            return response;
        })
        .catch((error: any) => {
            notify.error(gettext('Failed to get assets counts for sets'));
            return Promise.reject(error);
        });
}
