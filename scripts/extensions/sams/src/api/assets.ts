// Types
import {ISuperdesk} from 'superdesk-api';
import {IAssetItem} from '../interfaces';

const resource = '/sams/assets';

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
