import {ISuperdesk, IArticle} from 'superdesk-api';
import {getMarkForUserModal} from './get-mark-for-user-modal';

export function manageMarkedUserForSingleArticle(superdesk: ISuperdesk, article: IArticle, sendToNextStage = false) {
    const getTask = () => {
        const task: IArticle['task'] = article.task || null;

        if (sendToNextStage && task != null && task.desk != null) {
            return superdesk.entities.desk.getStagesOrdered(task.desk)
                .then((stages) => {
                    const currentStageIndex = stages.findIndex((stage) => task.stage === stage._id);

                    if (currentStageIndex !== -1) {
                        const nextStageIndex = currentStageIndex + 1 === stages.length ? 0 : currentStageIndex + 1;

                        return {
                            ...task,
                            stage: stages[nextStageIndex]._id,
                        };
                    }

                    return task;
                });
        }

        return Promise.resolve(task);
    };

    superdesk.ui.showModal(getMarkForUserModal(
        superdesk,
        (selectedUserId) => {
            getTask().then((task) => {
                superdesk.entities.article.update({
                    ...article,
                    marked_for_user: selectedUserId,
                    task,
                });
            });
        },
        superdesk.entities.article.isLocked(article) && article._id !== superdesk.state.articleInEditMode,
        article.marked_for_user === null ? undefined : article.marked_for_user,
    ));
}
