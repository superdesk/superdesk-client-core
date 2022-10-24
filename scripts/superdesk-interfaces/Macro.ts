import {IArticle, IBaseRestApiResponse} from 'superdesk-api';

// It's not entirely correct to extend from IBaseRestApiResponse since macro doesn't have an _id
// I'm still extending to make it compatible with other types depending on IBaseRestApiResponse
export interface IMacro extends IBaseRestApiResponse {
    access_type: string;
    action_type: 'interactive' | 'direct';
    description?: string;
    label: string;
    name: string;

    // Replace type only applies to non-interactive macros
    replace_type?: 'simple-replace' | 'keep-style-replace' | 'editor_state' | 'no-replace';
    item?: Partial<IArticle>;
    group?: string;
    order?: number;
    diff?: {[key: string]: string};
}
