import {IAssetItem} from '../../../interfaces';

import {isImageAsset} from '../../../utils/assets';

import {AssetImagePreview} from './AssetImagePreview';

export interface IAssetContentPreviewProps {
    asset: IAssetItem;
}

export function getPreviewComponent(asset: IAssetItem): React.ComponentType<IAssetContentPreviewProps> | null {
    if (isImageAsset(asset)) {
        return AssetImagePreview;
    }

    return null;
}
