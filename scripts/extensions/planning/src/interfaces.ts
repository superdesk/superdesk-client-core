import {IArticle, onPublishMiddlewareResult, IDeployConfigMain} from 'superdesk-api';

export interface IPlanningConfigMain extends IDeployConfigMain {
    planning_check_for_assignment_on_publish?: boolean;
    planning_link_updates_to_coverage?: boolean;
}

export interface IPlanningConfig {
    config?: IPlanningConfigMain;
}

export interface IPlanningAssignmentService {
    onPublishFromAuthoring: (item: IArticle) => Promise<onPublishMiddlewareResult>;
    onArchiveRewrite: (item: IArticle) => Promise<IArticle>;
}
