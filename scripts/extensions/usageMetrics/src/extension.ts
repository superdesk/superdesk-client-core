import {ISuperdesk, IExtension, IArticle} from 'superdesk-api';
import {debounce, Cancelable} from 'lodash';

let registerPreviewDebounced: ((article: IArticle) => void) & Cancelable;

const extension: IExtension = {
    id: 'usage-metrics',
    activate: (superdesk: ISuperdesk) => {
        const {httpRequestJsonLocal} = superdesk;
        const {dateToServerString} = superdesk.utilities;

        superdesk.session.getCurrentUser().then((user) => {
            registerPreviewDebounced = debounce((article: IArticle) => {
                httpRequestJsonLocal({
                    method: 'POST',
                    path: '/usage-metrics',
                    payload: {
                        action: 'preview',
                        user: user._id,
                        item: article._id,
                        date: dateToServerString(new Date()),
                    },
                });
            }, 1000);

            superdesk.addEventListener('articleEditStart', (article) => {
                httpRequestJsonLocal({
                    method: 'POST',
                    path: '/usage-metrics',
                    payload: {
                        action: 'edit',
                        user: user._id,
                        item: article._id,
                        date: dateToServerString(new Date()),
                    },
                });
            });

            superdesk.addEventListener('articlePreviewStart', (article) => {
                registerPreviewDebounced(article);
            });

            superdesk.addEventListener('articlePreviewEnd', () => {
                registerPreviewDebounced.cancel();
            });
        });

        return Promise.resolve({});
    },
};

export default extension;
