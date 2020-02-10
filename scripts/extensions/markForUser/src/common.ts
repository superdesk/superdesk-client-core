import {ISuperdesk, IArticle, IUser} from 'superdesk-api';

export function canChangeMarkedUser(superdesk: ISuperdesk, article: IArticle) {
    const {isPersonal, isLockedInOtherSession, isArchived, isPublished} = superdesk.entities.article;

    if (
        isPersonal(article)
        || isArchived(article)
        || isPublished(article)
        || isLockedInOtherSession(article)
        || article.state === 'spiked'
    ) {
        return false;
    } else {
        return true;
    }
}

function canSendToDesk(superdesk: ISuperdesk, article: IArticle) {
    const {isLocked} = superdesk.entities.article;

    return !isLocked(article) && article.task?.desk != null;
}

export function updateMarkedUser(superdesk: ISuperdesk, article: IArticle, patch: Partial<IArticle>): void {
    superdesk.entities.article.patch(
        article,
        patch,
        {patchDirectlyAndOverwriteAuthoringValues: true},
    );
}

export function markForUserAndSendToNextStage(
    superdesk: ISuperdesk,
    article: IArticle,
    selectedUserId: IUser['_id'] | null,
) {
    const {logger} = superdesk.utilities;

    if (!canChangeMarkedUser(superdesk, article) || !canSendToDesk(superdesk, article)) {
        logger.warn('Can not mark and send', article);
        return;
    }

    const getTask = () => {
        const task: IArticle['task'] = article.task || null;

        if (task != null && task.desk != null) {
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

    return getTask().then((task) => {
        updateMarkedUser(superdesk, article, {marked_for_user: selectedUserId, task});
    });
}
