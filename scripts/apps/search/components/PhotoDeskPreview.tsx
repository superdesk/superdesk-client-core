import React from 'react';
import {IArticle} from 'superdesk-api';
import {getViewImage} from 'core/helpers/item';
import {ILegacyMultiSelect, IMultiSelectNew} from './ItemList';
import {MultiSelectCheckbox} from './MultiSelectCheckbox';

interface IProps {
    item: IArticle;
    multiSelect: IMultiSelectNew | ILegacyMultiSelect;
}

/**
 * Media Preview - renders item thumbnail
 */
export const PhotoDeskPreview: React.StatelessComponent<IProps> = (props) => {
    const {multiSelect} = props;
    const item = props.item;
    const classType = 'sd-grid-item__type-icon filetype-icon-' + props.item.type;

    let preview = <i className={classType} />;
    const thumnail = getViewImage(props.item);

    if (thumnail != null) {
        preview = <img src={thumnail.href} />;
    }

    return (
        <div className="sd-grid-item__thumb">
            {preview}
            <MultiSelectCheckbox
                item={item}
                multiSelect={multiSelect}
            />
        </div>
    );
};
