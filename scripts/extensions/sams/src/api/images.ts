import {IAssetItem} from '../interfaces';
import {superdeskApi} from '../apis';

const RENDITION_RESOURCE = 'sams/assets/images/';

export function getAssetRenditionUrl(
    assetId: IAssetItem['_id'],
    width?: number,
    height?: number,
    keepProportions: boolean = true,
): string {
    const {server} = superdeskApi.instance.config;
    const baseUrl = RENDITION_RESOURCE + assetId;
    const params: {[key: string]: any} = {};

    if (width != null) {
        params['width'] = width;
    }
    if (height != null) {
        params['height'] = height;
    }
    params['keep_proportions'] = keepProportions;

    const urlParams = (new URLSearchParams(params)).toString();

    return server.url + '/' + baseUrl + (urlParams ? `?${urlParams}` : '');
}
