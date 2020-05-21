import {IArticle} from 'superdesk-api';

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

export function associationIsArticle(a: any): a is IArticle {
    return a.renditions != null;
}

