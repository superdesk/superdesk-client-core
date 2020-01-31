import {IExtension, IArticle, ISuperdesk, onPublishMiddlewareResult} from 'superdesk-api';
import {IPlanningConfig, IPlanningAssignmentService} from './interfaces';
import {getAssignmentService} from './utils';

function onSpike(superdesk: ISuperdesk, item: IArticle) {
    const {gettext} = superdesk.localization;

    if (item.assignment_id != null) {
        return Promise.resolve({
            warnings: [
                {
                    text: gettext('This item is linked to in-progress planning coverage.'),
                },
            ],
        });
    } else {
        return Promise.resolve({});
    }
}

function onSpikeMultiple(superdesk: ISuperdesk, items: Array<IArticle>) {
    const {gettext} = superdesk.localization;
    const itemsWithAssignmentsExist = items.some((item) => item.assignment_id != null);

    if (itemsWithAssignmentsExist) {
        return Promise.resolve({
            warnings: [
                {
                    text: gettext('Some items are linked to in-progress planning coverage.'),
                },
            ],
        });
    } else {
        return Promise.resolve({});
    }
}

function onPublishArticle(superdesk: ISuperdesk, item: IArticle): Promise<onPublishMiddlewareResult> {
    if (!superdesk || !superdesk.instance || !superdesk.instance.deployConfig) {
        return Promise.resolve({});
    }

    const deployConfig: IPlanningConfig = superdesk.instance.deployConfig as IPlanningConfig;

    if (deployConfig && deployConfig.config && deployConfig.config.planning_check_for_assignment_on_publish) {
        const assignmentService: IPlanningAssignmentService = getAssignmentService();

        return assignmentService.onPublishFromAuthoring(item);
    }

    return Promise.resolve({});
}

function onArticleRewriteAfter(superdesk: ISuperdesk, item: IArticle): Promise<IArticle> {
    if (!superdesk || !superdesk.instance || !superdesk.instance.deployConfig) {
        return Promise.resolve(item);
    }
    
    const deployConfig: IPlanningConfig = superdesk.instance.deployConfig as IPlanningConfig;

    if (deployConfig && deployConfig.config && deployConfig.config.planning_link_updates_to_coverage) {
        const assignmentService: IPlanningAssignmentService = getAssignmentService();

        return assignmentService.onArchiveRewrite(item);
    }

    return Promise.resolve(item);
}

const extension: IExtension = {
    activate: (superdesk: ISuperdesk) => {
        return Promise.resolve({
            contributions: {
                entities: {
                    article: {
                        onSpike: (item: IArticle) => onSpike(superdesk, item),
                        onSpikeMultiple: (items: Array<IArticle>) => onSpikeMultiple(superdesk, items),
                        onPublish: (item: IArticle) => onPublishArticle(superdesk, item),
                        onRewriteAfter: (item: IArticle) => onArticleRewriteAfter(superdesk, item),
                    },
                },
            },
        });
    },
};

export default extension;
