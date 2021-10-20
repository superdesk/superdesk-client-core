import {IAssetItem} from '../../../interfaces';

import {isImageAsset, isVideoAsset, isAudioAsset} from '../../../utils/assets';

import {AssetImagePreview} from './AssetImagePreview';
import {AssetVideoPreview} from './AssetVideoPreview';
import {AssetAudioPreview} from './AssetAudioPreview';

export interface IAssetContentPreviewProps {
    asset: IAssetItem;
}

export function getPreviewComponent(asset: IAssetItem): React.ComponentType<IAssetContentPreviewProps> | null {
    if (isImageAsset(asset)) {
        return AssetImagePreview;
    } else if (isVideoAsset(asset)) {
        return AssetVideoPreview;
    } else if (isAudioAsset(asset)) {
        return AssetAudioPreview;
    }

    return null;
}
