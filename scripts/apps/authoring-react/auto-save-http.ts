import {httpRequestJsonLocal, httpRequestRawLocal} from 'core/helpers/network';
import {Cancelable, throttle} from 'lodash';
import {IArticle} from 'superdesk-api';
import {IAuthoringAutoSave, omitFields} from './data-layer';

export class AutoSaveHttp implements IAuthoringAutoSave {
    autoSaveThrottled: ((getItem: () => IArticle) => void) & Cancelable;

    constructor(delay: number) {
        this.autoSaveThrottled = throttle(
            (getItem: () => IArticle) => {
                const item = getItem();

                httpRequestJsonLocal<IArticle>({
                    method: 'POST',
                    path: '/archive_autosave',
                    payload: omitFields(item),
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

    delete(item: IArticle) {
        return httpRequestRawLocal<IArticle>({
            method: 'DELETE',
            path: `/archive_autosave/${item._id}`,
            headers: {
                'If-Match': item._etag,
            },
        }).then(() => undefined);
    }

    schedule(getItem) {
        this.autoSaveThrottled(getItem);
    }

    cancel() {
        this.autoSaveThrottled.cancel();
    }
}
