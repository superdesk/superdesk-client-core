import {IArticle, IBaseRestApiResponse} from 'superdesk-api';

// It's not entirely correct to extend from IBaseRestApiResponse since macro doesn't have an _id
// I'm still extending to make it compatible with other types depending on IBaseRestApiResponse
export interface IMacro extends IBaseRestApiResponse {
    access_type: string;
    action_type: string;
    description?: string;
    label: string;
    name: string;
    replace_type: string;
    item?: Partial<IArticle>;
}
