import {IArticle, onPublishMiddlewareResult} from 'superdesk-api';

export interface IPlanningAssignmentService {
    onPublishFromAuthoring: (item: IArticle) => Promise<onPublishMiddlewareResult>;
    onArchiveRewrite: (item: IArticle) => Promise<IArticle>;
}
