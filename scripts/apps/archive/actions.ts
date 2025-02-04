import {IArticle} from 'superdesk-api';

export function copy(item: IArticle, api, $rootScope) {
    return api.save('copy', {}, {}, item)
        .then((archiveItem) => {
            item.task_id = archiveItem.task_id;
            item.created = archiveItem._created;
            $rootScope.$broadcast('item:copy');
        }, (response) => {
            item.error = response;
        })
        .finally(() => {
            if (item.actioning) {
                item.actioning.archiveContent = false;
            }
        });
}
