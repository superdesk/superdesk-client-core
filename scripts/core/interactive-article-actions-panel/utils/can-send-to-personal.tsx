import {IArticle} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {sdApi} from 'api';

export function canSendToPersonal(items: Array<IArticle>) {
    const haveDeskSet = items.every((item) => item.task?.desk != null);

    return haveDeskSet
        && appConfig?.features?.sendToPersonal === true
        && sdApi.user.hasPrivilege('send_to_personal');
}
