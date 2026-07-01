import {ISuperdesk, IArticle, IAuthoringAction} from 'superdesk-api';
import {AUTHORING_MENU_GROUPS} from 'core/constants';
import {manageMarkedUserForSingleArticle} from './managed-marked-user';
import {updateMarkedUser, canChangeMarkedUser} from './common';

export function getActionsInitialize(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

    return function getActions(article: IArticle): Array<IAuthoringAction> {
        if (!canChangeMarkedUser(superdesk, article)) {
            return [];
        }

        const markForUser: IAuthoringAction = {
            label: gettext('Mark for user'),
            icon: 'icon-assign',
            group: AUTHORING_MENU_GROUPS.highlights,
            onTrigger: () => {
                manageMarkedUserForSingleArticle(superdesk, article);
            },
        };

        const unmark: IAuthoringAction = {
            label: gettext('Unmark user'),
            icon: 'icon-assign',
            group: AUTHORING_MENU_GROUPS.highlights,
            onTrigger: () => {
                updateMarkedUser(superdesk, article, {marked_for_user: null});
            },
        };

        const markForOtherUser: IAuthoringAction = {
            label: gettext('Mark for other user'),
            group: AUTHORING_MENU_GROUPS.highlights,
            icon: 'icon-assign',
            onTrigger: () => {
                manageMarkedUserForSingleArticle(superdesk, article);
            },
        };

        if (article.marked_for_user == null) {
            return [markForUser];
        } else {
            return [unmark, markForOtherUser];
        }
    };
}
