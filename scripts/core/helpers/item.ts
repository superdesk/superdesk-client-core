import {IArticle} from 'superdesk-api';

export const getViewImage = (item: IArticle) => item.renditions?.viewImage || item.renditions?.thumbnail;
