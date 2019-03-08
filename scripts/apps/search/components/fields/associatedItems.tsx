import React from 'react';
import {IArticle} from 'superdesk-interfaces/Article';

const TYPES_TO_ICONS = {
    picture: 'icon-photo',
    graphic: 'icon-graphic',
    video: 'icon-video',
    audio: 'icon-audio',
};

/**
 * Render icon with count for each item type present in associations.
 */
export function associatedItems({item}: {item: IArticle}) {
    const associations = Object.values(item.associations || {});
    const icons = Object.keys(TYPES_TO_ICONS).map((type) => ({
        type: type,
        icon: TYPES_TO_ICONS[type],
        count: associations.filter((assoc: IArticle) => assoc != null && assoc.type === type).length,
    }))
        .filter((data) => data.count > 0)
        .map((associatedType) => (
            <span key={associatedType.type} className="sd-text-icon sd-text-icon--aligned-r">
                <i className={`${associatedType.icon} sd-opacity--40`} />
                {associatedType.count}
            </span>
        ));

    return icons.length ? (
        <span style={{marginLeft: 'auto'}}> {/* push it right */}
            {icons}
        </span>
    ) : null;
}
