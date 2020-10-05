import React from 'react';
import {IArticle, IDesk} from 'superdesk-api';
import {PhotoDeskPreview} from './PhotoDeskPreview';
import {PhotoDeskInfo} from './PhotoDeskInfo';
import {PhotoDeskFooter} from './PhotoDeskFooter';
import {ILegacyMultiSelect, IMultiSelectNew} from './ItemList';

interface IProps {
    item: IArticle;
    desk: IDesk;
    swimlane: any;
    getActionsMenu: () => any;
    multiSelect: IMultiSelectNew | ILegacyMultiSelect;
}

export class ItemPhotoGrid extends React.Component<IProps, never> {
    render() {
        const {item, multiSelect} = this.props;

        return (
            <div className="sd-wrap-helper">
                <PhotoDeskPreview
                    item={item}
                    multiSelect={multiSelect}
                />
                <PhotoDeskInfo
                    item={item}
                />
                <PhotoDeskFooter
                    item={item}
                    getActionsMenu={this.props.getActionsMenu}
                />
                <div className="sd-grid-item__state-border" />
            </div>
        );
    }
}
