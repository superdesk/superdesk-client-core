import React from 'react';
import {IArticle} from 'superdesk-interfaces/Article';

const TYPES_MAPPING = {
    picture: 'photo',
    graphic: 'graphic',
    video: 'video',
    audio: 'audio',
};

/**
 * Render icon with count for each item type present in associations.
 */
export function associatedItems({item}: {item: IArticle}) {
    const associations = Object.values(item.associations || {});
    const icons = Object.keys(TYPES_MAPPING).map((type) => ({
        type: type,
        icon: TYPES_MAPPING[type],
        count: associations.filter((assoc: IArticle) => assoc != null && assoc.type === type).length,
    }))
        .filter((data) => data.count > 0)
        .map((associatedType) => (
            <span key={associatedType.type} className="sd-text-icon sd-text-icon--aligned-r">
                <i className={`icon-${associatedType.icon} sd-opacity--40`} />
                {associatedType.count}
            </span>
        ));

    return icons.length ? (
        <span style={{marginLeft: 'auto'}}>
            {icons}
        </span>
    ) : null;
}
