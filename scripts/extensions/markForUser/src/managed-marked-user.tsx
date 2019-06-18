import {ISuperdesk, IArticle} from "superdesk-api";
import {getMarkForUserModal} from "./get-mark-for-user-modal";

export function manageMarkedUserForSingleArticle(superdesk: ISuperdesk, article: IArticle) {
    superdesk.ui.showModal(getMarkForUserModal(
        superdesk,
        (selectedUserId) => {
            superdesk.entities.article.update({
                ...article,
                marked_for_user: selectedUserId,
            });
        },
        superdesk.entities.article.isLocked(article),
        article.marked_for_user === null ? undefined : article.marked_for_user,
    ));
}
