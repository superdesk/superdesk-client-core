import {httpRequestJsonLocal, httpRequestRawLocal} from 'core/helpers/network';
import {Cancelable, throttle} from 'lodash';
import {IArticle, IAuthoringAutoSave} from 'superdesk-api';
import {omitFields} from './data-layer';

export class AutoSaveHttp implements IAuthoringAutoSave<IArticle> {
    autoSaveThrottled: ((getItem: () => IArticle, callback: (autosaved: IArticle) => void) => void) & Cancelable;

    constructor(delay: number) {
        this.autoSaveThrottled = throttle(
            (getItem, callback) => {
                const item = getItem();

                httpRequestJsonLocal<IArticle>({
                    method: 'POST',
                    path: '/archive_autosave',
                    payload: omitFields(item),
                }).then((res) => {
                    callback(res);
                });
            },
            delay,
            {leading: false},
        );
    }

    get(id: IArticle['_id']) {
        return httpRequestJsonLocal<IArticle>({
            method: 'GET',
            path: `/archive_autosave/${id}`,
        });
    }

    delete(id: IArticle['_id'], etag: IArticle['_etag']) {
        return httpRequestRawLocal<IArticle>({
            method: 'DELETE',
            path: `/archive_autosave/${id}`,
            headers: {
                'If-Match': etag,
            },
        }).then(() => undefined);
    }

    schedule(getItem: () => IArticle, callback: (autosaved: IArticle) => void) {
        this.autoSaveThrottled(getItem, callback);
    }

    cancel() {
        this.autoSaveThrottled.cancel();
    }
}
