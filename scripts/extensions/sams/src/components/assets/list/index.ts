import {IAssetItem} from '../../../interfaces';

import {AssetImageThumbnail} from './AssetImageThumbnail';

import {isImageAsset} from '../../../utils/assets';

export interface IAssetContentThumbnailProps {
    asset: Partial<IAssetItem>;
    file?: File;
}
type ThumbnailComponent = React.ComponentType<IAssetContentThumbnailProps> | null;

export function getThumbnailComponent(asset: Partial<IAssetItem>): ThumbnailComponent {
    if (isImageAsset(asset)) {
        return AssetImageThumbnail;
    }

    return null;
}
