import {IArticle, IRelatedArticle} from 'superdesk-api';

export const getViewImage = (item: IArticle) => item.renditions?.viewImage || item.renditions?.thumbnail;

export const getThumbnailForItem = (item: IArticle) => {
    if (!item.associations?.featuremedia) {
        return null;
    }

    const {featuremedia} = item.associations;

    if (associationIsArticle(featuremedia)) {
        return getViewImage(featuremedia);
    }

    return null;
};

export function associationIsArticle(a: IArticle | IRelatedArticle): a is IArticle {
    return a['_etag'] != null;
}

export function isMediaType(item: IArticle | null | undefined) {
    return item != null && ['audio', 'video', 'picture', 'graphic'].includes(item.type);
}
