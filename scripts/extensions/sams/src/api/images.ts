import {IAbortablePromise} from 'superdesk-api';
import {IAssetItem} from '../interfaces';
import {superdeskApi} from '../apis';

const RENDITION_RESOURCE = 'sams/assets/images/';

export function getAssetRendition(
    assetId: IAssetItem['_id'],
    width?: number,
    height?: number,
    keepProportions: boolean = true,
): IAbortablePromise<Blob> {
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
    const query = superdeskApi.dataApi.abortableQueryRaw(baseUrl + (urlParams ? `?${urlParams}` : ''));

    return {
        response: query.response.then((res) => res.blob()),
        abort: query.abort,
    };
}
