import {ISuperdesk, IArticle} from 'superdesk-api';
import {getMarkForUserModal} from './get-mark-for-user-modal';

export function manageMarkedUserForSingleArticle(superdesk: ISuperdesk, article: IArticle, sendToNextStage = false) {
    const task: IArticle['task'] = article.task || null;

    if (sendToNextStage && task?.desk) {
        superdesk.entities.desk.getDeskStages(task.desk)
            .then((stages) => {
                const currentStageIndex = stages.findIndex((stage) => task.stage === stage._id);

                if (currentStageIndex !== -1 && currentStageIndex + 1 < stages.length) {
                    task.stage = stages[currentStageIndex + 1]._id;
                }
            });
    }

    superdesk.ui.showModal(getMarkForUserModal(
        superdesk,
        (selectedUserId) => {
            superdesk.entities.article.update({
                ...article,
                marked_for_user: selectedUserId,
                task,
            });
        },
        superdesk.entities.article.isLocked(article) && article._id !== superdesk.state.articleInEditMode,
        article.marked_for_user === null ? undefined : article.marked_for_user,
    ));
}
