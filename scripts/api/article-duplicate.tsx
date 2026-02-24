import {IArticle} from 'superdesk-api';
import {ISendToDestination} from 'core/interactive-article-actions-panel/interfaces';
import {assertNever} from 'core/helpers/typescript-helpers';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {notify} from 'core/notify/notify';
import {gettextPlural} from 'core/utils';
import {sdApi} from 'api';
import ng from 'core/services/ng';

export function duplicateItems(
    itemIds: Array<IArticle['_id']>,
    destination: ISendToDestination,
    preserveEmbargoAndSchedule?: boolean,
): Promise<Array<IArticle>> {
    return Promise.all(
        itemIds.map((id) => {
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
                        preserve_embargo_and_schedule: preserveEmbargoAndSchedule,
                    };
                } else {
                    assertNever(destination);
                }
            })();

            return httpRequestJsonLocal({
                method: 'POST',
                path: `/archive/${id}/duplicate`,
                payload: payload,
            });
        }),
    ).then((res: Array<IArticle>) => {
        notify.success(gettextPlural(
            itemIds.length,
            'Item duplicated',
            'Items duplicated',
        ));

        sdApi.preferences.update('destination:active', destination);

        // TODO: Not sure if needed. Remove when monitoring view is moved to React.
        ng.get('$rootScope').$broadcast('item:duplicate');

        return res;
    });
}
