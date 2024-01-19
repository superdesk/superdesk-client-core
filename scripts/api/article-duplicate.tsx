import {IArticle} from 'superdesk-api';
import {ISendToDestination} from 'core/interactive-article-actions-panel/interfaces';
import {assertNever} from 'core/helpers/typescript-helpers';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {notify} from 'core/notify/notify';
import {gettextPlural} from 'core/utils';
import {sdApi} from 'api';
import ng from 'core/services/ng';

export function duplicateItems(items: Array<IArticle>, destination: ISendToDestination): Promise<Array<IArticle>> {
    return Promise.all(
        items.map((item) => {
            const payload = (() => {
                if (destination.type === 'personal-space') {
                    return {
                        type: 'archive',
                        desk: null,
                    };
                } else if (destination.type === 'desk') {
                    return {
                        type: 'archive',
                        desk: destination.desk,
                        stage: destination.stage,
                    };
                } else {
                    assertNever(destination);
                }
            })();

            return httpRequestJsonLocal({
                method: 'POST',
                path: `/archive/${item._id}/duplicate`,
                payload: payload,
            });
        }),
    ).then((res: Array<IArticle>) => {
        notify.success(gettextPlural(
            items.length,
            'Item duplicated',
            'Items duplicated',
        ));

        sdApi.preferences.update('destination:active', destination);

        // TODO: Not sure if needed. Remove when monitoring view is moved to React.
        ng.get('$rootScope').$broadcast('item:duplicate');

        return res;
    });
}
